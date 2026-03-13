import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';

/**
 * Gamification E2E Tests
 *
 * Tests the XP/Level system and daily quests against a real database.
 * Cleans up test users in afterAll.
 *
 * Required: PostgreSQL running on localhost:5450 with the stayontrack database.
 */
describe('Gamification (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  const testId = Date.now();
  const testUser = {
    email: `e2e_gamify_${testId}@example.com`,
    password: 'TestPass123!',
    username: `gamifyuser_${testId}`,
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
        `DELETE FROM "users" WHERE email LIKE 'e2e_gamify_%@example.com'`,
      );
    } catch {
      // Ignore cleanup errors
    }
    await app.close();
  });

  // ─────────────────────────────────────────────
  // GET /api/v1/gamification/level
  // ─────────────────────────────────────────────
  describe('GET /api/v1/gamification/level', () => {
    it('should return level 1 for a new user', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/gamification/level')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.level).toBe(1);
      expect(res.body.currentXp).toBe(0);
      expect(res.body.nextLevelXp).toBe(100);
      expect(res.body.progress).toBe(0);
    });

    it('should return 401 without token', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/gamification/level')
        .expect(401);
    });
  });

  // ─────────────────────────────────────────────
  // XP increases after check-in
  // ─────────────────────────────────────────────
  describe('XP after check-in', () => {
    it('should create a habit for XP testing', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/habits')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'No Coffee',
          caloriesPerOccurrence: 50,
          pricePerOccurrence: 4,
        })
        .expect(201);

      habitId = res.body.id;
    });

    it('should increase XP after a check-in', async () => {
      const today = new Date().toISOString().split('T')[0];

      // Get XP before
      const levelBefore = await request(app.getHttpServer())
        .get('/api/v1/gamification/level')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const xpBefore = levelBefore.body.currentXp;

      // Check in
      const logRes = await request(app.getHttpServer())
        .post('/api/v1/habit-logs')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          habitId,
          status: 'AVOIDED',
          date: today,
        })
        .expect(201);

      expect(logRes.body.xpEarned).toBeGreaterThan(0);

      // Get XP after
      const levelAfter = await request(app.getHttpServer())
        .get('/api/v1/gamification/level')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(levelAfter.body.currentXp).toBeGreaterThan(xpBefore);
    });
  });

  // ─────────────────────────────────────────────
  // GET /api/v1/gamification/quests
  // ─────────────────────────────────────────────
  describe('GET /api/v1/gamification/quests', () => {
    it('should return 3 daily quests', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/gamification/quests')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(3);

      // Each quest should have expected fields
      for (const quest of res.body) {
        expect(quest).toHaveProperty('id');
        expect(quest).toHaveProperty('questType');
        expect(quest).toHaveProperty('title');
        expect(quest).toHaveProperty('description');
        expect(quest).toHaveProperty('completed');
        expect(quest).toHaveProperty('xpReward');
        expect(quest.xpReward).toBe(50);
      }
    });

    it('should return the same quests on subsequent calls (no regeneration)', async () => {
      const res1 = await request(app.getHttpServer())
        .get('/api/v1/gamification/quests')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const res2 = await request(app.getHttpServer())
        .get('/api/v1/gamification/quests')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res1.body.map((q: any) => q.id).sort()).toEqual(
        res2.body.map((q: any) => q.id).sort(),
      );
    });
  });

  // ─────────────────────────────────────────────
  // POST /api/v1/gamification/quests/check
  // ─────────────────────────────────────────────
  describe('POST /api/v1/gamification/quests/check', () => {
    it('should check quest completion and return results', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/gamification/quests/check')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(201);

      expect(res.body).toHaveProperty('quests');
      expect(res.body).toHaveProperty('xpEarned');
      expect(res.body).toHaveProperty('completedNow');
      expect(Array.isArray(res.body.quests)).toBe(true);
      expect(Array.isArray(res.body.completedNow)).toBe(true);
      expect(typeof res.body.xpEarned).toBe('number');
    });

    it('should return 401 without token', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/gamification/quests/check')
        .expect(401);
    });
  });
});
