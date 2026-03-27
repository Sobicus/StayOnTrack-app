# StayOnTrack — Roadmap

## Phase 0: Foundation ✅ COMPLETED
- [x] Product analysis and decision-making
- [x] Monorepo setup (Turborepo + npm workspaces)
- [x] Docker (PostgreSQL)
- [x] NestJS backend skeleton
- [x] Next.js frontend skeleton
- [x] Shared contracts package
- [x] Agent system and task tracking

## Phase 1: Core Solo Experience ✅ COMPLETED
- [x] Auth (register, login, JWT, profile)
- [x] Habits CRUD (backend + frontend + frequency limits)
- [x] Daily check-in (habit logs, batch, rewards)
- [x] Stats & equivalents (charts, calendar heatmap)
- [x] Activities catalog (seed data)
- [x] Streak logic + Streak Shield (1/week, Monday replenish)
- [x] Achievements (25 milestones, dynamic calculation)
- [x] i18n (EN + RU, cookie-based)
- [x] Onboarding (4-step wizard)
- [x] PWA manifest
- [x] Dark mode + mobile-first UI

## Phase 2: Basic Social ✅ COMPLETED
- [x] Friends (requests, friendships, remove)
- [x] Privacy settings (visibility)
- [x] Friend leaderboard
- [x] Frontend: Friends page (3 tabs), Settings privacy section

## Wave 2: Code Quality ✅ COMPLETED
- [x] Input validation, TypeScript strict, frontend type safety
- [x] Timezone-aware utilities
- [x] Unit tests (118), E2E tests (20)
- [x] Rich seed data

## Wave 3A: Visualization ✅ COMPLETED
- [x] Monthly trend LineChart, calorie heatmap, count-up counters, sparklines, goals

## Wave 3B: Gamification ✅ COMPLETED
- [x] XP & Levels, daily quests, streak recovery, unlockable themes

## Wave 3C: Group Challenges ✅ COMPLETED
- [x] Extended challenges, invite codes, group flow, leaderboard, public browse

## Wave 3D: PWA + Notifications ✅ COMPLETED
- [x] Offline queue, daily reminder email, streak warning, weekly digest, settings UI

## Wave 4A: Critical Fixes ✅ COMPLETED
- [x] LiveHero neon ring v3 (inline styles, DEC-016)
- [x] Timezone auto-sync (DEC-017)
- [x] Tailwind ring-* conflict fix

---

## Batch 5: Social Rewards + Extended Achievements 🟡 NEXT
- [ ] Invite rewards (shield on friend accept, no limit)
- [ ] Extended achievements (SOCIAL + CHALLENGES categories)
  - First Friend, 5 Friends, First Challenge, Challenge Winner
  - Weekend Warrior, No Sugar Week, Invite Champion

## Batch 6: Auth Hardening
- [ ] Email verification (non-blocking, banner, 7-day grace for social)
- [ ] Google OAuth (passport-google-oauth20, account merge by email)

## Batch 7: Settings & Catalog
- [ ] Extended settings (currency €/$, weekStartDay, imperial units)
- [ ] Habit catalog seed (20+ popular items with calories/prices, quick-add)

## Batch 8: Telegram Integration
- [ ] Telegram Bot basic (/link, /start, /stats)
- [ ] Push notifications (Web Push + Telegram, daily reminder, streak at risk)
- [ ] Telegram Mini App (reuse web frontend)

## Batch 9: Analytics & Reports
- [ ] Simple analytics (pattern analysis — day of week, time, category)
- [ ] Annual/Monthly report (Wrapped style)
- [ ] Positive habits (habitType: ACHIEVEMENT — sport, water, meditation)

## Batch 10: Production Readiness 🔒 BEFORE LAUNCH
- [ ] Security hardening (rate limiting, CORS, Helmet headers)
- [ ] DB optimization (strategic indexes, query analysis, N+1 fix)
- [ ] E2E tests expansion (habits, challenges, gamification flows)
- [ ] Error boundaries + loading states (frontend resilience)
- [ ] Deployment (domain, VPS, CI/CD pipeline, SSL, monitoring)

## Batch 11: Code Refactoring 🧹 FINAL POLISH
- [ ] Code style unification (ESLint + Prettier strict config)
- [ ] Architecture patterns audit (services, DTOs, hooks, naming)
- [ ] Dead code cleanup + unused imports
- [ ] CSS/Tailwind cleanup + design system tokens
- [ ] API response format standardization
- [ ] Shared types audit (contracts ↔ api ↔ web sync)

## Deferred
- ❌ React Native / Expo — PWA sufficient for now
- ❌ AI Coach — too expensive without monetization
- ❌ Premium/monetization — need audience first
- ❌ kJ units — 99% use kcal
