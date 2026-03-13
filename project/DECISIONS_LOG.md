# StayOnTrack — Decisions Log

All architecture, product, and process decisions are recorded here with context and rationale.

---

## DEC-001: Product Name
**Date:** 2026-03-13
**Decision:** StayOnTrack
**Alternatives considered:** SkipIt, Effortless, Avoid, Discipline, NotEaten
**Rationale:** Owner's choice. Name conveys consistency and discipline.

## DEC-002: Tech Stack
**Date:** 2026-03-13
**Decision:** NestJS + TypeORM + PostgreSQL + JWT (backend), Next.js + Tailwind + shadcn/ui (frontend)
**Rationale:** Owner has NestJS/TypeORM experience. Next.js chosen for SSR, routing, SEO. Tailwind+shadcn for free, stylish, Apple/Google-quality UI.

## DEC-003: Architecture — Modular Monolith in Monorepo
**Date:** 2026-03-13
**Decision:** Single monorepo with Turborepo. Backend is modular monolith, NOT microservices.
**Rationale:** Product risk > infra risk at MVP stage. Monolith is faster to develop, debug, deploy. Module boundaries designed for future microservice extraction.

## DEC-004: No Redis in MVP
**Date:** 2026-03-13
**Decision:** PostgreSQL only. No Redis cache.
**Rationale:** No heavy leaderboards or real-time features in MVP. Add Redis when caching/queues become necessary.

## DEC-005: Internationalization — EN + RU first
**Date:** 2026-03-13
**Decision:** Start with English and Russian. Future: Ukrainian, French, Portuguese, Spanish.
**Rationale:** Owner's primary markets. i18n architecture (next-intl) set up from day 1.

## DEC-006: Mobile-first Responsive Web
**Date:** 2026-03-13
**Decision:** Design mobile-first, expand to desktop with additional columns and charts.
**Rationale:** 80%+ target users on mobile. Telegram Mini App as potential first mobile surface.

## DEC-007: Avoidance-only in MVP
**Date:** 2026-03-13
**Decision:** MVP tracks only negative habits (avoidance). Positive habits (achievement) deferred to v2.
**Rationale:** Avoidance tracking is the product's unique differentiator. Adding positive habits doubles scope without adding uniqueness.
**Future-proofing:** habitType field in schema ('avoidance' | 'achievement').

## DEC-008: Streak Shield in MVP
**Date:** 2026-03-13
**Decision:** Include simple Streak Shield (1 per week, auto-replenish Monday).
**Rationale:** High retention impact, low implementation complexity. Prevents user demotivation from single slip.

## DEC-009: Dark Mode from Day 1
**Date:** 2026-03-13
**Decision:** Both light and dark themes from the start using next-themes.
**Rationale:** UI/UX concept already defines both palettes. next-themes makes it trivial.

## DEC-010: Task Tracking in Repo
**Date:** 2026-03-13
**Decision:** All task tracking via markdown files in project/tasks/.
**Rationale:** Free, close to code, full AI agent access. No external tool dependency.

## DEC-011: Email via Gmail SMTP for MVP
**Date:** 2026-03-13
**Decision:** Use owner's Gmail for transactional emails in MVP.
**Rationale:** Zero cost. Switch to Resend/SendGrid when scaling.

## DEC-012: Docker Ports
**Date:** 2026-03-13
**Decision:** PostgreSQL on port 5450, API on 4700, Web on 4701.
**Rationale:** Avoids conflicts with existing containers (5432, 5433, 5440, 5401 occupied).

## DEC-013: UI Library — Tailwind + shadcn/ui
**Date:** 2026-03-13
**Decision:** Tailwind CSS + shadcn/ui + Recharts + Framer Motion.
**Rationale:** Free, beautiful, Apple/Google quality, fully customizable, no vendor lock-in.

## DEC-014: Monorepo Manager — Turborepo
**Date:** 2026-03-13
**Decision:** Turborepo + npm workspaces.
**Rationale:** Free, fast, minimal config, great Next.js integration. Nx would be overkill.

## DEC-015: Default Units and Currency
**Date:** 2026-03-13
**Decision:** EUR, kg, m, km, L, g (metric system).
**Rationale:** European market first. Conversion to imperial for US market in future.
