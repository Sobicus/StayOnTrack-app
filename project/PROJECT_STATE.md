# StayOnTrack — Project State

## Last Updated: 2026-03-14

## Current Phase: Pre-Deployment (Feature-Complete MVP)

## Active Focus
- Wave 4: Testing, optimization, security, analytics
- Preparing for deployment (domain, server, CI/CD)

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

### Wave 4A — Critical Fixes (2026-03-14)
- ✅ LiveHero neon ring v3 — fully inline styles, immune to Tailwind/cache issues (DEC-016)
- ✅ Timezone auto-sync from browser on login (DEC-017)
- ✅ Renamed ring CSS classes from `ring-*` to `neon-*` to avoid Tailwind conflict
- ✅ LiveStats endpoint uses user.timezone instead of UTC

## Known Issues
- ⚠️ AccentThemeProvider + OfflineBanner cause webpack runtime error in layout.tsx — need page-level integration instead
- ⚠️ After API server restart, users must re-login (JWT tokens invalidated)

## Git History (dev branch)
- `09a4f93` fix: inline ring gradients + remove UTC date from frontend check-ins
- `42302b2` fix: use user timezone in getLiveStats instead of UTC
- `362453a` fix: auto-detect and sync browser timezone to backend
- `d23ef8e` fix: rename ring-* classes to neon-* to avoid Tailwind ring- conflict
- `a737c0f` fix: use --background for ring inner fill, not --card
- `8d46b23` fix: restore LiveHero ring colors
- `25f6529` fix: dynamic import OfflineBanner
- `bd74bdb` fix: use uppercase ChallengeVisibility enum
- `dbc0818` feat: Wave D — PWA + notifications (TASK-317–321)
- `a5753eb` feat: Wave C — group challenges (TASK-312–316)
- `1dc64db` feat: Wave B — gamification (TASK-305–311)
- `e574ee5` feat: Wave A — visualization (TASK-300–304)
- `117290d` feat: Wave 2 — code quality (TASK-200–213)

## What's Next — Wave 4: Polish & Harden
1. **Testing**: E2E tests for habits, challenges, gamification flows
2. **DB Optimization**: Strategic indexes, query analysis
3. **Security**: Rate limiting, CORS hardening, Helmet headers
4. **Analytics**: Retention metrics, user funnels, event tracking
5. **Deployment**: Domain, server, CI/CD pipeline

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
