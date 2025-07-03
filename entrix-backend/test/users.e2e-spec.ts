import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { ConfigModule } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { User } from '../src/modules/users/user.entity';

describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let userRepo: Repository<User>;
  let testUser: any;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    userRepo = moduleFixture.get<Repository<User>>(getRepositoryToken(User));

    // Create test user with unique email
    const timestamp = Date.now();
    const registerDto = {
      email: `admin${timestamp}@example.com`,
      password: 'TestPassword123!',
      firstName: 'Test',
      lastName: 'User',
      phoneNumber: '+1234567890',
    };

    // Try to register, but handle if user already exists
    try {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201);
    } catch (error) {
      // If user exists, try to login instead
      console.log('User already exists, trying to login...');
    }

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: registerDto.email,
        password: registerDto.password,
      })
      .expect(200);

    testUser = {
      id: loginResponse.body.user.id,
      email: loginResponse.body.user.email,
      accessToken: loginResponse.body.accessToken,
      refreshToken: loginResponse.body.refreshToken,
    };
  });

  afterEach(async () => {
    // Clean up database - use delete instead of clear to avoid foreign key issues
    if (userRepo) {
      try {
        // Delete test users by email pattern
        await userRepo.delete({ email: Like('%@example.com') });
      } catch (error) {
        console.log('Cleanup error:', error.message);
      }
    }
    await app.close();
  });

  describe('/users (GET)', () => {
    it('should get all users with pagination', async () => {
      // Create additional users with unique emails
      const timestamp = Date.now();
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: `user1${timestamp}@example.com`,
          password: 'TestPassword123!',
          firstName: 'User1',
          lastName: 'Test1',
        })
        .expect(201);

      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: `user2${timestamp}@example.com`,
          password: 'TestPassword123!',
          firstName: 'User2',
          lastName: 'Test2',
        })
        .expect(201);

      return request(app.getHttpServer())
        .get('/users?page=1&limit=10')
        .set('Authorization', `Bearer ${testUser.accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('total');
          expect(res.body).toHaveProperty('page');
          expect(res.body).toHaveProperty('limit');
          expect(Array.isArray(res.body.data)).toBe(true);
          expect(res.body.data.length).toBeGreaterThan(0);
        });
    });

    it('should filter users by status', async () => {
      return request(app.getHttpServer())
        .get('/users?status=ACTIVE')
        .set('Authorization', `Bearer ${testUser.accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.data.every((user: any) => user.status === 'ACTIVE')).toBe(true);
        });
    });

    it('should search users by name', async () => {
      return request(app.getHttpServer())
        .get('/users?search=Test')
        .set('Authorization', `Bearer ${testUser.accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.data.some((user: any) => 
            user.firstName.includes('Test') || user.lastName.includes('User')
          )).toBe(true);
        });
    });
  });

  describe('/users/:id (GET)', () => {
    it('should get user by id', async () => {
      return request(app.getHttpServer())
        .get(`/users/${testUser.id}`)
        .set('Authorization', `Bearer ${testUser.accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', testUser.id);
          expect(res.body).toHaveProperty('email', testUser.email);
          expect(res.body).toHaveProperty('firstName');
          expect(res.body).toHaveProperty('lastName');
        });
    });

    it('should return 404 for non-existent user', async () => {
      return request(app.getHttpServer())
        .get('/users/non-existent-id')
        .set('Authorization', `Bearer ${testUser.accessToken}`)
        .expect(404);
    });
  });

  describe('/users/:id (PUT)', () => {
    it('should update user profile', async () => {
      const updateDto = {
        firstName: 'Updated',
        lastName: 'Name',
        phoneNumber: '+9876543210',
        dateOfBirth: '1990-01-01',
        address: 'Updated Address',
        city: 'Updated City',
        country: 'Updated Country',
        postalCode: '54321',
      };

      return request(app.getHttpServer())
        .put(`/users/${testUser.id}`)
        .set('Authorization', `Bearer ${testUser.accessToken}`)
        .send(updateDto)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('firstName', updateDto.firstName);
          expect(res.body).toHaveProperty('lastName', updateDto.lastName);
          expect(res.body).toHaveProperty('phoneNumber', updateDto.phoneNumber);
        });
    });

    it('should return 403 when updating another user', async () => {
      // Create another user with unique email
      const timestamp = Date.now();
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: `other${timestamp}@example.com`,
          password: 'TestPassword123!',
          firstName: 'Other',
          lastName: 'User',
        })
        .expect(201);

      const otherUserResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: `other${timestamp}@example.com`,
          password: 'TestPassword123!',
        })
        .expect(200);

      const updateDto = { firstName: 'Updated' };

      return request(app.getHttpServer())
        .put(`/users/${otherUserResponse.body.user.id}`)
        .set('Authorization', `Bearer ${testUser.accessToken}`)
        .send(updateDto)
        .expect(403);
    });
  });

  describe('/users/:id/status (PATCH)', () => {
    it('should update user status', async () => {
      const statusDto = { status: 'SUSPENDED' };

      return request(app.getHttpServer())
        .patch(`/users/${testUser.id}/status`)
        .set('Authorization', `Bearer ${testUser.accessToken}`)
        .send(statusDto)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status', statusDto.status);
        });
    });
  });

  describe('/users/:id/avatar (POST)', () => {
    it('should upload user avatar', async () => {
      const avatarBuffer = Buffer.from('fake-image-data');
      
      return request(app.getHttpServer())
        .post(`/users/${testUser.id}/avatar`)
        .set('Authorization', `Bearer ${testUser.accessToken}`)
        .attach('avatar', avatarBuffer, 'avatar.jpg')
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('avatarUrl');
        });
    });
  });

  describe('/users/:id/preferences (GET)', () => {
    it('should get user preferences', async () => {
      return request(app.getHttpServer())
        .get(`/users/${testUser.id}/preferences`)
        .set('Authorization', `Bearer ${testUser.accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('notifications');
          expect(res.body).toHaveProperty('privacy');
          expect(res.body).toHaveProperty('language');
        });
    });
  });

  describe('/users/:id/preferences (PUT)', () => {
    it('should update user preferences', async () => {
      const preferencesDto = {
        notifications: {
          email: true,
          sms: false,
          push: true,
        },
        privacy: {
          profileVisibility: 'PUBLIC',
          showEmail: false,
          showPhone: false,
        },
        language: 'en',
        timezone: 'UTC',
      };

      return request(app.getHttpServer())
        .put(`/users/${testUser.id}/preferences`)
        .set('Authorization', `Bearer ${testUser.accessToken}`)
        .send(preferencesDto)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('notifications');
          expect(res.body).toHaveProperty('privacy');
          expect(res.body).toHaveProperty('language', 'en');
        });
    });
  });

  describe('/users/:id/activity (GET)', () => {
    it('should get user activity', async () => {
      return request(app.getHttpServer())
        .get(`/users/${testUser.id}/activity`)
        .set('Authorization', `Bearer ${testUser.accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('/users/:id/tickets (GET)', () => {
    it('should get user tickets', async () => {
      return request(app.getHttpServer())
        .get(`/users/${testUser.id}/tickets`)
        .set('Authorization', `Bearer ${testUser.accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('/users/:id/events (GET)', () => {
    it('should get user events', async () => {
      return request(app.getHttpServer())
        .get(`/users/${testUser.id}/events`)
        .set('Authorization', `Bearer ${testUser.accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('/users/verify-email (POST)', () => {
    it('should send email verification', async () => {
      const verifyDto = { email: testUser.email };

      return request(app.getHttpServer())
        .post('/users/verify-email')
        .send(verifyDto)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
        });
    });
  });

  describe('/users/verify-phone (POST)', () => {
    it('should send phone verification', async () => {
      const verifyDto = { phoneNumber: '+1234567890' };

      return request(app.getHttpServer())
        .post('/users/verify-phone')
        .send(verifyDto)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
        });
    });
  });

  describe('/users/bulk-import (POST)', () => {
    it('should import users from CSV', async () => {
      const csvData = 'email,firstName,lastName,phoneNumber\nuser1@test.com,User1,Test1,+1234567891\nuser2@test.com,User2,Test2,+1234567892';
      const csvBuffer = Buffer.from(csvData);

      return request(app.getHttpServer())
        .post('/users/bulk-import')
        .set('Authorization', `Bearer ${testUser.accessToken}`)
        .attach('file', csvBuffer, 'users.csv')
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('imported');
          expect(res.body).toHaveProperty('failed');
        });
    });
  });

  describe('/users/:id/audit-logs (GET)', () => {
    it('should get user audit logs', async () => {
      return request(app.getHttpServer())
        .get(`/users/${testUser.id}/audit-logs`)
        .set('Authorization', `Bearer ${testUser.accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('/users/analytics (GET)', () => {
    it('should get user analytics', async () => {
      return request(app.getHttpServer())
        .get('/users/analytics')
        .set('Authorization', `Bearer ${testUser.accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('totalUsers');
          expect(res.body).toHaveProperty('activeUsers');
          expect(res.body).toHaveProperty('newUsers');
          expect(res.body).toHaveProperty('userGrowth');
        });
    });
  });
}); 