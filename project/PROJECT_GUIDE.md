# StayOnTrack — Project Guide

## Product Essence
**StayOnTrack** is a behavior change app that tracks what the user **AVOIDED**, not what they consumed.
The core emotional hook: turning refusal into visible, tangible progress.

**Tagline:** "Track what you avoided, not what you consumed."

**Core formula:** Avoided habit → Saved value → Visible progress → Social reinforcement → Long-term behavior change.

## Four Progress Currencies
1. **Saved Calories** — kcal the user avoided
2. **Effort Equivalent** — translating saved kcal into physical activity (50 min running, 1000 squats, etc.)
3. **Saved Money** — money not spent on the bad habit
4. **Potential Weight Avoided** — approximate kg equivalent (savedCalories / 7700). SECONDARY metric, never the main focus.

## Product Rules (NON-NEGOTIABLE)
1. **Tone: supportive, NOT shaming.** Show gain, not guilt. Never punish the user.
2. **Partial progress ALWAYS counts.** Eating half is a win.
3. **Weight is SECONDARY.** Use "potential weight avoided", not "you lost weight."
4. **Daily check-in must take 3–5 seconds.** Tap and done.
5. **Every action must give instant reward + animation.** +320 kcal saved, +€3 saved, streak +1.
6. **Streak Shield** protects the streak on a bad day (1 per week).

## Tech Stack
| Layer | Technology |
|---|---|
| Backend | NestJS + TypeORM + PostgreSQL + JWT |
| Frontend | Next.js 14+ (App Router) + Tailwind CSS + shadcn/ui |
| Mobile | Future: React Native / Expo OR Telegram Mini App |
| Shared Types | @stayontrack/contracts (TypeScript package) |
| Monorepo | Turborepo + npm workspaces |
| Container | Docker (PostgreSQL) |
| Hosting | VPS (backend) + VPS or Vercel (frontend) |
| CI/CD | GitHub Actions (later) |

## Architecture: Modular Monolith
```
stayontrack/
├── apps/
│   ├── api/          # NestJS backend (port 4700)
│   ├── web/          # Next.js frontend (port 4701)
│   └── mobile/       # Future React Native
├── packages/
│   └── contracts/    # Shared types, enums, formulas
├── project/          # All project management
│   ├── docs/         # Architecture & domain docs
│   ├── tasks/        # Task tracking files
│   ├── decisions/    # Decision log
│   └── agents/       # Agent definitions
├── docker-compose.yml
├── turbo.json
└── package.json
```

## Backend Modules (NestJS)
| Module | Responsibility | MVP Phase |
|---|---|---|
| AuthModule | Registration, login, JWT | Phase 1 |
| UsersModule | Profile, settings, privacy | Phase 1 |
| HabitsModule | Habit CRUD | Phase 1 |
| HabitLogsModule | Daily check-in, saved calculations | Phase 1 |
| StatsModule | Summaries, equivalents, progress | Phase 1 |
| ActivitiesModule | Activity catalog (reference data) | Phase 1 |
| FriendsModule | Friend requests, friendships | Phase 2 |
| LeaderboardsModule | Global, friends, challenge rankings | Phase 2 |
| ChallengesModule | Challenge CRUD, invite flow, progress | Phase 3 |

## Module Boundary Rules
- Each module has its own service, controller, DTOs, entities
- Modules communicate through **exported services** (facades), NOT by importing each other's repositories
- Shared business logic lives in @stayontrack/contracts
- Domain rules stay inside their module (streak logic in HabitLogs or Stats, not scattered)

## API Convention
- Base URL: `/api/v1`
- All endpoints return JSON
- Auth: Bearer JWT token in Authorization header
- Validation: class-validator on all DTOs
- Errors: standard NestJS exception filters

## Database
- PostgreSQL 16 on port 5450 (Docker)
- TypeORM with Data Mapper pattern (repositories)
- Dev: synchronize=true. Prod: migrations only
- UUID primary keys

## Frontend Convention
- App Router (src/app/)
- Server Components by default, 'use client' only when needed
- Tailwind CSS + shadcn/ui components
- Dark mode via next-themes (class strategy)
- i18n via next-intl (EN + RU first)
- Mobile-first responsive design
- Color palette:
  - Primary: #4F7CF7 (blue)
  - Success/Calories: #2ECC71 (green)
  - Warning/Effort: #F39C12 (orange)
  - Danger: #E74C3C (red)
  - Streak: #9B59B6 (purple)
  - Achievement: #F1C40F (yellow)

## Local Development
```bash
# Start database
npm run db:up

# Start all apps
npm run dev

# Start only backend
npm run dev:api

# Start only frontend
npm run dev:web
```

### Local Service Map
- Web: http://localhost:4701
- API: http://localhost:4700/api/v1
- PostgreSQL: localhost:5450

## Internationalization
- Supported: EN, RU (MVP). Later: UA, FR, PT, ES
- Default locale: EN
- Units: metric (kg, km, m, L, g)
- Default currency: EUR
- All user-facing strings must use i18n keys, never hardcoded text

## Key Formulas (from @stayontrack/contracts)
```typescript
savedCalories = caloriesPerOccurrence * (1 - portionRatio)
savedMoney = pricePerOccurrence * (1 - portionRatio)
potentialWeightAvoidedKg = totalSavedCalories / 7700
caloriesPerMinute = (MET * 3.5 * weightKg) / 200
activityEquivalent = savedCalories / caloriesPerUnit
```

## Streak Rules (MVP)
- Day is successful if ALL active habits have status: avoided OR (partial AND portionRatio <= 0.5)
- consumed = streak break (unless Streak Shield is available)
- Streak Shield: 1 per week, auto-replenishes every Monday
- Streak Shield auto-applies on first break of the week

## MVP Scope
### Phase 1 — Core Solo Experience
Auth, Habits CRUD, Daily check-in, Stats summary, Effort equivalents, Streak + Shield

### Phase 2 — Basic Social
Friends, Privacy settings, Friend leaderboard

### Phase 3 — Challenges
Create challenge, Invite friend, Compare progress, Winner logic

## Future Architecture Notes
- habitType: 'avoidance' | 'achievement' field is in the schema for future positive habit tracking
- When splitting to microservices, candidates: notifications, stats/analytics, leaderboards, social/challenges
- Modules communicate through facades now → easy to replace with message queue later
