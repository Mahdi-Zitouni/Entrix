import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';

describe('OrderItem (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/order-items (GET)', () => {
    return request(app.getHttpServer())
      .get('/order-items')
      .expect(200);
  });

  afterAll(async () => {
    await app.close();
  });
}); 