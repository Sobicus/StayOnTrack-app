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

## DEC-016: LiveHero Neon Ring — Inline Styles Only (v3)
**Date:** 2026-03-14
**Decision:** All ring visual styles MUST be 100% inline in JSX. Only `@keyframes` live in globals.css. Ring container has `data-ring-v="3"` attribute.
**Alternatives tried (all failed):**
1. CSS classes (`ring-calories`, `ring-money`, `ring-weight`) — broken by Tailwind `ring-*` utility conflict
2. `mask-composite: exclude` + conic-gradient — does NOT render in Chromium
3. `::before`/`::after` pseudo-elements with CSS class selectors — breaks on Tailwind purge and `.next` cache
**Rationale:** Ring was broken 4+ times by CSS-dependent approaches. Inline styles are immune to Tailwind purging, CSS class conflicts, and build cache issues.

### Ring Architecture (5 layers inside 220x220 container)
```
Layer 1: Radial glow    — config.glowBg + config.glowShadow + animation: hero-pulse 3s
Layer 2: Rotating ring   — overflow:hidden div with two children:
  - Child A: spinning gradient (inset -50%, background: config.ringGradient, animation: hero-ring-spin 6s)
  - Child B: center cutout (inset 4px, background: var(--background), z-index 1)
Layer 3: Sparkles        — 5 dots, config.sparkleColor, sparkle-1/2/3 animations
Layer 4: SVG progress    — z-index 5, track circle + active arc + glow dot
Layer 5: Center content  — z-index 10, icon + value + unit + timer
```

### Color Palette per Metric
| Metric | Ring gradient | CSS color | Sparkle |
|--------|-------------|-----------|---------|
| calories | amber conic `rgba(251,191,36)` | `rgba(251,191,36,0.8)` | `#fbbf24` |
| money | green conic `rgba(34,197,94)` | `rgba(34,197,94,0.8)` | `#22c55e` |
| weight | purple conic `rgba(168,85,247)` | `rgba(168,85,247,0.8)` | `#a855f7` |

### Required @keyframes in globals.css
- `hero-ring-spin` — 360deg rotation, 6s linear infinite
- `hero-pulse` — opacity 0.6→1, scale 1→1.04, 3s ease-in-out infinite
- `dot-pulse` — opacity 0.8→1, r 5→7, 1.5s ease-in-out infinite
- `sparkle-1`, `sparkle-2`, `sparkle-3` — translate + scale + opacity

### NEVER DO
- Use CSS class names starting with `ring-` (Tailwind conflict)
- Use `mask-composite` (Chromium bug)
- Put ring gradient/glow styles in CSS classes (purging risk)
- Reload with F5 after ring changes (use Ctrl+Shift+R)

## DEC-017: Timezone Handling — User-Local via IANA
**Date:** 2026-03-14
**Decision:** Store IANA timezone string in `users.timezone`. Auto-sync from browser on login via `Intl.DateTimeFormat().resolvedOptions().timeZone`. All date queries use `getTodayInTimezone(user.timezone)`.
**Rationale:** User in Europe/Madrid was seeing UTC dates, causing check-ins to appear on wrong day. Browser-detected timezone is always correct.
