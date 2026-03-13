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
- [x] Privacy settings (private/friends/public)
- [x] Friend leaderboard (calories, streak, money)
- [x] Frontend: Friends page (3 tabs), Settings privacy section

## Infrastructure ✅ COMPLETED
- [x] Unit tests (24 tests: habit-logs + friends services)
- [x] CI/CD (GitHub Actions: typecheck, test, build)

## Phase 3: Challenges + Social Rewards 🔵 IN PROGRESS
- [ ] Challenges backend (1-on-1, scalable for groups via participants[])
  - Entity: Challenge + ChallengeParticipant
  - 5 types: habit, calories, streak, money, effort
  - Statuses: pending → active → completed / cancelled
  - CRUD + invite + accept/decline + progress + winner
- [ ] Challenges frontend (/challenges page, create, progress, leaderboard)
- [ ] Invite rewards (shield on friend accept, no limit)
- [ ] Extended achievements (SOCIAL + CHALLENGES categories)
  - First Friend, 5 Friends, First Challenge, Challenge Winner
  - Weekend Warrior, No Sugar Week, Invite Champion

## Phase 4: Auth Upgrade
- [ ] Email verification (non-blocking, banner, 7-day grace for social)
- [ ] Google OAuth (passport-google-oauth20, account merge by email)

## Phase 5: Settings & UX
- [ ] Extended settings (currency €/$, weekStartDay, imperial units)
- [ ] Habit catalog seed (20+ popular items with calories/prices)

## Phase 6: Telegram Integration
- [ ] Telegram Bot basic (/link, /start, /stats)
- [ ] Push notifications (Web Push + Telegram, daily reminder, streak at risk)
- [ ] Telegram Mini App (reuse web frontend)

## Phase 7: Polish & Analytics
- [ ] Simple analytics (pattern analysis — day of week, time, category)
- [ ] Annual/Monthly report (Wrapped style)
- [ ] Positive habits (habitType: ACHIEVEMENT — sport, water, meditation)

## Deferred
- ❌ Group challenges — start 1-on-1 first (code is scalable)
- ❌ React Native / Expo — PWA sufficient for now
- ❌ AI Coach — too expensive without monetization
- ❌ Premium/monetization — need audience first
- ❌ kJ units — 99% use kcal
