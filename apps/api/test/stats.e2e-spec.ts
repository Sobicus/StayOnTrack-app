import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';

/**
 * Stats E2E Tests
 *
 * Tests the stats endpoints after performing a check-in to ensure
 * calculated values (calories, money, trends) are correct.
 *
 * Required: PostgreSQL running on localhost:5450 with the stayontrack database.
 */
describe('Stats (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  const testId = Date.now();
  const testUser = {
    email: `e2e_stats_${testId}@example.com`,
    password: 'TestPass123!',
    username: `statsuser_${testId}`,
  };

  let accessToken: string;

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

    // Register a test user
    const registerRes = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send(testUser)
      .expect(201);

    accessToken = registerRes.body.accessToken;

    // Create a habit and check in so stats have data
    const habitRes = await request(app.getHttpServer())
      .post('/api/v1/habits')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: 'No Snacks',
        caloriesPerOccurrence: 400,
        pricePerOccurrence: 6,
      })
      .expect(201);

    const today = new Date().toISOString().split('T')[0];

    await request(app.getHttpServer())
      .post('/api/v1/habit-logs')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        habitId: habitRes.body.id,
        status: 'AVOIDED',
        date: today,
      })
      .expect(201);
  }, 30000);

  afterAll(async () => {
    try {
      await dataSource.query(
        `DELETE FROM "users" WHERE email LIKE 'e2e_stats_%@example.com'`,
      );
    } catch {
      // Ignore cleanup errors
    }
    await app.close();
  });

  // ─────────────────────────────────────────────
  // GET /api/v1/stats
  // ─────────────────────────────────────────────
  describe('GET /api/v1/stats', () => {
    it('should return cumulative stats with totalSavedCalories > 0', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/stats')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('totalSavedCalories');
      expect(res.body).toHaveProperty('totalSavedMoney');
      expect(res.body.totalSavedCalories).toBeGreaterThan(0);
      expect(res.body.totalSavedMoney).toBeGreaterThan(0);
    });

    it('should return 401 without token', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/stats')
        .expect(401);
    });
  });

  // ─────────────────────────────────────────────
  // GET /api/v1/stats/live
  // ─────────────────────────────────────────────
  describe('GET /api/v1/stats/live', () => {
    it('should return live stats with todayCalories > 0', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/stats/live')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('todayCalories');
      expect(res.body.todayCalories).toBeGreaterThan(0);
    });
  });

  // ─────────────────────────────────────────────
  // GET /api/v1/stats/trends
  // ─────────────────────────────────────────────
  describe('GET /api/v1/stats/trends', () => {
    it('should return trends with expected structure', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/stats/trends?months=1')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      // Each entry should have week/calories structure
      if (res.body.length > 0) {
        expect(res.body[0]).toHaveProperty('week');
        expect(res.body[0]).toHaveProperty('calories');
      }
    });
  });

  // ─────────────────────────────────────────────
  // GET /api/v1/stats/equivalents
  // ─────────────────────────────────────────────
  describe('GET /api/v1/stats/equivalents', () => {
    it('should return effort equivalents', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/stats/equivalents?weight=80')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  // ─────────────────────────────────────────────
  // GET /api/v1/stats/range
  // ─────────────────────────────────────────────
  describe('GET /api/v1/stats/range', () => {
    it('should return stats for a date range', async () => {
      const today = new Date().toISOString().split('T')[0];
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weekAgoStr = weekAgo.toISOString().split('T')[0];

      const res = await request(app.getHttpServer())
        .get(`/api/v1/stats/range?start=${weekAgoStr}&end=${today}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body).toBeDefined();
    });
  });
});
