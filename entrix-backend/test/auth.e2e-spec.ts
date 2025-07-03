import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

describe('AuthController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
        AppModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('/auth/register (POST)', () => {
    it('should register a new user successfully', () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'TestPassword123!',
        firstName: 'John',
        lastName: 'Doe',
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
        firstName: 'John',
        lastName: 'Doe',
      };

      return request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(400);
    });

    it('should fail with weak password', () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'weak',
        firstName: 'John',
        lastName: 'Doe',
      };

      return request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(400);
    });
  });

  describe('/auth/login (POST)', () => {
    it('should login successfully with valid credentials', async () => {
      // First register a user
      const registerDto = {
        email: 'login@example.com',
        password: 'TestPassword123!',
        firstName: 'Jane',
        lastName: 'Doe',
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201);

      // Then login
      const loginDto = {
        email: 'login@example.com',
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

  describe('/auth/refresh (POST)', () => {
    it('should refresh token successfully', async () => {
      // First register and login to get tokens
      const registerDto = {
        email: 'refresh@example.com',
        password: 'TestPassword123!',
        firstName: 'Refresh',
        lastName: 'User',
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201);

      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'refresh@example.com',
          password: 'TestPassword123!',
        })
        .expect(200);

      const refreshToken = loginResponse.body.refreshToken;

      return request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('accessToken');
          expect(res.body).toHaveProperty('refreshToken');
          expect(res.body.accessToken).not.toBe(loginResponse.body.accessToken);
        });
    });

    it('should fail with invalid refresh token', () => {
      return request(app.getHttpServer())
        .post('/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);
    });
  });

  describe('/auth/logout (POST)', () => {
    it('should logout successfully', async () => {
      // First register and login to get tokens
      const registerDto = {
        email: 'logout@example.com',
        password: 'TestPassword123!',
        firstName: 'Logout',
        lastName: 'User',
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201);

      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'logout@example.com',
          password: 'TestPassword123!',
        })
        .expect(200);

      const accessToken = loginResponse.body.accessToken;

      return request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
    });
  });

  describe('/auth/forgot-password (POST)', () => {
    it('should send password reset email', async () => {
      // First register a user
      const registerDto = {
        email: 'reset@example.com',
        password: 'TestPassword123!',
        firstName: 'Reset',
        lastName: 'User',
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201);

      return request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({ email: 'reset@example.com' })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
        });
    });

    it('should handle non-existent email gracefully', () => {
      return request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' })
        .expect(200);
    });
  });

  describe('/auth/reset-password (POST)', () => {
    it('should reset password with valid token', async () => {
      // First register a user
      const registerDto = {
        email: 'reset2@example.com',
        password: 'TestPassword123!',
        firstName: 'Reset2',
        lastName: 'User',
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201);

      // Request password reset
      await request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({ email: 'reset2@example.com' })
        .expect(200);

      // Reset password (using mock token)
      const resetDto = {
        token: 'mock-reset-token',
        newPassword: 'NewPassword123!',
      };

      return request(app.getHttpServer())
        .post('/auth/reset-password')
        .send(resetDto)
        .expect(200);
    });
  });

  describe('/auth/verify-email (POST)', () => {
    it('should verify email with valid token', async () => {
      // First register a user
      const registerDto = {
        email: 'verify@example.com',
        password: 'TestPassword123!',
        firstName: 'Verify',
        lastName: 'User',
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201);

      // Verify email (using mock token)
      return request(app.getHttpServer())
        .post('/auth/verify-email')
        .send({ token: 'mock-verification-token' })
        .expect(200);
    });
  });

  describe('/auth/resend-verification (POST)', () => {
    it('should resend verification email', async () => {
      // First register a user
      const registerDto = {
        email: 'resend@example.com',
        password: 'TestPassword123!',
        firstName: 'Resend',
        lastName: 'User',
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201);

      return request(app.getHttpServer())
        .post('/auth/resend-verification')
        .send({ email: 'resend@example.com' })
        .expect(200);
    });
  });

  describe('/auth/mfa/setup (POST)', () => {
    it('should setup MFA for user', async () => {
      // First register and login
      const registerDto = {
        email: 'mfa@example.com',
        password: 'TestPassword123!',
        firstName: 'MFA',
        lastName: 'User',
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201);

      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'mfa@example.com',
          password: 'TestPassword123!',
        })
        .expect(200);

      const accessToken = loginResponse.body.accessToken;

      return request(app.getHttpServer())
        .post('/auth/mfa/setup')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('qrCode');
          expect(res.body).toHaveProperty('secret');
        });
    });
  });

  describe('/auth/mfa/verify (POST)', () => {
    it('should verify MFA token', async () => {
      // First register and login
      const registerDto = {
        email: 'mfaverify@example.com',
        password: 'TestPassword123!',
        firstName: 'MFAVerify',
        lastName: 'User',
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201);

      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'mfaverify@example.com',
          password: 'TestPassword123!',
        })
        .expect(200);

      const accessToken = loginResponse.body.accessToken;

      return request(app.getHttpServer())
        .post('/auth/mfa/verify')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ token: '123456' })
        .expect(200);
    });
  });

  describe('/auth/profile (GET)', () => {
    it('should get user profile', async () => {
      // First register and login
      const registerDto = {
        email: 'profile@example.com',
        password: 'TestPassword123!',
        firstName: 'Profile',
        lastName: 'User',
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201);

      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'profile@example.com',
          password: 'TestPassword123!',
        })
        .expect(200);

      const accessToken = loginResponse.body.accessToken;

      return request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('email', 'profile@example.com');
          expect(res.body).toHaveProperty('firstName', 'Profile');
          expect(res.body).toHaveProperty('lastName', 'User');
        });
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .get('/auth/profile')
        .expect(401);
    });
  });

  describe('/auth/profile (PUT)', () => {
    it('should update user profile', async () => {
      // First register and login
      const registerDto = {
        email: 'update@example.com',
        password: 'TestPassword123!',
        firstName: 'Update',
        lastName: 'User',
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201);

      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'update@example.com',
          password: 'TestPassword123!',
        })
        .expect(200);

      const accessToken = loginResponse.body.accessToken;

      const updateDto = {
        firstName: 'Updated',
        lastName: 'Name',
        phoneNumber: '+1234567890',
      };

      return request(app.getHttpServer())
        .put('/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateDto)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('firstName', 'Updated');
          expect(res.body).toHaveProperty('lastName', 'Name');
          expect(res.body).toHaveProperty('phoneNumber', '+1234567890');
        });
    });
  });

  describe('/auth/change-password (POST)', () => {
    it('should change password successfully', async () => {
      // First register and login
      const registerDto = {
        email: 'changepass@example.com',
        password: 'TestPassword123!',
        firstName: 'ChangePass',
        lastName: 'User',
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201);

      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'changepass@example.com',
          password: 'TestPassword123!',
        })
        .expect(200);

      const accessToken = loginResponse.body.accessToken;

      const changePasswordDto = {
        currentPassword: 'TestPassword123!',
        newPassword: 'NewPassword123!',
      };

      return request(app.getHttpServer())
        .post('/auth/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(changePasswordDto)
        .expect(200);
    });

    it('should fail with wrong current password', async () => {
      // First register and login
      const registerDto = {
        email: 'wrongpass@example.com',
        password: 'TestPassword123!',
        firstName: 'WrongPass',
        lastName: 'User',
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201);

      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'wrongpass@example.com',
          password: 'TestPassword123!',
        })
        .expect(200);

      const accessToken = loginResponse.body.accessToken;

      const changePasswordDto = {
        currentPassword: 'WrongPassword123!',
        newPassword: 'NewPassword123!',
      };

      return request(app.getHttpServer())
        .post('/auth/change-password')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(changePasswordDto)
        .expect(400);
    });
  });
}); 