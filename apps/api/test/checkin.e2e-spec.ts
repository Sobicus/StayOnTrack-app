import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';

/**
 * Check-in E2E Tests
 *
 * Tests the full check-in flow: create habit, log AVOIDED/PARTIAL,
 * verify day summary, and confirm XP is awarded.
 *
 * Required: PostgreSQL running on localhost:5450 with the stayontrack database.
 */
describe('Check-in (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  const testId = Date.now();
  const testUser = {
    email: `e2e_checkin_${testId}@example.com`,
    password: 'TestPass123!',
    username: `checkinuser_${testId}`,
  };

  let accessToken: string;
  let habitId: string;

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
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send(testUser)
      .expect(201);

    accessToken = res.body.accessToken;
  }, 30000);

  afterAll(async () => {
    try {
      await dataSource.query(
        `DELETE FROM "users" WHERE email LIKE 'e2e_checkin_%@example.com'`,
      );
    } catch {
      // Ignore cleanup errors
    }
    await app.close();
  });

  // ─────────────────────────────────────────────
  // Setup: create a habit
  // ─────────────────────────────────────────────
  describe('Setup', () => {
    it('should create a habit for check-in tests', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/habits')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'No Chocolate',
          caloriesPerOccurrence: 500,
          pricePerOccurrence: 3,
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      habitId = res.body.id;
    });
  });

  // ─────────────────────────────────────────────
  // Check-in: AVOIDED
  // ─────────────────────────────────────────────
  describe('AVOIDED check-in', () => {
    const today = new Date().toISOString().split('T')[0];

    it('should log AVOIDED and return savedCalories > 0', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/habit-logs')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          habitId,
          status: 'AVOIDED',
          date: today,
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.status).toBe('AVOIDED');
      expect(res.body.savedCalories).toBeGreaterThan(0);
      expect(res.body).toHaveProperty('xpEarned');
      expect(res.body.xpEarned).toBeGreaterThan(0);
    });
  });

  // ─────────────────────────────────────────────
  // Check-in: PARTIAL
  // ─────────────────────────────────────────────
  describe('PARTIAL check-in', () => {
    let secondHabitId: string;

    it('should create a second habit for partial test', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/habits')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'No Fast Food',
          caloriesPerOccurrence: 800,
          pricePerOccurrence: 10,
        })
        .expect(201);

      secondHabitId = res.body.id;
    });

    it('should log PARTIAL with portionRatio', async () => {
      const today = new Date().toISOString().split('T')[0];

      const res = await request(app.getHttpServer())
        .post('/api/v1/habit-logs')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          habitId: secondHabitId,
          status: 'PARTIAL',
          portionRatio: 0.5,
          date: today,
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.status).toBe('PARTIAL');
      expect(res.body.portionRatio).toBe(0.5);
      // Partial avoidance should still save some calories
      expect(res.body.savedCalories).toBeGreaterThan(0);
    });
  });

  // ─────────────────────────────────────────────
  // Day summary
  // ─────────────────────────────────────────────
  describe('Day summary', () => {
    it('GET /api/v1/habit-logs/day — should return logs for today', async () => {
      const today = new Date().toISOString().split('T')[0];

      const res = await request(app.getHttpServer())
        .get(`/api/v1/habit-logs/day?date=${today}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('logs');
      expect(Array.isArray(res.body.logs)).toBe(true);
      expect(res.body.logs.length).toBeGreaterThanOrEqual(2);
    });
  });

  // ─────────────────────────────────────────────
  // XP verification
  // ─────────────────────────────────────────────
  describe('XP awarded after check-in', () => {
    it('GET /api/v1/gamification/level — should show XP > 0', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/gamification/level')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.currentXp).toBeGreaterThan(0);
      expect(res.body.level).toBeGreaterThanOrEqual(1);
    });
  });

  // ─────────────────────────────────────────────
  // Auth guard
  // ─────────────────────────────────────────────
  describe('Auth guard', () => {
    it('should return 401 for check-in without token', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/habit-logs')
        .send({
          habitId: 'some-id',
          status: 'AVOIDED',
          date: '2026-01-01',
        })
        .expect(401);
    });

    it('should return 401 for day summary without token', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/habit-logs/day')
        .expect(401);
    });
  });
});
