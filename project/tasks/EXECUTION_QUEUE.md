# StayOnTrack — Execution Queue

This is the live source of truth for what should be executed next.

## ✅ Completed

### Phase 0: Foundation
1. OPS-001 — Monorepo setup
2. OPS-002 — NestJS backend skeleton
3. OPS-003 — Next.js frontend skeleton
4. OPS-004 — Shared contracts package
5. OPS-005 — Agent system and documentation

### Phase 1: Core Solo Experience
6. TASK-001 — Auth module backend (register, login, JWT, profile)
7. TASK-002 — Habits CRUD module (backend + frontend)
8. TASK-003 — Daily check-in module (habit logs, batch check-in)
9. TASK-004 — Stats & equivalents module (charts, calendar heatmap)
10. TASK-005 — Activities catalog (seed data)
11. TASK-006 — Streak logic + Streak Shield (1/week, Monday replenish)
12. TASK-007 — Frontend: Auth pages (register, login)
13. TASK-008 — Frontend: Home screen (dashboard)
14. TASK-009 — Frontend: Habits management pages
15. TASK-010 — Frontend: Daily check-in + rewards
16. TASK-011 — Frontend: Stats & equivalents screens
17. TASK-012 — Frontend: Onboarding flow (4-step wizard)
18. TASK-013 — i18n setup (EN + RU, cookie-based)

### Phase 2: Basic Social
19. TASK-020 — Friends module (requests, friendships, leaderboard, privacy)
20. TASK-021 — Privacy settings (visibility: private/friends/public)
21. TASK-022 — Friend leaderboard
22. TASK-023 — Frontend: Friends page (3 tabs)
23. TASK-024 — Frontend: Privacy settings in Settings page
24. TASK-025 — Frontend: Leaderboard in Friends page

### Infrastructure
25. TASK-015 — Frequency limits (daily/weekly/custom enforcement)
26. TASK-016 — Achievements system (25 milestones, dynamic calculation)
27. OPS-010 — PWA manifest
28. OPS-011 — Unit tests (24 tests) + CI/CD (GitHub Actions)
29. OPS-012 — Dark mode + mobile-first UI

### Wave 2: Code Quality (TASK-200–213)
30. TASK-200–213 — Validation, strict TS, type safety, timezone utils, 118 unit tests, 20 E2E tests, seed data

### Wave 3A: Visualization (TASK-300–304)
31. TASK-300–304 — Trend charts, heatmap, count-up counters, sparklines, goals

### Wave 3B: Gamification (TASK-305–311)
32. TASK-305–311 — XP, levels, quests, streak recovery, unlockable themes

### Wave 3C: Group Challenges (TASK-312–316)
33. TASK-312–316 — Extended challenges, invite codes, group flow, leaderboard, public browse

### Wave 3D: PWA + Notifications (TASK-317–321)
34. TASK-317–321 — Offline queue, daily reminder, streak warning, weekly digest, settings UI

### Wave 4A: Critical Fixes
35. FIX-401–404 — Neon ring v3 inline styles, timezone sync, Tailwind conflict, UTC fix

---

## 🔵 Next Up — Sequential Execution Order

### Batch 5: Social Rewards + Extended Achievements
36. TASK-040 — Invite rewards (shield on friend accept, no limit)
37. TASK-041 — Extended achievements (SOCIAL, CHALLENGES categories)

### Batch 6: Auth Hardening
38. TASK-050 — Email verification (non-blocking, banner, 7-day grace)
39. TASK-051 — Google OAuth (passport-google-oauth20, account merge)

### Batch 7: Settings & Catalog
40. TASK-060 — Extended settings (currency, weekStartDay, imperial units)
41. TASK-061 — Habit catalog seed (20+ popular items, quick-add)

### Batch 8: Telegram Integration
42. TASK-070 — Telegram Bot (basic: /link, /start, /stats)
43. TASK-071 — Push notifications (Web Push + Telegram)
44. TASK-072 — Telegram Mini App

### Batch 9: Analytics & Reports
45. TASK-080 — Simple analytics (pattern analysis, SQL-based)
46. TASK-081 — Annual/Monthly report (Wrapped style)
47. TASK-082 — Positive habits (habitType: ACHIEVEMENT)

### Batch 10: Production Readiness (BEFORE LAUNCH)
48. OPS-020 — Security hardening (rate limiting, CORS, Helmet)
49. OPS-021 — DB optimization (indexes, query analysis, N+1)
50. OPS-022 — E2E tests expansion (habits, challenges, gamification)
51. OPS-023 — Error boundaries + loading states (frontend)
52. OPS-024 — Deployment (domain, VPS, CI/CD, SSL, monitoring)

### Batch 11: Code Refactoring (FINAL POLISH)
53. OPS-030 — Code style unification (ESLint + Prettier)
54. OPS-031 — Architecture patterns audit
55. OPS-032 — Dead code cleanup
56. OPS-033 — CSS/Tailwind cleanup + design tokens
57. OPS-034 — API response format standardization
58. OPS-035 — Shared types audit (contracts sync)
