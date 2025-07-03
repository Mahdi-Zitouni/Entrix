import request from 'supertest';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { getConnection } from 'typeorm';

describe('SeatMap API (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;
  let venueId: string;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
    await app.init();
    // Create admin user and get token (assume /auth/login works)
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: 'admin', password: 'adminpass' });
    adminToken = res.body.access_token;
    // Create a venue
    const venueRes = await request(app.getHttpServer())
      .post('/venues')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Test Venue', code: 'TV1', address: '123 Test St' });
    venueId = venueRes.body.id;
  });

  afterAll(async () => {
    await getConnection().close();
    await app.close();
  });

  it('Admin can update and fetch seat map', async () => {
    const map = {
      zones: [
        {
          id: 'zone1',
          name: 'Zone 1',
          code: 'Z1',
          level: 1,
          displayOrder: 1,
          zoneType: 'SEATING_AREA',
          category: 'STANDARD',
          capacity: 100,
          hasSeats: true,
          isActive: true,
          seats: [
            {
              id: 'seat1',
              reference: 'A1',
              seatType: 'STANDARD',
              status: 'AVAILABLE',
            },
          ],
        },
      ],
    };
    // Update seat map
    const res = await request(app.getHttpServer())
      .post(`/venues/${venueId}/seat-map`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send(map)
      .expect(200);
    expect(res.body.updatedZones).toBe(1);
    expect(res.body.updatedSeats).toBe(1);
    // Fetch seat map
    const getRes = await request(app.getHttpServer())
      .get(`/venues/${venueId}/seat-map`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(getRes.body.zones[0].id).toBe('zone1');
    expect(getRes.body.zones[0].seats[0].id).toBe('seat1');
  });

  // More tests for invalid map, non-admin, audit log, etc. can be added here
}); 