import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Basic API Tests (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('Health Check', () => {
    it('should return 200 for health check', () => {
      return request(app.getHttpServer())
        .get('/')
        .expect(200);
    });
  });

  describe('Auth Registration', () => {
    it('should register a new user successfully', () => {
      const timestamp = Date.now();
      const registerDto = {
        email: `test${timestamp}@example.com`,
        password: 'TestPassword123!',
        firstName: 'Test',
        lastName: 'User',
        phoneNumber: '+1234567890',
      };

      return request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('email', registerDto.email);
          expect(res.body).toHaveProperty('firstName', registerDto.firstName);
          expect(res.body).toHaveProperty('lastName', registerDto.lastName);
          expect(res.body).not.toHaveProperty('password');
        });
    });

    it('should fail with invalid email format', () => {
      const registerDto = {
        email: 'invalid-email',
        password: 'TestPassword123!',
        firstName: 'Test',
        lastName: 'User',
      };

      return request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(400);
    });
  });

  describe('Auth Login', () => {
    it('should login successfully with valid credentials', async () => {
      const timestamp = Date.now();
      const email = `login${timestamp}@example.com`;
      
      // First register a user
      const registerDto = {
        email,
        password: 'TestPassword123!',
        firstName: 'Login',
        lastName: 'User',
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201);

      // Then login
      const loginDto = {
        email,
        password: 'TestPassword123!',
      };

      return request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('accessToken');
          expect(res.body).toHaveProperty('refreshToken');
          expect(res.body).toHaveProperty('user');
          expect(res.body.user).toHaveProperty('email', loginDto.email);
        });
    });

    it('should fail with invalid credentials', () => {
      const loginDto = {
        email: 'nonexistent@example.com',
        password: 'WrongPassword123!',
      };

      return request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(401);
    });
  });
}); 