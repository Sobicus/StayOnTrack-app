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

## Phase 3: Challenges + Social Rewards

| ID | Title | Status | Phase |
|---|---|---|---|
| TASK-030 | Challenges backend (1-on-1, scalable) | 🟡 CREATED | 3.1 |
| TASK-031 | Challenges frontend | 🟡 CREATED | 3.1 |
| TASK-040 | Invite rewards (shield on friend accept) | 🟡 CREATED | 3.2 |
| TASK-041 | Extended achievements (SOCIAL, CHALLENGES) | 🟡 CREATED | 3.2 |

## Phase 4: Auth Upgrade

| ID | Title | Status | Phase |
|---|---|---|---|
| TASK-050 | Email verification (non-blocking) | 🟡 CREATED | 4.1 |
| TASK-051 | Google OAuth (account merge) | 🟡 CREATED | 4.2 |

## Phase 5: Settings & UX

| ID | Title | Status | Phase |
|---|---|---|---|
| TASK-060 | Extended settings (currency, units, week start) | 🟡 CREATED | 5.1 |
| TASK-061 | Habit catalog seed (20+ popular items) | 🟡 CREATED | 5.2 |

## Phase 6: Telegram Integration

| ID | Title | Status | Phase |
|---|---|---|---|
| TASK-070 | Telegram Bot (basic) | 🟡 CREATED | 6.1 |
| TASK-071 | Push notifications (Web Push + Telegram) | 🟡 CREATED | 6.2 |
| TASK-072 | Telegram Mini App | 🟡 CREATED | 6.3 |

## Phase 7: Polish & Analytics

| ID | Title | Status | Phase |
|---|---|---|---|
| TASK-080 | Simple analytics (pattern analysis) | 🟡 CREATED | 7.1 |
| TASK-081 | Annual/Monthly report (Wrapped style) | 🟡 CREATED | 7.2 |
| TASK-082 | Positive habits (habitType: ACHIEVEMENT) | 🟡 CREATED | 7.3 |
