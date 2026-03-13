import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';

/**
 * Habits & Check-in E2E Tests
 *
 * These tests run against a real database (the dev PostgreSQL instance).
 * They clean up after themselves by deleting test users in afterAll.
 *
 * Required: PostgreSQL running on localhost:5450 with the stayontrack database.
 */
describe('Habits (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  const testId = Date.now();
  const testUser = {
    email: `e2e_habits_${testId}@example.com`,
    password: 'TestPass123!',
    username: `habitsuser_${testId}`,
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
        `DELETE FROM "users" WHERE email LIKE 'e2e_habits_%@example.com'`,
      );
    } catch {
      // Ignore cleanup errors
    }
    await app.close();
  });

  // ─────────────────────────────────────────────
  // Habit CRUD
  // ─────────────────────────────────────────────
  describe('Habit CRUD', () => {
    it('POST /api/v1/habits — should create a habit', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/habits')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'No Sweets',
          caloriesPerOccurrence: 300,
          pricePerOccurrence: 5,
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.title).toBe('No Sweets');
      expect(res.body.caloriesPerOccurrence).toBe(300);
      expect(res.body.pricePerOccurrence).toBe(5);
      expect(res.body.isActive).toBe(true);

      habitId = res.body.id;
    });

    it('GET /api/v1/habits — should list habits for the user', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/habits')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
      expect(res.body.some((h: any) => h.id === habitId)).toBe(true);
    });

    it('GET /api/v1/habits/:id — should get a single habit', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/habits/${habitId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.id).toBe(habitId);
      expect(res.body.title).toBe('No Sweets');
    });

    it('PATCH /api/v1/habits/:id — should update a habit', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/habits/${habitId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'No Candy' })
        .expect(200);

      expect(res.body.title).toBe('No Candy');
      expect(res.body.id).toBe(habitId);
    });

    it('should return 401 without token', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/habits')
        .expect(401);
    });
  });

  // ─────────────────────────────────────────────
  // Check-in (single log)
  // ─────────────────────────────────────────────
  describe('Check-in', () => {
    const today = new Date().toISOString().split('T')[0];

    it('POST /api/v1/habit-logs — should create a log and return XP info', async () => {
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
      expect(res.body.savedCalories).toBeGreaterThanOrEqual(0);
      expect(res.body).toHaveProperty('xpEarned');
      expect(res.body.xpEarned).toBeGreaterThanOrEqual(0);
    });

    it('should update existing log and return 0 XP on duplicate date', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/habit-logs')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          habitId,
          status: 'AVOIDED',
          date: today,
        })
        .expect(201);

      // Duplicate check-in updates existing log, no XP awarded
      expect(res.body.xpEarned).toBe(0);
    });
  });

  // ─────────────────────────────────────────────
  // Batch check-in
  // ─────────────────────────────────────────────
  describe('Batch check-in', () => {
    let secondHabitId: string;

    it('should create a second habit for batch test', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/habits')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'No Soda',
          caloriesPerOccurrence: 150,
          pricePerOccurrence: 2,
        })
        .expect(201);

      secondHabitId = res.body.id;
    });

    it('POST /api/v1/habit-logs/batch — should batch check-in multiple habits', async () => {
      // Use tomorrow to avoid conflict with existing log
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      const res = await request(app.getHttpServer())
        .post('/api/v1/habit-logs/batch')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          date: tomorrowStr,
          logs: [
            { habitId, status: 'AVOIDED' },
            { habitId: secondHabitId, status: 'PARTIAL', portionRatio: 0.5 },
          ],
        })
        .expect(201);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(2);
      expect(res.body[0]).toHaveProperty('id');
      expect(res.body[1]).toHaveProperty('id');
    });
  });

  // ─────────────────────────────────────────────
  // Stats after check-in
  // ─────────────────────────────────────────────
  describe('Stats', () => {
    it('GET /api/v1/stats — should return stats with saved calories', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/stats')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('totalSavedCalories');
      expect(res.body).toHaveProperty('totalSavedMoney');
      expect(res.body.totalSavedCalories).toBeGreaterThan(0);
    });
  });

  // ─────────────────────────────────────────────
  // Habit deletion
  // ─────────────────────────────────────────────
  describe('Habit deletion', () => {
    it('DELETE /api/v1/habits/:id — should delete a habit', async () => {
      // Create a habit to delete
      const createRes = await request(app.getHttpServer())
        .post('/api/v1/habits')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'To Delete' })
        .expect(201);

      await request(app.getHttpServer())
        .delete(`/api/v1/habits/${createRes.body.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(204);

      // Verify it's gone
      await request(app.getHttpServer())
        .get(`/api/v1/habits/${createRes.body.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });
  });
});
