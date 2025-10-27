import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../app.module';
import { PrismaClient } from '@prisma/client';

describe('Authentication (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Apply same global pipes as main.ts
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();

    prisma = new PrismaClient();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user successfully', () => {
      const timestamp = Date.now();
      const registerDto = {
        email: `test${timestamp}@example.com`,
        password: 'SecurePass123!',
        userType: 'PERSONAL',
      };

      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(registerDto)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('accessToken');
          expect(res.body).toHaveProperty('tokenType', 'bearer');
          expect(res.body).toHaveProperty('expiresIn', 86400);
          expect(res.body.user).toHaveProperty('email', registerDto.email);
          expect(res.body.user).toHaveProperty('userType', registerDto.userType);
          expect(res.body.user).toHaveProperty('id');
        });
    });

    it('should reject duplicate email registration', async () => {
      const timestamp = Date.now();
      const registerDto = {
        email: `duplicate${timestamp}@example.com`,
        password: 'SecurePass123!',
        userType: 'PERSONAL',
      };

      // First registration
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(registerDto)
        .expect(201);

      // Duplicate registration
      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(registerDto)
        .expect(409);
    });

    it('should validate email format', () => {
      const registerDto = {
        email: 'invalid-email',
        password: 'SecurePass123!',
        userType: 'PERSONAL',
      };

      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(registerDto)
        .expect(400);
    });

    it('should validate password length', () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'short',
        userType: 'PERSONAL',
      };

      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(registerDto)
        .expect(400);
    });

    it('should validate userType enum', () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'SecurePass123!',
        userType: 'INVALID_TYPE',
      };

      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(registerDto)
        .expect(400);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    const timestamp = Date.now();
    const testUser = {
      email: `login${timestamp}@example.com`,
      password: 'SecurePass123!',
      userType: 'PERSONAL',
    };

    beforeAll(async () => {
      // Register a test user
      await request(app.getHttpServer()).post('/api/v1/auth/register').send(testUser);
    });

    it('should login with valid credentials', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('accessToken');
          expect(res.body).toHaveProperty('tokenType', 'bearer');
          expect(res.body.user).toHaveProperty('email', testUser.email);
        });
    });

    it('should reject invalid email', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: testUser.password,
        })
        .expect(401);
    });

    it('should reject invalid password', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword123!',
        })
        .expect(401);
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    let accessToken: string;

    beforeAll(async () => {
      const timestamp = Date.now();
      const testUser = {
        email: `refresh${timestamp}@example.com`,
        password: 'SecurePass123!',
        userType: 'PERSONAL',
      };

      const res = await request(app.getHttpServer()).post('/api/v1/auth/register').send(testUser);

      accessToken = res.body.accessToken;
    });

    it('should refresh token with valid credentials', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('accessToken');
          expect(res.body).toHaveProperty('tokenType', 'bearer');
          expect(res.body).toHaveProperty('expiresIn', 86400);
        });
    });

    it('should reject refresh without token', () => {
      return request(app.getHttpServer()).post('/api/v1/auth/refresh').expect(401);
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    let accessToken: string;

    beforeEach(async () => {
      const timestamp = Date.now();
      const testUser = {
        email: `logout${timestamp}@example.com`,
        password: 'SecurePass123!',
        userType: 'PERSONAL',
      };

      const res = await request(app.getHttpServer()).post('/api/v1/auth/register').send(testUser);

      accessToken = res.body.accessToken;
    });

    it('should logout successfully', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('message', 'Logout successful');
        });
    });

    it('should reject requests with logged out token', async () => {
      // Logout
      await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Try to use the same token after logout
      return request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(401);
    });

    it('should reject logout without token', () => {
      return request(app.getHttpServer()).post('/api/v1/auth/logout').expect(401);
    });
  });
});
