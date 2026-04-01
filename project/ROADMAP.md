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

## Batch 5: Social Rewards + Extended Achievements ✅ DONE
- [x] Invite rewards (shield on friend accept, no limit)
- [x] Extended achievements (SOCIAL + CHALLENGES categories)
  - First Friend, 5 Friends, First Challenge, Challenge Winner
  - Weekend Warrior, No Sugar Week, Invite Champion

## Batch 6: Auth Hardening ✅ DONE
- [x] Email verification (non-blocking, banner, 7-day grace for social)
- [x] Google OAuth (passport-google-oauth20, account merge by email)

## Batch 7: Settings & Catalog ✅ DONE
- [x] Extended settings (currency €/$, weekStartDay, imperial units)
- [x] Habit catalog seed (20+ popular items with calories/prices, quick-add)

## Batch 8: Telegram Integration ✅ DONE
- [x] Telegram Bot basic (/link, /start, /stats)
- [x] Push notifications (Web Push + Telegram, daily reminder, streak at risk)
- [x] Telegram Mini App (reuse web frontend)

## Batch 9: Analytics & Reports ✅ DONE
- [x] Simple analytics (pattern analysis — day of week, time, category)
- [x] Annual/Monthly report (Wrapped style)
- [x] Positive habits (habitType: ACHIEVEMENT — sport, water, meditation)

## Batch 10: Production Readiness ✅ DONE
- [x] Security hardening (rate limiting, CORS, Helmet headers)
- [x] DB optimization (strategic indexes, query analysis, N+1 fix)
- [x] E2E tests expansion (habits, challenges, gamification flows)
- [x] Error boundaries + loading states (frontend resilience)
- [x] Mandatory env validation on API startup

## Batch 11: Code Refactoring ✅ DONE
- [x] Code style unification (ESLint + Prettier strict config)
- [x] 3-layer CQRS-lite architecture refactor (all 13 modules)
- [x] Dead code cleanup + unused imports, remove `as` assertions, typed params
- [x] CSS/Tailwind cleanup + design system tokens
- [x] Swagger decorators moved to swagger/ folders
- [x] Shared types audit (contracts ↔ api ↔ web sync)

## Post-Batch Completions ✅ DONE
- [x] Soft delete (deletedAt) on Habit, HabitLog, User entities
- [x] Domain exception files (common/exceptions/)
- [x] OfflineBanner restored via ClientProviders
- [x] Gmail SMTP replacing Resend
- [x] Google OAuth configured
- [x] Telegram bot token configured
- [x] CI: `@stayontrack/contracts` build step added
- [x] Tests: 153/153 passing

---

## What's Next: Deployment & Launch

### OPS-100: Deploy to VPS
- docker-compose.prod.yml
- Domain + SSL (Let's Encrypt)
- GitHub Actions auto-deploy to main

### OPS-101: Monitoring
- Sentry error tracking
- Health check dashboard

### OPS-102: Quality
- Frontend test coverage (target 50%+)
- Fix JWT token rotation on API restart

## Deferred (post-launch)
- ❌ React Native / Expo — PWA sufficient for now
- ❌ AI Coach — too expensive without monetization
- ❌ Premium/monetization — need audience first
- ❌ kJ units — 99% use kcal
