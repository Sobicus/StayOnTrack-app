# Batch 10: Production Readiness

## Tasks
- OPS-020 — Security hardening
- OPS-021 — DB optimization
- OPS-022 — E2E tests expansion
- OPS-023 — Error boundaries + loading states
- OPS-024 — Deployment

## Critical Context (from codebase analysis — March 14, 2026)
### Security issues found:
- No request size limits on Express body parser
- Reset password token lookup is O(n) — scans all users with bcrypt
- No CSRF protection
- Refresh token never rotates (30-day static)
- Frontend stores tokens in localStorage (XSS risk)
- Missing audit logging for sensitive actions
- No input sanitization for XSS on user-generated content

### DB issues found:
- Missing indexes on: habits(userId), habit_logs(habitId), users(email), users(username), friend_requests, friendships
- No database migrations setup (entities use synchronize: true)
- No connection pooling configuration

### Test gaps:
- Backend: 71.4% module coverage (missing: analytics, activities, users, health)
- Frontend: 0% — no tests at all
- E2E: only auth, gamification, habits

## Scope

### OPS-020: Security Hardening
**Agent roles:** backend, architect, qa
**MUST COMPLETE BEFORE ANY PUBLIC ACCESS**

**Implementation:**
1. Request size limits: `app.use(express.json({ limit: '10kb' }))`
2. Helmet headers: `app.use(helmet())` — already imported? verify
3. CORS: whitelist specific origins (not wildcard `*`)
4. Rate limiting: tighten `/auth/*` endpoints (login: 5/min, register: 3/min, reset: 1/5min)
5. Fix reset token: encode userId in JWT payload, verify with single DB lookup
6. Refresh token rotation: invalidate old token on each refresh
7. CSRF: add `csurf` middleware OR use SameSite=Strict cookies
8. XSS sanitization: sanitize habit titles, challenge names before storage
9. Audit log: create `audit_logs` table, log auth events + sensitive changes
10. Request body validation: ensure ALL endpoints use DTOs with class-validator

### OPS-021: DB Optimization
**Agent roles:** backend, architect

**Implementation:**
1. Add indexes:
   ```sql
   CREATE INDEX idx_habits_userId ON habits(userId);
   CREATE INDEX idx_habit_logs_habitId ON habit_logs(habitId);
   CREATE INDEX idx_habit_logs_userId_date ON habit_logs(userId, date);
   CREATE INDEX idx_users_email ON users(email);
   CREATE INDEX idx_users_username ON users(username);
   CREATE INDEX idx_friend_requests_from ON friend_requests(fromUserId);
   CREATE INDEX idx_friend_requests_to ON friend_requests(toUserId);
   CREATE INDEX idx_friendships_userId ON friendships(userId);
   CREATE INDEX idx_friendships_friendId ON friendships(friendId);
   CREATE INDEX idx_challenges_creator ON challenges(creatorUserId);
   ```
2. Set up TypeORM migrations: `typeorm migration:generate` from current entities
3. Switch from `synchronize: true` to `synchronize: false` + migrations in production
4. Configure connection pool: `max: 20, idleTimeoutMillis: 30000`
5. Add query logging in dev for slow queries (> 1000ms)

### OPS-022: E2E Tests Expansion
**Agent roles:** qa, backend

**New E2E tests needed:**
- Habit CRUD flow (create, edit, delete, reorder)
- Check-in flow (single, batch, partial)
- Friends flow (request, accept, decline, remove)
- Challenge flow (create, invite, join, progress, complete)
- Stats flow (live stats, trends, range)
- Settings flow (update profile, timezone, currency)
- Streak flow (build streak, break streak, use shield)

### OPS-023: Error Boundaries + Loading States
**Agent roles:** frontend

**Implementation:**
- Add React error boundaries per feature section (dashboard, habits, stats, friends, challenges)
- Skeleton loaders for all data-fetching pages
- Retry buttons on failed API calls
- Offline detection banner (re-integrate OfflineBanner — was removed due to webpack error)
- Empty state illustrations for each section
- Fix hardcoded strings in error.tsx and not-found.tsx → move to i18n

### OPS-024: Deployment
**Agent roles:** devops, architect

**Implementation:**
- Docker production setup:
  - `docker-compose.prod.yml` (already exists — verify and complete)
  - Multi-stage Dockerfile for API (build → production)
  - Multi-stage Dockerfile for Web (build → standalone)
  - Nginx reverse proxy (already has `nginx/` dir)
- Domain + SSL (Let's Encrypt via certbot)
- Environment variables for production
- Health check endpoint monitoring
- Basic logging (stdout → file or service)
- GitHub Actions: deploy on push to `main`
- Database backup strategy (pg_dump cron)

## Estimated Effort: 20-30 hours
## Build verification: full test suite green, security scan clean, deployment works
## BLOCKER: This batch must be 100% complete before any public user access
