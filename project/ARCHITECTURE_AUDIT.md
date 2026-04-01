# Architecture Patterns Audit — OPS-031

**Date**: 2026-03-28
**Scope**: Backend (apps/api) + Frontend (apps/web)

---

## Check 1: Controllers Should NOT Have Business Logic

Controllers should only handle HTTP concerns (request parsing, response mapping, guards).
Business logic (loops, conditionals, data transformations) belongs in services.

### Findings

| Controller | Status | Notes |
|---|---|---|
| `auth.controller.ts` | OK | Pure delegation to AuthService |
| `habits.controller.ts` | OK | Delegates to HabitsService, only maps DTOs |
| `habit-logs.controller.ts` | OK | Delegates to HabitLogsService |
| `stats.controller.ts` | OK | Minor query param parsing (parseFloat, parseInt) — acceptable |
| `challenges.controller.ts` | OK | Delegates to ChallengesService |
| `friends.controller.ts` | OK | Delegates to FriendsService |
| `users.controller.ts` | OK | Delegates to UsersService |
| `gamification.controller.ts` | OK | Delegates to GamificationService |
| `achievements.controller.ts` | OK | Delegates to AchievementsService |
| `streaks.controller.ts` | OK | Delegates to StreaksService |
| `activities.controller.ts` | OK | Simple category filter conditional — acceptable |
| `notifications.controller.ts` | OK | Delegates to NotificationsService |
| **`analytics.controller.ts`** | **NEEDS FIX** (P3 — Low) | `getDailyActiveUsers()` contains a for-loop building results array. This logic should be in AnalyticsService. |
| **`health.controller.ts`** | **NEEDS FIX** (P3 — Low) | Inline DB query + try/catch + response construction. Should use a HealthService. |

**Summary**: 12/14 controllers are clean. 2 have minor violations (low priority).

---

## Check 2: 'use client' Only Where Needed

Next.js App Router pages that don't use hooks/state/browser APIs don't need `'use client'`.

### Findings

All 16 page files in `apps/web/src/app/` have `'use client'`.
All 16 pages use React hooks (useState, useEffect, useRouter, useAuth, useTranslations, etc.).

| Page | Status | Hooks Used |
|---|---|---|
| `page.tsx` (home) | OK | Uses hooks |
| `dashboard/page.tsx` | OK | Uses hooks |
| `habits/page.tsx` | OK | Uses hooks |
| `stats/page.tsx` | OK | Uses hooks |
| `stats/report/page.tsx` | OK | Uses hooks |
| `settings/page.tsx` | OK | Uses hooks |
| `friends/page.tsx` | OK | Uses hooks |
| `challenges/page.tsx` | OK | Uses hooks |
| `challenges/[id]/page.tsx` | OK | Uses hooks |
| `achievements/page.tsx` | OK | Uses hooks |
| `auth/login/page.tsx` | OK | Uses hooks |
| `auth/register/page.tsx` | OK | Uses hooks |
| `auth/forgot-password/page.tsx` | OK | Uses hooks |
| `auth/reset-password/page.tsx` | OK | Uses hooks |
| `auth/verify-email/page.tsx` | OK | Uses hooks |
| `auth/google/callback/page.tsx` | OK | Uses hooks |

**Summary**: All `'use client'` directives are justified. No changes needed.

**Note for future**: If pages are refactored to use Server Components with client sub-components, the `'use client'` can be pushed down to leaf components for better SSR performance.

---

## Check 3: Consistent Error Handling

All service methods should use NestJS HTTP exceptions (NotFoundException, BadRequestException, etc.) rather than raw Error throws.

### Findings

| Service | Status | Exception Types Used |
|---|---|---|
| `auth.service.ts` | OK | UnauthorizedException, NotFoundException, BadRequestException |
| `users.service.ts` | OK | ConflictException, NotFoundException |
| `habits.service.ts` | OK | NotFoundException, ForbiddenException |
| `habit-logs.service.ts` | OK | NotFoundException, BadRequestException |
| `friends.service.ts` | OK | NotFoundException, BadRequestException, ConflictException |
| `challenges.service.ts` | OK | BadRequestException, NotFoundException, ForbiddenException |
| `streaks.service.ts` | OK | BadRequestException |
| `gamification.service.ts` | OK | NotFoundException |
| `activities.service.ts` | OK | No throws needed (read-only, returns empty arrays) |
| `analytics.service.ts` | OK | No throws needed (read-only, aggregation queries) |
| `notifications.service.ts` | OK | No throws needed (batch operations, silent failures) |
| `stats.service.ts` | OK | No throws needed (returns zero/empty for missing data) |
| `achievements.service.ts` | OK | No throws needed (read-only) |

**Global exception filter**: `common/filters/all-exceptions.filter.ts` is registered in `main.ts` to catch unhandled exceptions.

**Summary**: All services use proper NestJS exceptions consistently. No raw `throw new Error()` found anywhere. Global exception filter is in place.

---

## Overall Summary

| Check | Result | Action Required |
|---|---|---|
| Controllers without business logic | 12/14 OK | 2 minor violations (P3) |
| 'use client' directives | 16/16 OK | None |
| Error handling consistency | 15/15 OK | None |

### Low-Priority Fixes (P3 — Future)

1. **`analytics.controller.ts` line 35-48**: Move DAU loop logic into `AnalyticsService.getDailyActiveUsersSeries(days)` method.
2. **`health.controller.ts`**: Extract DB check into a `HealthService` for testability and separation of concerns.

These are minor and do not affect functionality or reliability. They can be addressed during future maintenance.
