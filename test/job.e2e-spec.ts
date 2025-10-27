import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma.service';

describe('Jobs (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken: string;
  let companyUserId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    // Register a company user for testing
    const timestamp = Date.now();
    const registerDto = {
      email: `company${timestamp}@example.com`,
      password: 'SecurePass123!',
      userType: 'COMPANY',
    };

    const registerRes = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send(registerDto);

    accessToken = registerRes.body.accessToken;
    companyUserId = registerRes.body.user.id;

    // Add recruiter role to user
    const recruiterRole = await prisma.role.findFirst({
      where: { roleName: 'recruiter' },
    });

    if (!recruiterRole) {
      const newRole = await prisma.role.create({
        data: { roleName: 'recruiter' },
      });
      await prisma.userRole.create({
        data: {
          userId: BigInt(companyUserId),
          roleId: newRole.id,
        },
      });
    } else {
      await prisma.userRole.create({
        data: {
          userId: BigInt(companyUserId),
          roleId: recruiterRole.id,
        },
      });
    }
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  describe('POST /api/v1/jobs', () => {
    it('should create a new job posting', () => {
      const createJobDto = {
        title: 'Senior Backend Developer',
        description: 'We are looking for an experienced backend developer...',
        employmentType: 'FULL_TIME',
        salaryType: 'YEARLY',
        salaryMin: 50000,
        salaryMax: 80000,
        expiresAt: '2025-12-31T23:59:59Z',
      };

      return request(app.getHttpServer())
        .post('/api/v1/jobs')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(createJobDto)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('title', createJobDto.title);
          expect(res.body).toHaveProperty('status', 'DRAFT');
        });
    });

    it('should reject job creation without authentication', () => {
      const createJobDto = {
        title: 'Senior Backend Developer',
        description: 'We are looking for...',
        expiresAt: '2025-12-31T23:59:59Z',
      };

      return request(app.getHttpServer()).post('/api/v1/jobs').send(createJobDto).expect(401);
    });
  });

  describe('GET /api/v1/jobs', () => {
    it('should return list of jobs', () => {
      return request(app.getHttpServer())
        .get('/api/v1/jobs')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('meta');
          expect(Array.isArray(res.body.data)).toBe(true);
          expect(res.body.meta).toHaveProperty('total');
          expect(res.body.meta).toHaveProperty('page');
          expect(res.body.meta).toHaveProperty('limit');
        });
    });

    it('should support pagination', () => {
      return request(app.getHttpServer())
        .get('/api/v1/jobs?page=1&limit=5')
        .expect(200)
        .expect((res) => {
          expect(res.body.meta.page).toBe(1);
          expect(res.body.meta.limit).toBe(5);
        });
    });
  });

  describe('GET /api/v1/jobs/:id', () => {
    let jobId: number;

    beforeAll(async () => {
      const createJobDto = {
        title: 'Frontend Developer',
        description: 'React expert needed',
        expiresAt: '2025-12-31T23:59:59Z',
      };

      const res = await request(app.getHttpServer())
        .post('/api/v1/jobs')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(createJobDto);

      jobId = res.body.id;
    });

    it('should return a job by id', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/jobs/${jobId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', jobId);
          expect(res.body).toHaveProperty('title');
        });
    });

    it('should return 404 for non-existent job', () => {
      return request(app.getHttpServer()).get('/api/v1/jobs/999999').expect(404);
    });
  });

  describe('PUT /api/v1/jobs/:id', () => {
    let jobId: number;

    beforeAll(async () => {
      const createJobDto = {
        title: 'DevOps Engineer',
        description: 'Kubernetes expert',
        expiresAt: '2025-12-31T23:59:59Z',
      };

      const res = await request(app.getHttpServer())
        .post('/api/v1/jobs')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(createJobDto);

      jobId = res.body.id;
    });

    it('should update a job', () => {
      const updateDto = {
        title: 'Senior DevOps Engineer',
        status: 'ACTIVE',
      };

      return request(app.getHttpServer())
        .put(`/api/v1/jobs/${jobId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateDto)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('title', updateDto.title);
          expect(res.body).toHaveProperty('status', updateDto.status);
        });
    });

    it('should reject update without authentication', () => {
      return request(app.getHttpServer())
        .put(`/api/v1/jobs/${jobId}`)
        .send({ title: 'New Title' })
        .expect(401);
    });
  });

  describe('DELETE /api/v1/jobs/:id', () => {
    let jobId: number;

    beforeAll(async () => {
      const createJobDto = {
        title: 'Data Analyst',
        description: 'SQL expert',
        expiresAt: '2025-12-31T23:59:59Z',
      };

      const res = await request(app.getHttpServer())
        .post('/api/v1/jobs')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(createJobDto);

      jobId = res.body.id;
    });

    it('should soft delete a job', async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/jobs/${jobId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(204);

      // Verify job is marked as DELETED
      return request(app.getHttpServer()).get(`/api/v1/jobs/${jobId}`).expect(404);
    });
  });
});
