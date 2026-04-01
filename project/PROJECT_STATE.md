# StayOnTrack — Project State

## Last Updated: 2026-04-01

## Current Phase: Post-MVP Polish — All Features Complete, Pre-Deployment

## Active Focus
- Preparing for VPS deployment (domain, server, CI/CD)
- Sentry monitoring setup
- Frontend test coverage

## Completed Phases

### Phase 0 — Foundation
- ✅ Monorepo (Turborepo + npm workspaces)
- ✅ NestJS API skeleton + Next.js Web skeleton
- ✅ Contracts package (shared types, formulas, constants)
- ✅ Project docs & agent system

### Phase 1 — Core Solo Experience
- ✅ Auth (register, login, JWT, password reset, /auth/me)
- ✅ Habits CRUD (categories, frequency, sort)
- ✅ Daily check-in (single + batch, portion ratio)
- ✅ Stats (calories, money, weight, effort equivalents)
- ✅ Streaks (calculation, shields, milestones)
- ✅ Achievements (unlockable, progress tracking)
- ✅ Frontend (all pages: auth, dashboard, habits, stats, settings, friends, challenges)
- ✅ PWA manifest, onboarding flow, toast notifications, animations

### Phase 2 — Social
- ✅ Friends (requests, accept/reject, friendship)
- ✅ Privacy settings (visibility)
- ✅ Friend leaderboard

### Wave 2 — Code Quality (TASK-200–213)
- ✅ Input validation (@MaxLength on all DTOs)
- ✅ TypeScript strict (removed all `any` from backend)
- ✅ Frontend type safety (shared types from api.ts)
- ✅ Timezone-aware utilities (user.timezone column)
- ✅ Unit tests: 118 tests (auth, habits, stats, streaks, achievements)
- ✅ E2E tests: 20 tests (auth flow)
- ✅ Rich seed data (2 demo users, friendship, challenge)

### Wave 3A — Visualization (TASK-300–304)
- ✅ Monthly trend LineChart with weekly averages (GET /stats/trends)
- ✅ GitHub-style 5-level calorie intensity heatmap
- ✅ Animated count-up counters on dashboard stat cards
- ✅ Per-habit 7-dot sparkline (last 7 days)
- ✅ Monthly savings goal with progress bar on dashboard

### Wave 3B — Gamification (TASK-305–311)
- ✅ XP & Level system (17 levels, 0–50000 XP)
- ✅ XP progress bar + level badges on dashboard
- ✅ Award XP: check-in (+10), full avoidance (+25), streak milestones (+100)
- ✅ Daily quests system (3 random quests/day, 50 XP each)
- ✅ Streak recovery for 200 XP
- ✅ 6 unlockable accent color themes by level

### Wave 3C — Group Challenges (TASK-312–316)
- ✅ Extended challenge entity (maxParticipants, inviteCode, visibility)
- ✅ Join by 8-char invite code, invite multiple users
- ✅ Group challenge create flow (1v1 vs Group toggle)
- ✅ Challenge detail page /challenges/[id] with ranked leaderboard (🥇🥈🥉)
- ✅ Browse public challenges tab

### Wave 3D — PWA + Notifications (TASK-317–321)
- ✅ Offline check-in queue with auto-sync on reconnect
- ✅ Daily reminder email (for users who haven't checked in)
- ✅ Streak warning email (for at-risk streaks 3+ days)
- ✅ Weekly digest email with 7-day stats summary
- ✅ Notification settings UI (toggle + reminder hour picker)

## Build Status
- ✅ API builds clean
- ✅ Web builds clean
- ✅ Contracts builds clean
- ✅ 118 unit tests pass
- ✅ 20 E2E tests pass

### Wave 4A — Critical Fixes
- ✅ LiveHero neon ring v3 — fully inline styles, immune to Tailwind/cache issues (DEC-016)
- ✅ Timezone auto-sync from browser on login (DEC-017)
- ✅ Renamed ring CSS classes from `ring-*` to `neon-*` to avoid Tailwind conflict
- ✅ LiveStats endpoint uses user.timezone instead of UTC

### Post-Batch Completions (all 11 batches done)
- ✅ Soft delete (deletedAt) on Habit, HabitLog, User entities
- ✅ Domain exception files (common/exceptions/)
- ✅ OfflineBanner restored via ClientProviders
- ✅ Mandatory env validation on API startup
- ✅ 3-layer CQRS-lite architecture refactor (all 13 modules)
- ✅ Gmail SMTP replacing Resend
- ✅ Google OAuth configured
- ✅ Telegram bot token configured
- ✅ CI: `@stayontrack/contracts` build step added
- ✅ Remove `as` assertions, typed params throughout backend
- ✅ Swagger decorators moved to swagger/ folders

## Build Status
- ✅ API builds clean
- ✅ Web builds clean
- ✅ Contracts builds clean
- ✅ 153/153 tests pass (unit + E2E)

## Known Issues
- ⚠️ JWT rotation on restart — users must re-login after API restart (tokens invalidated)
- ⚠️ Frontend tests: 0% coverage (no frontend test suite yet)
- ⚠️ VPS/deployment not started

## Git History (dev branch, recent)
- `0030ae3` refactor: as-assertions, typed params, Swagger folders
- `822fae9` refactor: Wave 3 — 3-layer architecture for 4 complex modules (FINAL)
- `737500f` refactor: Wave 2 — 3-layer architecture for 5 medium modules
- `a425c92` refactor: Wave 1 — 3-layer architecture for 5 simple modules
- `8842ce9` docs: comprehensive PROJECT_MAP.md
- `fd23c2b` fix: remove duplicate index on friendships

## What's Next
1. **Deploy to VPS**: docker-compose.prod.yml, domain + SSL (Let's Encrypt), GitHub Actions auto-deploy
2. **Sentry monitoring**: Error tracking, health check dashboard
3. **Frontend test coverage**: Target 50%+
4. **Fix JWT rotation**: Persist token state across API restarts

## Key Metrics to Track (when MVP launches)
- Daily check-in completion rate
- Week 1 / Week 4 retention
- Average check-in time (target: 3-5 seconds)
- Streak length distribution
- Habit creation rate
- Challenge participation rate
- XP/Level progression rate
- Quest completion rate

## Tech Stack
- **Backend**: NestJS + TypeORM (Data Mapper) + PostgreSQL + JWT + class-validator
- **Frontend**: Next.js 14 (App Router) + Tailwind CSS + shadcn/ui + next-themes + next-intl + Recharts
- **Architecture**: Monorepo (Turborepo + npm workspaces)
- **Ports**: API=4800, Web=4801, PostgreSQL=5450
