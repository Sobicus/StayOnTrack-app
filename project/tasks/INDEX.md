# StayOnTrack — Task Index

## Naming Convention
- `TASK-XXX` — Planned roadmap delivery
- `FIX-XXX` — Bug fixes, regressions
- `OPS-XXX` — Infrastructure, CI/CD, Docker, tooling
- `SPIKE-XXX` — Research, investigation, decision-making

## Task Status Legend
- 🟡 CREATED — Defined but not started
- 🔵 IN_PROGRESS — Currently being worked on
- 🟣 REVIEW — Implementation done, needs verification
- 🟢 COMPLETED — Done and verified
- 🔴 BLOCKED — Waiting for input or dependency

---

## Phase 0: Foundation

| ID | Title | Status | Phase |
|---|---|---|---|
| OPS-001 | Monorepo setup (Turborepo, npm workspaces, Docker) | 🟢 COMPLETED | 0 |
| OPS-002 | NestJS backend skeleton + health endpoint | 🟢 COMPLETED | 0 |
| OPS-003 | Next.js frontend skeleton + dark mode | 🟢 COMPLETED | 0 |
| OPS-004 | Shared contracts package (types, enums, formulas) | 🟢 COMPLETED | 0 |
| OPS-005 | Agent system and documentation | 🟢 COMPLETED | 0 |

## Phase 1: Core Solo Experience

| ID | Title | Status | Phase |
|---|---|---|---|
| TASK-001 | Auth module (register, login, JWT, profile) | 🟢 COMPLETED | 1.1 |
| TASK-002 | Habits CRUD module (backend + frontend) | 🟢 COMPLETED | 1.2 |
| TASK-003 | Daily check-in module (habit logs, batch) | 🟢 COMPLETED | 1.3 |
| TASK-004 | Stats & equivalents module (charts, heatmap) | 🟢 COMPLETED | 1.4 |
| TASK-005 | Activities catalog (seed data) | 🟢 COMPLETED | 1.4 |
| TASK-006 | Streak logic + Streak Shield | 🟢 COMPLETED | 1.5 |
| TASK-007 | Frontend: Auth pages (register, login) | 🟢 COMPLETED | 1.1 |
| TASK-008 | Frontend: Home screen (dashboard) | 🟢 COMPLETED | 1.6 |
| TASK-009 | Frontend: Habits management pages | 🟢 COMPLETED | 1.2 |
| TASK-010 | Frontend: Daily check-in + rewards | 🟢 COMPLETED | 1.3 |
| TASK-011 | Frontend: Stats & equivalents screens | 🟢 COMPLETED | 1.4 |
| TASK-012 | Frontend: Onboarding flow (4-step wizard) | 🟢 COMPLETED | 1.6 |
| TASK-013 | i18n setup (EN + RU, cookie-based) | 🟢 COMPLETED | 1.6 |
| TASK-015 | Frequency limits (daily/weekly/custom) | 🟢 COMPLETED | 1.2 |
| TASK-016 | Achievements system (25 milestones) | 🟢 COMPLETED | 1.6 |

## Phase 2: Basic Social

| ID | Title | Status | Phase |
|---|---|---|---|
| TASK-020 | Friends module (requests, friendships) | 🟢 COMPLETED | 2.1 |
| TASK-021 | Privacy settings (visibility levels) | 🟢 COMPLETED | 2.2 |
| TASK-022 | Friend leaderboard | 🟢 COMPLETED | 2.3 |
| TASK-023 | Frontend: Friends page (3 tabs) | 🟢 COMPLETED | 2.1 |
| TASK-024 | Frontend: Privacy settings | 🟢 COMPLETED | 2.2 |
| TASK-025 | Frontend: Leaderboard | 🟢 COMPLETED | 2.3 |

## Infrastructure

| ID | Title | Status | Phase |
|---|---|---|---|
| OPS-010 | PWA manifest | 🟢 COMPLETED | — |
| OPS-011 | Unit tests (24) + CI/CD (GitHub Actions) | 🟢 COMPLETED | — |
| OPS-012 | Dark mode + mobile-first UI | 🟢 COMPLETED | — |

## Wave 2: Code Quality (TASK-200–213)

| ID | Title | Status |
|---|---|---|
| TASK-200 | Input validation (@MaxLength on all DTOs) | 🟢 COMPLETED |
| TASK-201 | TypeScript strict (remove all `any` from backend) | 🟢 COMPLETED |
| TASK-202 | Frontend type safety (shared types from api.ts) | 🟢 COMPLETED |
| TASK-203 | Timezone-aware utilities (user.timezone column) | 🟢 COMPLETED |
| TASK-210 | Unit tests expansion (118 tests) | 🟢 COMPLETED |
| TASK-211 | E2E tests (20 auth flow tests) | 🟢 COMPLETED |
| TASK-213 | Rich seed data (2 demo users, friendship, challenge) | 🟢 COMPLETED |

## Wave 3A: Visualization (TASK-300–304)

| ID | Title | Status |
|---|---|---|
| TASK-300 | Monthly trend LineChart with weekly averages | 🟢 COMPLETED |
| TASK-301 | GitHub-style calorie intensity heatmap | 🟢 COMPLETED |
| TASK-302 | Animated count-up counters on stat cards | 🟢 COMPLETED |
| TASK-303 | Per-habit 7-dot sparkline | 🟢 COMPLETED |
| TASK-304 | Monthly savings goal with progress bar | 🟢 COMPLETED |

## Wave 3B: Gamification (TASK-305–311)

| ID | Title | Status |
|---|---|---|
| TASK-305 | XP & Level system (17 levels, 0–50000 XP) | 🟢 COMPLETED |
| TASK-306 | XP progress bar + level badges | 🟢 COMPLETED |
| TASK-307 | Award XP on check-in, avoidance, streaks | 🟢 COMPLETED |
| TASK-308 | Daily quests system (3/day, 50 XP each) | 🟢 COMPLETED |
| TASK-309 | Streak recovery for 200 XP | 🟢 COMPLETED |
| TASK-311 | 6 unlockable accent themes by level | 🟢 COMPLETED |

## Wave 3C: Group Challenges (TASK-312–316)

| ID | Title | Status |
|---|---|---|
| TASK-312 | Extended challenge entity (maxParticipants, inviteCode) | 🟢 COMPLETED |
| TASK-313 | Join by invite code, invite multiple users | 🟢 COMPLETED |
| TASK-314 | Group challenge create flow (1v1 vs Group) | 🟢 COMPLETED |
| TASK-315 | Challenge detail page with leaderboard | 🟢 COMPLETED |
| TASK-316 | Browse public challenges tab | 🟢 COMPLETED |

## Wave 3D: PWA + Notifications (TASK-317–321)

| ID | Title | Status |
|---|---|---|
| TASK-317 | Offline check-in queue with auto-sync | 🟢 COMPLETED |
| TASK-318 | Daily reminder email | 🟢 COMPLETED |
| TASK-319 | Streak warning email | 🟢 COMPLETED |
| TASK-320 | Weekly digest email | 🟢 COMPLETED |
| TASK-321 | Notification settings UI | 🟢 COMPLETED |

## Wave 4A: Critical Fixes

| ID | Title | Status |
|---|---|---|
| FIX-401 | LiveHero neon ring v3 — inline styles (DEC-016) | 🟢 COMPLETED |
| FIX-402 | Timezone auto-sync from browser (DEC-017) | 🟢 COMPLETED |
| FIX-403 | Rename ring-* to neon-* (Tailwind conflict) | 🟢 COMPLETED |
| FIX-404 | LiveStats uses user.timezone not UTC | 🟢 COMPLETED |

---

## Batch 5: Social Rewards + Extended Achievements

| ID | Title | Status |
|---|---|---|
| TASK-040 | Invite rewards (shield on friend accept) | 🟡 CREATED |
| TASK-041 | Extended achievements (SOCIAL, CHALLENGES) | 🟡 CREATED |

## Batch 6: Auth Hardening

| ID | Title | Status |
|---|---|---|
| TASK-050 | Email verification (non-blocking, 7-day grace) | 🟡 CREATED |
| TASK-051 | Google OAuth (passport-google-oauth20, merge) | 🟡 CREATED |

## Batch 7: Settings & Catalog

| ID | Title | Status |
|---|---|---|
| TASK-060 | Extended settings (currency, weekStartDay, units) | 🟡 CREATED |
| TASK-061 | Habit catalog seed (20+ popular items, quick-add) | 🟡 CREATED |

## Batch 8: Telegram Integration

| ID | Title | Status |
|---|---|---|
| TASK-070 | Telegram Bot (/link, /start, /stats) | 🟡 CREATED |
| TASK-071 | Push notifications (Web Push + Telegram) | 🟡 CREATED |
| TASK-072 | Telegram Mini App | 🟡 CREATED |

## Batch 9: Analytics & Reports

| ID | Title | Status |
|---|---|---|
| TASK-080 | Simple analytics (pattern analysis, SQL) | 🟡 CREATED |
| TASK-081 | Annual/Monthly report (Wrapped style) | 🟡 CREATED |
| TASK-082 | Positive habits (habitType: ACHIEVEMENT) | 🟡 CREATED |

## Batch 10: Production Readiness

| ID | Title | Status |
|---|---|---|
| OPS-020 | Security hardening (rate limiting, CORS, Helmet) | 🟡 CREATED |
| OPS-021 | DB optimization (indexes, query analysis) | 🟡 CREATED |
| OPS-022 | E2E tests expansion (habits, challenges, gamification) | 🟡 CREATED |
| OPS-023 | Error boundaries + loading states (frontend) | 🟡 CREATED |
| OPS-024 | Deployment (domain, VPS, CI/CD pipeline) | 🟡 CREATED |

## Batch 11: Code Refactoring

| ID | Title | Status |
|---|---|---|
| OPS-030 | Code style unification (ESLint + Prettier config) | 🟡 CREATED |
| OPS-031 | Architecture patterns audit (services, DTOs, hooks) | 🟡 CREATED |
| OPS-032 | Dead code cleanup + unused imports | 🟡 CREATED |
| OPS-033 | CSS/Tailwind cleanup + design system tokens | 🟡 CREATED |
| OPS-034 | API response format standardization | 🟡 CREATED |
| OPS-035 | Shared types audit (contracts ↔ api ↔ web sync) | 🟡 CREATED |
