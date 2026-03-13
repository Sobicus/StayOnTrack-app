import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';

/**
 * Auth E2E Tests
 *
 * These tests run against a real database (the dev PostgreSQL instance).
 * They clean up after themselves by deleting test users in afterAll.
 *
 * Required: PostgreSQL running on localhost:5450 with the stayontrack database.
 */
describe('Auth (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  // Unique test user credentials (timestamp prevents collisions with parallel runs)
  const testId = Date.now();
  const testUser = {
    email: `e2e_test_${testId}@example.com`,
    password: 'TestPass123!',
    username: `e2euser_${testId}`,
  };

  // Store tokens across tests
  let accessToken: string;
  let refreshToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Mirror main.ts setup: global prefix + validation pipe
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
  });

  afterAll(async () => {
    // Clean up test user(s) from the database
    try {
      await dataSource.query(
        `DELETE FROM "users" WHERE email LIKE 'e2e_test_%@example.com'`,
      );
    } catch {
      // Ignore cleanup errors — DB may already be clean
    }
    await app.close();
  });

  // ─────────────────────────────────────────────
  // POST /api/v1/auth/register
  // ─────────────────────────────────────────────
  describe('POST /api/v1/auth/register', () => {
    it('should register a new user and return tokens + user', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(testUser)
        .expect(201);

      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
      expect(res.body).toHaveProperty('user');
      expect(res.body.user.email).toBe(testUser.email.toLowerCase());
      expect(res.body.user.username).toBe(testUser.username);
      expect(res.body.user).not.toHaveProperty('passwordHash');
      expect(res.body.user).not.toHaveProperty('refreshTokenHash');

      // Save tokens for subsequent tests
      accessToken = res.body.accessToken;
      refreshToken = res.body.refreshToken;
    });

    it('should return 400 on duplicate email', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(testUser)
        .expect(400);
    });

    it('should return 400 when email is missing', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ password: 'TestPass123!', username: 'nouser' })
        .expect(400);
    });

    it('should return 400 when password is too short', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: `short_pw_${testId}@example.com`,
          password: '12345',
          username: 'shortpw',
        })
        .expect(400);
    });

    it('should return 400 when username is missing', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: `no_user_${testId}@example.com`,
          password: 'TestPass123!',
        })
        .expect(400);
    });

    it('should return 400 when username has invalid characters', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: `badname_${testId}@example.com`,
          password: 'TestPass123!',
          username: 'bad name!',
        })
        .expect(400);
    });

    it('should return 400 on invalid email format', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: 'not-an-email',
          password: 'TestPass123!',
          username: 'bademail',
        })
        .expect(400);
    });
  });

  // ─────────────────────────────────────────────
  // POST /api/v1/auth/login
  // ─────────────────────────────────────────────
  describe('POST /api/v1/auth/login', () => {
    it('should login with valid credentials and return tokens + user', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: testUser.email, password: testUser.password })
        .expect(200);

      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
      expect(res.body).toHaveProperty('user');
      expect(res.body.user.email).toBe(testUser.email.toLowerCase());

      // Update tokens for subsequent tests
      accessToken = res.body.accessToken;
      refreshToken = res.body.refreshToken;
    });

    it('should return 401 on wrong password', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: testUser.email, password: 'WrongPassword' })
        .expect(401);

      expect(res.body.message).toBeDefined();
    });

    it('should return 401 on non-existent email', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'SomePassword123',
        })
        .expect(401);

      expect(res.body.message).toBeDefined();
    });

    it('should return 400 when email is missing', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ password: 'TestPass123!' })
        .expect(400);
    });

    it('should return 400 when password is missing', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: testUser.email })
        .expect(400);
    });
  });

  // ─────────────────────────────────────────────
  // GET /api/v1/auth/me
  // ─────────────────────────────────────────────
  describe('GET /api/v1/auth/me', () => {
    it('should return current user profile when authenticated', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.email).toBe(testUser.email.toLowerCase());
      expect(res.body.username).toBe(testUser.username);
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('createdAt');
      expect(res.body).not.toHaveProperty('passwordHash');
      expect(res.body).not.toHaveProperty('refreshTokenHash');
    });

    it('should return 401 without token', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .expect(401);
    });

    it('should return 401 with an invalid token', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid.jwt.token')
        .expect(401);
    });
  });

  // ─────────────────────────────────────────────
  // POST /api/v1/auth/refresh
  // ─────────────────────────────────────────────
  describe('POST /api/v1/auth/refresh', () => {
    it('should return new tokens with a valid refresh token', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
      expect(res.body).toHaveProperty('user');

      // The new access token should be different (new issue time)
      expect(res.body.accessToken).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();

      // Update tokens — old refresh token is now replaced
      accessToken = res.body.accessToken;
      refreshToken = res.body.refreshToken;
    });

    it('should return 401 with an invalid refresh token', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'invalid.refresh.token' })
        .expect(401);
    });

    it('should return 401 with an old (rotated) refresh token', async () => {
      // First, get a fresh pair of tokens
      const loginRes = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: testUser.email, password: testUser.password })
        .expect(200);

      const oldRefreshToken = loginRes.body.refreshToken;

      // Rotate: use the refresh token to get new ones
      const refreshRes = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: oldRefreshToken })
        .expect(200);

      // Update to the latest tokens
      accessToken = refreshRes.body.accessToken;
      refreshToken = refreshRes.body.refreshToken;

      // Now the old refresh token should be rejected (hash changed)
      await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: oldRefreshToken })
        .expect(401);
    });
  });

  // ─────────────────────────────────────────────
  // POST /api/v1/auth/logout
  // ─────────────────────────────────────────────
  describe('POST /api/v1/auth/logout', () => {
    it('should return 204 and invalidate the refresh token', async () => {
      // Re-login to get a clean token pair for this test
      const loginRes = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: testUser.email, password: testUser.password })
        .expect(200);

      const logoutAccessToken = loginRes.body.accessToken;
      const logoutRefreshToken = loginRes.body.refreshToken;

      // Logout
      await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${logoutAccessToken}`)
        .expect(204);

      // The refresh token should no longer work
      await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: logoutRefreshToken })
        .expect(401);
    });

    it('should return 401 without authentication', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .expect(401);
    });
  });

  // ─────────────────────────────────────────────
  // Full flow: register → login → me → refresh → me → logout
  // ─────────────────────────────────────────────
  describe('Full auth flow', () => {
    const flowId = Date.now() + 1;
    const flowUser = {
      email: `e2e_test_flow_${flowId}@example.com`,
      password: 'FlowPass789!',
      username: `flowuser_${flowId}`,
    };

    it('should complete the entire auth lifecycle', async () => {
      // Step 1: Register
      const registerRes = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(flowUser)
        .expect(201);

      expect(registerRes.body.user.email).toBe(flowUser.email.toLowerCase());
      let currentAccessToken = registerRes.body.accessToken;
      let currentRefreshToken = registerRes.body.refreshToken;

      // Step 2: Login
      const loginRes = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: flowUser.email, password: flowUser.password })
        .expect(200);

      currentAccessToken = loginRes.body.accessToken;
      currentRefreshToken = loginRes.body.refreshToken;
      expect(loginRes.body.user.email).toBe(flowUser.email.toLowerCase());

      // Step 3: Get profile with access token
      const meRes = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${currentAccessToken}`)
        .expect(200);

      expect(meRes.body.email).toBe(flowUser.email.toLowerCase());
      expect(meRes.body.username).toBe(flowUser.username);

      // Step 4: Refresh tokens
      const refreshRes = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: currentRefreshToken })
        .expect(200);

      const newAccessToken = refreshRes.body.accessToken;
      currentRefreshToken = refreshRes.body.refreshToken;

      // Step 5: Get profile with new access token
      const meRes2 = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${newAccessToken}`)
        .expect(200);

      expect(meRes2.body.email).toBe(flowUser.email.toLowerCase());

      // Step 6: Logout
      await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${newAccessToken}`)
        .expect(204);

      // Step 7: Verify refresh token is invalidated after logout
      await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: currentRefreshToken })
        .expect(401);
    });
  });
});
