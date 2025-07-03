import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';

describe('EventSchedule (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/event-schedules (GET)', () => {
    return request(app.getHttpServer())
      .get('/event-schedules')
      .expect(200);
  });

  afterAll(async () => {
    await app.close();
  });
}); 