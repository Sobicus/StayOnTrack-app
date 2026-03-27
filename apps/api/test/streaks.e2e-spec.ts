import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';

/**
 * Streaks E2E Tests
 *
 * Tests the streaks endpoint after performing a check-in.
 * Verifies currentStreak, bestStreak, and streakShieldsRemaining.
 *
 * Required: PostgreSQL running on localhost:5450 with the stayontrack database.
 */
describe('Streaks (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  const testId = Date.now();
  const testUser = {
    email: `e2e_streaks_${testId}@example.com`,
    password: 'TestPass123!',
    username: `streakuser_${testId}`,
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

    // Create a habit and check in so streaks have data
    const habitRes = await request(app.getHttpServer())
      .post('/api/v1/habits')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: 'No Energy Drinks',
        caloriesPerOccurrence: 200,
        pricePerOccurrence: 3,
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
        `DELETE FROM "users" WHERE email LIKE 'e2e_streaks_%@example.com'`,
      );
    } catch {
      // Ignore cleanup errors
    }
    await app.close();
  });

  // ─────────────────────────────────────────────
  // GET /api/v1/streaks
  // ─────────────────────────────────────────────
  describe('GET /api/v1/streaks', () => {
    it('should return streak data with currentStreak >= 1 after check-in', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/streaks')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('currentStreak');
      expect(res.body).toHaveProperty('bestStreak');
      expect(res.body.currentStreak).toBeGreaterThanOrEqual(1);
      expect(res.body.bestStreak).toBeGreaterThanOrEqual(1);
    });

    it('should include streak shields info', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/streaks')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('streakShieldsRemaining');
      expect(res.body.streakShieldsRemaining).toBeGreaterThanOrEqual(0);
    });

    it('should return 401 without token', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/streaks')
        .expect(401);
    });
  });

  // ─────────────────────────────────────────────
  // POST /api/v1/streaks/recover
  // ─────────────────────────────────────────────
  describe('POST /api/v1/streaks/recover', () => {
    it('should return 401 without token', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/streaks/recover')
        .expect(401);
    });

    it('should return an error when streak is not broken (nothing to recover)', async () => {
      // Streak is active (we just checked in), so recovery should fail
      const res = await request(app.getHttpServer())
        .post('/api/v1/streaks/recover')
        .set('Authorization', `Bearer ${accessToken}`);

      // Should be 400 (bad request — streak not broken) or similar
      expect([400, 409].includes(res.status)).toBe(true);
    });
  });
});
