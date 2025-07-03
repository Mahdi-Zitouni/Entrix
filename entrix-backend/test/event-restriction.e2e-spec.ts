import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';

describe('EventRestriction (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/event-restrictions (GET)', () => {
    return request(app.getHttpServer())
      .get('/event-restrictions')
      .expect(200);
  });

  afterAll(async () => {
    await app.close();
  });
}); 