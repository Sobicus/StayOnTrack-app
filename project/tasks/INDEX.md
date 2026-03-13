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
| TASK-002 | Habits CRUD module | 🟡 CREATED | 1.2 |
| TASK-003 | Daily check-in module (habit logs) | 🟡 CREATED | 1.3 |
| TASK-004 | Stats & equivalents module | 🟡 CREATED | 1.4 |
| TASK-005 | Activities catalog (seed data) | 🟡 CREATED | 1.4 |
| TASK-006 | Streak logic + Streak Shield | 🟡 CREATED | 1.5 |
| TASK-007 | Frontend: Auth pages (register, login) | 🟡 CREATED | 1.1 |
| TASK-008 | Frontend: Home screen | 🟡 CREATED | 1.6 |
| TASK-009 | Frontend: Habits management pages | 🟡 CREATED | 1.2 |
| TASK-010 | Frontend: Daily check-in screen + rewards | 🟡 CREATED | 1.3 |
| TASK-011 | Frontend: Stats & equivalents screens | 🟡 CREATED | 1.4 |
| TASK-012 | Frontend: Onboarding flow | 🟡 CREATED | 1.6 |
| TASK-013 | i18n setup (EN + RU) | 🟡 CREATED | 1.6 |
| TASK-014 | Habit catalog seed (popular items) | 🟡 CREATED | 1.2 |

## Phase 2: Basic Social

| ID | Title | Status | Phase |
|---|---|---|---|
| TASK-020 | Friends module (requests, friendships) | 🟡 CREATED | 2.1 |
| TASK-021 | Privacy settings module | 🟡 CREATED | 2.2 |
| TASK-022 | Friend leaderboard module | 🟡 CREATED | 2.3 |
| TASK-023 | Frontend: Friends pages | 🟡 CREATED | 2.1 |
| TASK-024 | Frontend: Privacy settings page | 🟡 CREATED | 2.2 |
| TASK-025 | Frontend: Leaderboard page | 🟡 CREATED | 2.3 |

## Phase 3: Challenges

| ID | Title | Status | Phase |
|---|---|---|---|
| TASK-030 | Challenges module (CRUD, invite, progress, winner) | 🟡 CREATED | 3 |
| TASK-031 | Frontend: Challenge pages | 🟡 CREATED | 3 |
