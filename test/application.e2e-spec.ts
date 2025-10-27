import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma.service';

describe('Applications (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jobseekerAccessToken: string;
  let jobseekerUserId: number;
  let recruiterAccessToken: string;
  let recruiterUserId: number;
  let jobId: number;
  let resumeId: number;

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

    // Register a jobseeker user
    const timestamp = Date.now();
    const jobseekerRegisterDto = {
      email: `jobseeker${timestamp}@example.com`,
      password: 'SecurePass123!',
      userType: 'PERSONAL',
    };

    const jobseekerRes = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send(jobseekerRegisterDto);

    jobseekerAccessToken = jobseekerRes.body.accessToken;
    jobseekerUserId = jobseekerRes.body.user.id;

    // Add jobseeker role
    const jobseekerRole = await prisma.role.findFirst({
      where: { roleName: 'jobseeker' },
    });

    if (jobseekerRole) {
      await prisma.userRole.create({
        data: {
          userId: BigInt(jobseekerUserId),
          roleId: jobseekerRole.id,
        },
      });
    }

    // Register a recruiter user
    const recruiterRegisterDto = {
      email: `recruiter${timestamp}@example.com`,
      password: 'SecurePass123!',
      userType: 'COMPANY',
    };

    const recruiterRes = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send(recruiterRegisterDto);

    recruiterAccessToken = recruiterRes.body.accessToken;
    recruiterUserId = recruiterRes.body.user.id;

    // Add recruiter role
    const recruiterRole = await prisma.role.findFirst({
      where: { roleName: 'recruiter' },
    });

    if (recruiterRole) {
      await prisma.userRole.create({
        data: {
          userId: BigInt(recruiterUserId),
          roleId: recruiterRole.id,
        },
      });
    }

    // Create a job by recruiter
    const createJobDto = {
      title: 'Backend Developer Position',
      description: 'We are looking for an experienced backend developer',
      employmentType: 'FULL_TIME',
      salaryType: 'YEARLY',
      salaryMin: 50000,
      salaryMax: 80000,
      expiresAt: '2025-12-31T23:59:59Z',
    };

    const jobRes = await request(app.getHttpServer())
      .post('/api/v1/jobs')
      .set('Authorization', `Bearer ${recruiterAccessToken}`)
      .send(createJobDto);

    jobId = jobRes.body.id;

    // Update job to ACTIVE status
    await prisma.job.update({
      where: { id: BigInt(jobId) },
      data: { status: 'ACTIVE' },
    });

    // Create a resume for jobseeker
    const resume = await prisma.resume.create({
      data: {
        jobseekerUserId: BigInt(jobseekerUserId),
        title: 'Software Engineer Resume',
        introduction: 'Experienced software engineer',
        isDefault: true,
      },
    });

    resumeId = Number(resume.id);
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  describe('POST /api/v1/applications', () => {
    it('should create a new application', () => {
      const createApplicationDto = {
        jobId: jobId,
        resumeId: resumeId,
      };

      return request(app.getHttpServer())
        .post('/api/v1/applications')
        .set('Authorization', `Bearer ${jobseekerAccessToken}`)
        .send(createApplicationDto)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('jobId', jobId);
          expect(res.body).toHaveProperty('resumeId', resumeId);
          expect(res.body).toHaveProperty('status', 'ACTIVE');
        });
    });

    it('should reject application creation without authentication', () => {
      const createApplicationDto = {
        jobId: jobId,
        resumeId: resumeId,
      };

      return request(app.getHttpServer())
        .post('/api/v1/applications')
        .send(createApplicationDto)
        .expect(401);
    });

    it('should reject duplicate application', async () => {
      const createApplicationDto = {
        jobId: jobId,
        resumeId: resumeId,
      };

      return request(app.getHttpServer())
        .post('/api/v1/applications')
        .set('Authorization', `Bearer ${jobseekerAccessToken}`)
        .send(createApplicationDto)
        .expect(409); // Conflict - duplicate application
    });
  });

  describe('GET /api/v1/applications', () => {
    it('should return list of applications for jobseeker', () => {
      return request(app.getHttpServer())
        .get('/api/v1/applications')
        .set('Authorization', `Bearer ${jobseekerAccessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('meta');
          expect(Array.isArray(res.body.data)).toBe(true);
          expect(res.body.data.length).toBeGreaterThan(0);
        });
    });

    it('should return list of applications for recruiter', () => {
      return request(app.getHttpServer())
        .get('/api/v1/applications')
        .set('Authorization', `Bearer ${recruiterAccessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('meta');
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });

    it('should support pagination', () => {
      return request(app.getHttpServer())
        .get('/api/v1/applications?page=1&limit=5')
        .set('Authorization', `Bearer ${jobseekerAccessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.meta.page).toBe(1);
          expect(res.body.meta.limit).toBe(5);
        });
    });

    it('should support status filtering', () => {
      return request(app.getHttpServer())
        .get('/api/v1/applications?status=ACTIVE')
        .set('Authorization', `Bearer ${jobseekerAccessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.data.every((app: any) => app.status === 'ACTIVE')).toBe(true);
        });
    });
  });

  describe('GET /api/v1/applications/:id', () => {
    let applicationId: number;

    beforeAll(async () => {
      const application = await prisma.jobApplication.findFirst({
        where: {
          jobseekerUserId: BigInt(jobseekerUserId),
        },
      });
      applicationId = Number(application?.id);
    });

    it('should return an application by id for jobseeker', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/applications/${applicationId}`)
        .set('Authorization', `Bearer ${jobseekerAccessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', applicationId);
          expect(res.body).toHaveProperty('status');
        });
    });

    it('should return an application by id for recruiter of the job', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/applications/${applicationId}`)
        .set('Authorization', `Bearer ${recruiterAccessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', applicationId);
        });
    });

    it('should return 404 for non-existent application', () => {
      return request(app.getHttpServer())
        .get('/api/v1/applications/999999')
        .set('Authorization', `Bearer ${jobseekerAccessToken}`)
        .expect(404);
    });
  });

  describe('PUT /api/v1/applications/:id', () => {
    let applicationId: number;

    beforeAll(async () => {
      const application = await prisma.jobApplication.findFirst({
        where: {
          jobseekerUserId: BigInt(jobseekerUserId),
        },
      });
      applicationId = Number(application?.id);
    });

    it('should allow recruiter to update application status', () => {
      const updateDto = {
        status: 'HIRED',
      };

      return request(app.getHttpServer())
        .put(`/api/v1/applications/${applicationId}`)
        .set('Authorization', `Bearer ${recruiterAccessToken}`)
        .send(updateDto)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status', 'HIRED');
        });
    });

    it('should reject update without authentication', () => {
      return request(app.getHttpServer())
        .put(`/api/v1/applications/${applicationId}`)
        .send({ status: 'ACTIVE' })
        .expect(401);
    });
  });

  describe('DELETE /api/v1/applications/:id', () => {
    let withdrawApplicationId: number;

    beforeAll(async () => {
      // Create another job and application for withdrawal test
      const job = await prisma.job.create({
        data: {
          companyUserId: BigInt(recruiterUserId),
          title: 'Test Job for Withdrawal',
          description: 'Test description',
          status: 'ACTIVE',
          expiresAt: new Date('2025-12-31'),
        },
      });

      // Get default stage
      let stage = await prisma.jobApplicationStage.findFirst({
        where: {
          companyUserId: BigInt(recruiterUserId),
          isDefaultStage: true,
        },
      });

      if (!stage) {
        stage = await prisma.jobApplicationStage.create({
          data: {
            companyUserId: BigInt(recruiterUserId),
            stageName: 'Applied',
            stageOrder: 1,
            isDefaultStage: true,
          },
        });
      }

      const application = await prisma.jobApplication.create({
        data: {
          jobId: job.id,
          jobseekerUserId: BigInt(jobseekerUserId),
          resumeId: BigInt(resumeId),
          currentStageId: stage.id,
          status: 'ACTIVE',
        },
      });

      withdrawApplicationId = Number(application.id);
    });

    it('should allow jobseeker to withdraw their application', async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/applications/${withdrawApplicationId}`)
        .set('Authorization', `Bearer ${jobseekerAccessToken}`)
        .expect(204);

      // Verify application is withdrawn
      const application = await prisma.jobApplication.findUnique({
        where: { id: BigInt(withdrawApplicationId) },
      });

      expect(application?.status).toBe('WITHDRAWN_BY_USER');
    });
  });
});
