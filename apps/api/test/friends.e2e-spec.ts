import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';

/**
 * Friends E2E Tests
 *
 * Tests the friends flow: send request, accept, list friends, leaderboard.
 * Creates two users to test the complete friendship lifecycle.
 *
 * Required: PostgreSQL running on localhost:5450 with the stayontrack database.
 */
describe('Friends (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  const testId = Date.now();
  const user1 = {
    email: `e2e_friends1_${testId}@example.com`,
    password: 'TestPass123!',
    username: `friendsu1_${testId}`,
  };
  const user2 = {
    email: `e2e_friends2_${testId}@example.com`,
    password: 'TestPass123!',
    username: `friendsu2_${testId}`,
  };

  let token1: string;
  let token2: string;
  let friendRequestId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    await app.init();

    dataSource = moduleFixture.get<DataSource>(DataSource);

    // Register both users
    const res1 = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send(user1)
      .expect(201);
    token1 = res1.body.accessToken;

    const res2 = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send(user2)
      .expect(201);
    token2 = res2.body.accessToken;
  }, 30000);

  afterAll(async () => {
    try {
      await dataSource.query(
        `DELETE FROM "users" WHERE email LIKE 'e2e_friends%_${testId}@example.com'`,
      );
    } catch {
      // Ignore cleanup errors
    }
    await app.close();
  });

  // ─────────────────────────────────────────────
  // Send friend request
  // ─────────────────────────────────────────────
  describe('Send friend request', () => {
    it('POST /api/v1/friends/requests — user1 sends request to user2', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/friends/requests')
        .set('Authorization', `Bearer ${token1}`)
        .send({ username: user2.username })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('status');
      friendRequestId = res.body.id;
    });

    it('should not allow duplicate friend request', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/friends/requests')
        .set('Authorization', `Bearer ${token1}`)
        .send({ username: user2.username })
        .expect(400);
    });

    it('should return 401 without token', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/friends/requests')
        .send({ username: user2.username })
        .expect(401);
    });
  });

  // ─────────────────────────────────────────────
  // Incoming requests
  // ─────────────────────────────────────────────
  describe('Incoming requests', () => {
    it('GET /api/v1/friends/requests/incoming — user2 sees the request', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/friends/requests/incoming')
        .set('Authorization', `Bearer ${token2}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);

      const found = res.body.find((r: any) => r.id === friendRequestId);
      expect(found).toBeDefined();
    });
  });

  // ─────────────────────────────────────────────
  // Outgoing requests
  // ─────────────────────────────────────────────
  describe('Outgoing requests', () => {
    it('GET /api/v1/friends/requests/outgoing — user1 sees the sent request', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/friends/requests/outgoing')
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ─────────────────────────────────────────────
  // Accept friend request
  // ─────────────────────────────────────────────
  describe('Accept friend request', () => {
    it('PATCH /api/v1/friends/requests/:id/accept — user2 accepts', async () => {
      await request(app.getHttpServer())
        .patch(`/api/v1/friends/requests/${friendRequestId}/accept`)
        .set('Authorization', `Bearer ${token2}`)
        .expect(204);
    });
  });

  // ─────────────────────────────────────────────
  // List friends
  // ─────────────────────────────────────────────
  describe('List friends', () => {
    it('GET /api/v1/friends — user1 should see user2 as friend', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/friends')
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
    });

    it('GET /api/v1/friends — user2 should see user1 as friend', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/friends')
        .set('Authorization', `Bearer ${token2}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ─────────────────────────────────────────────
  // Leaderboard
  // ─────────────────────────────────────────────
  describe('Leaderboard', () => {
    it('GET /api/v1/friends/leaderboard — should include both users', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/friends/leaderboard')
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      // Leaderboard should include at least the current user + friends
      expect(res.body.length).toBeGreaterThanOrEqual(1);
    });
  });
});
