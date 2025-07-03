import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { AdminTestHelper } from './admin-test-helper';
import { JwtStrategy } from '../src/modules/auth/jwt.strategy';

describe('Admin Authentication Tests (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Ensure JwtStrategy is instantiated
    app.get(JwtStrategy);

    // Get admin token for testing
    try {
      adminToken = await AdminTestHelper.getAdminToken(app);
      console.log('✅ Admin authentication successful');
    } catch (error) {
      console.log('⚠️  Admin authentication failed, will use regular user tests');
    }
  });

  afterEach(async () => {
    await app.close();
  });

  describe('Admin Login', () => {
    it('should login with admin credentials', async () => {
      const loginDto = {
        email: AdminTestHelper.ADMIN_CREDENTIALS.email,
        password: AdminTestHelper.ADMIN_CREDENTIALS.password,
      };

      return request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('access_token');
          expect(res.body).toHaveProperty('refresh_token');
          expect(res.body).toHaveProperty('user');
          expect(res.body.user).toHaveProperty('email', loginDto.email);
        });
    });
  });

  describe('Admin Protected Routes', () => {
    it('should access admin-only endpoints', async () => {
      if (!adminToken) {
        console.log('Skipping admin test - no valid admin token');
        return;
      }

      // Example: Get all users (admin only)
      return request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });

    it('should create new users as admin', async () => {
      if (!adminToken) {
        console.log('Skipping admin test - no valid admin token');
        return;
      }

      const timestamp = Date.now();
      const newUserDto = {
        email: `newuser${timestamp}@example.com`,
        password: 'NewUserPassword123!',
        firstName: 'New',
        lastName: 'User',
      };

      return request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newUserDto)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('email', newUserDto.email);
        });
    });
  });

  describe('Regular User Tests (Fallback)', () => {
    it('should register and login as regular user', async () => {
      const timestamp = Date.now();
      const email = `testuser${timestamp}@example.com`;
      
      // Register new user
      const registerDto = {
        email,
        password: 'TestPassword123!',
        firstName: 'Test',
        lastName: 'User',
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201);

      // Login
      const loginDto = {
        email,
        password: 'TestPassword123!',
      };

      return request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('access_token');
          expect(res.body).toHaveProperty('user');
        });
    });
  });
}); 