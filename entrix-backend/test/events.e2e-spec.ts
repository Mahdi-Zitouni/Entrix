import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { TestHelper } from './test-utils';

describe('EventsController (e2e)', () => {
  let app: INestApplication;
  let testUser: any;
  let testVenue: any;

  beforeAll(async () => {
    app = await TestHelper.setupTestApp();
  });

  afterAll(async () => {
    await TestHelper.cleanupDatabase();
    await TestHelper.closeTestApp();
  });

  beforeEach(async () => {
    await TestHelper.cleanupDatabase();
    testUser = await TestHelper.createTestUser('organizer@example.com');
    testVenue = await TestHelper.createTestVenue(testUser);
  });

  describe('/events (POST)', () => {
    it('should create a new event', async () => {
      const eventDto = {
        title: 'Test Concert',
        description: 'A great test concert',
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString(),
        venueId: testVenue.id,
        category: 'CONCERT',
        status: 'DRAFT',
        maxCapacity: 500,
        ticketPrice: 50.00,
        currency: 'USD',
        organizerId: testUser.id,
      };

      return request(app.getHttpServer())
        .post('/events')
        .set(TestHelper.getAuthHeaders(testUser))
        .send(eventDto)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('title', eventDto.title);
          expect(res.body).toHaveProperty('venueId', eventDto.venueId);
          expect(res.body).toHaveProperty('status', eventDto.status);
        });
    });

    it('should fail with invalid venue id', async () => {
      const eventDto = {
        title: 'Test Event',
        description: 'A test event',
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString(),
        venueId: 'invalid-venue-id',
        category: 'CONCERT',
        status: 'DRAFT',
        maxCapacity: 500,
        ticketPrice: 50.00,
        currency: 'USD',
      };

      return request(app.getHttpServer())
        .post('/events')
        .set(TestHelper.getAuthHeaders(testUser))
        .send(eventDto)
        .expect(400);
    });
  });

  describe('/events (GET)', () => {
    beforeEach(async () => {
      // Create multiple events for testing
      const eventDto = {
        title: 'Test Event 1',
        description: 'First test event',
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString(),
        venueId: testVenue.id,
        category: 'CONCERT',
        status: 'PUBLISHED',
        maxCapacity: 500,
        ticketPrice: 50.00,
        currency: 'USD',
      };

      await request(app.getHttpServer())
        .post('/events')
        .set(TestHelper.getAuthHeaders(testUser))
        .send(eventDto);

      const eventDto2 = {
        title: 'Test Event 2',
        description: 'Second test event',
        startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString(),
        venueId: testVenue.id,
        category: 'CONFERENCE',
        status: 'PUBLISHED',
        maxCapacity: 200,
        ticketPrice: 100.00,
        currency: 'USD',
      };

      await request(app.getHttpServer())
        .post('/events')
        .set(TestHelper.getAuthHeaders(testUser))
        .send(eventDto2);
    });

    it('should get all events with pagination', async () => {
      return request(app.getHttpServer())
        .get('/events?page=1&limit=10')
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

    it('should filter events by category', async () => {
      return request(app.getHttpServer())
        .get('/events?category=CONCERT')
        .expect(200)
        .expect((res) => {
          expect(res.body.data.every((event: any) => event.category === 'CONCERT')).toBe(true);
        });
    });

    it('should filter events by status', async () => {
      return request(app.getHttpServer())
        .get('/events?status=PUBLISHED')
        .expect(200)
        .expect((res) => {
          expect(res.body.data.every((event: any) => event.status === 'PUBLISHED')).toBe(true);
        });
    });

    it('should search events by title', async () => {
      return request(app.getHttpServer())
        .get('/events?search=Test Event 1')
        .expect(200)
        .expect((res) => {
          expect(res.body.data.some((event: any) => event.title.includes('Test Event 1'))).toBe(true);
        });
    });

    it('should filter events by date range', async () => {
      const startDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString();
      const endDate = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString();

      return request(app.getHttpServer())
        .get(`/events?startDate=${startDate}&endDate=${endDate}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.data.length).toBeGreaterThan(0);
        });
    });
  });

  describe('/events/:id (GET)', () => {
    let testEvent: any;

    beforeEach(async () => {
      const eventDto = {
        title: 'Test Event',
        description: 'A test event',
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString(),
        venueId: testVenue.id,
        category: 'CONCERT',
        status: 'PUBLISHED',
        maxCapacity: 500,
        ticketPrice: 50.00,
        currency: 'USD',
      };

      const response = await request(app.getHttpServer())
        .post('/events')
        .set(TestHelper.getAuthHeaders(testUser))
        .send(eventDto)
        .expect(201);

      testEvent = response.body;
    });

    it('should get event by id', async () => {
      return request(app.getHttpServer())
        .get(`/events/${testEvent.id}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', testEvent.id);
          expect(res.body).toHaveProperty('title', testEvent.title);
          expect(res.body).toHaveProperty('venue');
        });
    });

    it('should return 404 for non-existent event', async () => {
      return request(app.getHttpServer())
        .get('/events/non-existent-id')
        .expect(404);
    });
  });

  describe('/events/:id (PUT)', () => {
    let testEvent: any;

    beforeEach(async () => {
      const eventDto = {
        title: 'Test Event',
        description: 'A test event',
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString(),
        venueId: testVenue.id,
        category: 'CONCERT',
        status: 'DRAFT',
        maxCapacity: 500,
        ticketPrice: 50.00,
        currency: 'USD',
      };

      const response = await request(app.getHttpServer())
        .post('/events')
        .set(TestHelper.getAuthHeaders(testUser))
        .send(eventDto)
        .expect(201);

      testEvent = response.body;
    });

    it('should update event', async () => {
      const updateDto = {
        title: 'Updated Event Title',
        description: 'Updated description',
        status: 'PUBLISHED',
        maxCapacity: 750,
        ticketPrice: 75.00,
      };

      return request(app.getHttpServer())
        .put(`/events/${testEvent.id}`)
        .set(TestHelper.getAuthHeaders(testUser))
        .send(updateDto)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('title', updateDto.title);
          expect(res.body).toHaveProperty('description', updateDto.description);
          expect(res.body).toHaveProperty('status', updateDto.status);
          expect(res.body).toHaveProperty('maxCapacity', updateDto.maxCapacity);
        });
    });
  });

  describe('/events/:id (DELETE)', () => {
    let testEvent: any;

    beforeEach(async () => {
      const eventDto = {
        title: 'Test Event to Delete',
        description: 'A test event to delete',
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString(),
        venueId: testVenue.id,
        category: 'CONCERT',
        status: 'DRAFT',
        maxCapacity: 500,
        ticketPrice: 50.00,
        currency: 'USD',
      };

      const response = await request(app.getHttpServer())
        .post('/events')
        .set(TestHelper.getAuthHeaders(testUser))
        .send(eventDto)
        .expect(201);

      testEvent = response.body;
    });

    it('should delete event', async () => {
      return request(app.getHttpServer())
        .delete(`/events/${testEvent.id}`)
        .set(TestHelper.getAuthHeaders(testUser))
        .expect(200);

      // Verify event is deleted
      return request(app.getHttpServer())
        .get(`/events/${testEvent.id}`)
        .expect(404);
    });
  });

  describe('/events/:id/status (PATCH)', () => {
    let testEvent: any;

    beforeEach(async () => {
      const eventDto = {
        title: 'Test Event',
        description: 'A test event',
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString(),
        venueId: testVenue.id,
        category: 'CONCERT',
        status: 'DRAFT',
        maxCapacity: 500,
        ticketPrice: 50.00,
        currency: 'USD',
      };

      const response = await request(app.getHttpServer())
        .post('/events')
        .set(TestHelper.getAuthHeaders(testUser))
        .send(eventDto)
        .expect(201);

      testEvent = response.body;
    });

    it('should update event status', async () => {
      const statusDto = { status: 'PUBLISHED' };

      return request(app.getHttpServer())
        .patch(`/events/${testEvent.id}/status`)
        .set(TestHelper.getAuthHeaders(testUser))
        .send(statusDto)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status', statusDto.status);
        });
    });
  });

  describe('/events/:id/media (POST)', () => {
    let testEvent: any;

    beforeEach(async () => {
      const eventDto = {
        title: 'Test Event',
        description: 'A test event',
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString(),
        venueId: testVenue.id,
        category: 'CONCERT',
        status: 'DRAFT',
        maxCapacity: 500,
        ticketPrice: 50.00,
        currency: 'USD',
      };

      const response = await request(app.getHttpServer())
        .post('/events')
        .set(TestHelper.getAuthHeaders(testUser))
        .send(eventDto)
        .expect(201);

      testEvent = response.body;
    });

    it('should upload event media', async () => {
      const mediaBuffer = Buffer.from('fake-media-data');
      
      return request(app.getHttpServer())
        .post(`/events/${testEvent.id}/media`)
        .set(TestHelper.getAuthHeaders(testUser))
        .attach('media', mediaBuffer, 'event-image.jpg')
        .field('type', 'IMAGE')
        .field('description', 'Event promotional image')
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('url');
          expect(res.body).toHaveProperty('type', 'IMAGE');
        });
    });
  });

  describe('/events/:id/participants (GET)', () => {
    let testEvent: any;

    beforeEach(async () => {
      const eventDto = {
        title: 'Test Event',
        description: 'A test event',
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString(),
        venueId: testVenue.id,
        category: 'CONCERT',
        status: 'PUBLISHED',
        maxCapacity: 500,
        ticketPrice: 50.00,
        currency: 'USD',
      };

      const response = await request(app.getHttpServer())
        .post('/events')
        .set(TestHelper.getAuthHeaders(testUser))
        .send(eventDto)
        .expect(201);

      testEvent = response.body;
    });

    it('should get event participants', async () => {
      return request(app.getHttpServer())
        .get(`/events/${testEvent.id}/participants`)
        .set(TestHelper.getAuthHeaders(testUser))
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('/events/:id/statistics (GET)', () => {
    let testEvent: any;

    beforeEach(async () => {
      const eventDto = {
        title: 'Test Event',
        description: 'A test event',
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString(),
        venueId: testVenue.id,
        category: 'CONCERT',
        status: 'PUBLISHED',
        maxCapacity: 500,
        ticketPrice: 50.00,
        currency: 'USD',
      };

      const response = await request(app.getHttpServer())
        .post('/events')
        .set(TestHelper.getAuthHeaders(testUser))
        .send(eventDto)
        .expect(201);

      testEvent = response.body;
    });

    it('should get event statistics', async () => {
      return request(app.getHttpServer())
        .get(`/events/${testEvent.id}/statistics`)
        .set(TestHelper.getAuthHeaders(testUser))
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('totalTickets');
          expect(res.body).toHaveProperty('soldTickets');
          expect(res.body).toHaveProperty('revenue');
          expect(res.body).toHaveProperty('occupancyRate');
        });
    });
  });

  describe('/events/search (GET)', () => {
    beforeEach(async () => {
      // Create events for search testing
      const eventDto = {
        title: 'Rock Concert',
        description: 'Amazing rock concert',
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString(),
        venueId: testVenue.id,
        category: 'CONCERT',
        status: 'PUBLISHED',
        maxCapacity: 500,
        ticketPrice: 50.00,
        currency: 'USD',
      };

      await request(app.getHttpServer())
        .post('/events')
        .set(TestHelper.getAuthHeaders(testUser))
        .send(eventDto);
    });

    it('should search events with advanced filters', async () => {
      return request(app.getHttpServer())
        .get('/events/search?q=rock&category=CONCERT&minPrice=0&maxPrice=100')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.some((event: any) => event.title.toLowerCase().includes('rock'))).toBe(true);
        });
    });
  });

  describe('/events/featured (GET)', () => {
    it('should get featured events', async () => {
      return request(app.getHttpServer())
        .get('/events/featured')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('/events/upcoming (GET)', () => {
    it('should get upcoming events', async () => {
      return request(app.getHttpServer())
        .get('/events/upcoming')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });
}); 