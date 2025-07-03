import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { ConfigModule } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { User } from '../src/modules/users/user.entity';
import { Event } from '../src/modules/events/event.entity';
import { Venue } from '../src/modules/venues/venue.entity';
import { Ticket } from '../src/modules/ticketing/ticket.entity';
import { Order } from '../src/modules/payments/order.entity';
import { NotificationTemplate } from '../src/modules/notifications/notification-template.entity';
import { AuditLog } from '../src/modules/security/audit-log.entity';

export interface TestUser {
  id: string;
  email: string;
  accessToken: string;
  refreshToken: string;
}

export interface TestEvent {
  id: string;
  title: string;
  venueId: string;
}

export interface TestVenue {
  id: string;
  name: string;
}

export class TestHelper {
  static app: INestApplication;
  static userRepo: Repository<User>;
  static eventRepo: Repository<Event>;
  static venueRepo: Repository<Venue>;
  static ticketRepo: Repository<Ticket>;
  static orderRepo: Repository<Order>;
  static notificationTemplateRepo: Repository<NotificationTemplate>;
  static auditLogRepo: Repository<AuditLog>;

  static async setupTestApp(): Promise<INestApplication> {
    // Set test environment variables
    process.env.DB_HOST = '196.179.229.147';
    process.env.DB_PORT = '5432';
    process.env.DB_USERNAME = 'souhail';
    process.env.DB_PASSWORD = 'MS2023;!M';
    process.env.DB_DATABASE = 'entrix_test';
    process.env.JWT_SECRET = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMn0.KMUFsIDTnFmyG3nMiGM6H9FNFUROf3wh7SmqJp-QV30';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
        }),
        AppModule,
      ],
    }).compile();

    this.app = moduleFixture.createNestApplication();
    await this.app.init();

    // Get repositories for cleanup
    this.userRepo = moduleFixture.get<Repository<User>>(getRepositoryToken(User));
    this.eventRepo = moduleFixture.get<Repository<Event>>(getRepositoryToken(Event));
    this.venueRepo = moduleFixture.get<Repository<Venue>>(getRepositoryToken(Venue));
    this.ticketRepo = moduleFixture.get<Repository<Ticket>>(getRepositoryToken(Ticket));
    this.orderRepo = moduleFixture.get<Repository<Order>>(getRepositoryToken(Order));
    this.notificationTemplateRepo = moduleFixture.get<Repository<NotificationTemplate>>(
      getRepositoryToken(NotificationTemplate)
    );
    this.auditLogRepo = moduleFixture.get<Repository<AuditLog>>(getRepositoryToken(AuditLog));

    return this.app;
  }

  static async cleanupDatabase(): Promise<void> {
    try {
      // Use delete instead of clear to avoid foreign key constraint issues
      if (this.auditLogRepo) await this.auditLogRepo.delete({});
      if (this.ticketRepo) await this.ticketRepo.delete({});
      if (this.orderRepo) await this.orderRepo.delete({});
      if (this.eventRepo) await this.eventRepo.delete({});
      if (this.venueRepo) await this.venueRepo.delete({});
      if (this.notificationTemplateRepo) await this.notificationTemplateRepo.delete({});
      if (this.userRepo) await this.userRepo.delete({ email: Like('%@example.com') });
    } catch (error) {
      console.warn('Database cleanup error:', error.message);
    }
  }

  static async closeTestApp(): Promise<void> {
    try {
      if (this.app) {
        await this.app.close();
      }
    } catch (error) {
      console.warn('App close error:', error.message);
    }
  }

  static async createTestUser(email: string = 'test@example.com'): Promise<TestUser> {
    const registerDto = {
      email,
      password: 'TestPassword123!',
      firstName: 'Test',
      lastName: 'User',
      phoneNumber: '+1234567890',
    };

    await request(this.app.getHttpServer())
      .post('/auth/register')
      .send(registerDto)
      .expect(201);

    const loginResponse = await request(this.app.getHttpServer())
      .post('/auth/login')
      .send({
        email: registerDto.email,
        password: registerDto.password,
      })
      .expect(200);

    return {
      id: loginResponse.body.user.id,
      email: loginResponse.body.user.email,
      accessToken: loginResponse.body.accessToken,
      refreshToken: loginResponse.body.refreshToken,
    };
  }

  static async createTestVenue(user: TestUser): Promise<TestVenue> {
    const venueDto = {
      name: 'Test Venue',
      address: '123 Test Street',
      city: 'Test City',
      country: 'Test Country',
      postalCode: '12345',
      capacity: 1000,
      description: 'A test venue for testing',
      contactEmail: 'venue@test.com',
      contactPhone: '+1234567890',
    };

    const response = await request(this.app.getHttpServer())
      .post('/venues')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send(venueDto)
      .expect(201);

    return {
      id: response.body.id,
      name: response.body.name,
    };
  }

  static async createTestEvent(user: TestUser, venueId: string): Promise<TestEvent> {
    const eventDto = {
      title: 'Test Event',
      description: 'A test event for testing',
      startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString(), // 3 hours later
      venueId,
      category: 'CONCERT',
      status: 'DRAFT',
      maxCapacity: 500,
      ticketPrice: 50.00,
      currency: 'USD',
    };

    const response = await request(this.app.getHttpServer())
      .post('/events')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send(eventDto)
      .expect(201);

    return {
      id: response.body.id,
      title: response.body.title,
      venueId: response.body.venueId,
    };
  }

  static getAuthHeaders(user: TestUser): { Authorization: string } {
    return { Authorization: `Bearer ${user.accessToken}` };
  }
} 