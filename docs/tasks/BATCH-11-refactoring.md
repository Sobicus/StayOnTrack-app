# Batch 11: Code Refactoring (Final Polish)

## Tasks
- OPS-030 — Code style unification
- OPS-031 — Architecture patterns audit
- OPS-032 — Dead code cleanup
- OPS-033 — CSS/Tailwind cleanup + design tokens
- OPS-034 — API response format standardization
- OPS-035 — Shared types audit

## Context
This batch runs AFTER all features are complete and BEFORE production launch.
Goal: clean, maintainable, consistent codebase that any developer can onboard to.

## Scope

### OPS-030: Code Style Unification
**Agent roles:** core, qa

**Implementation:**
- Strict ESLint config shared across all packages:
  - No `any` (already done in backend, verify frontend)
  - Consistent import ordering (external → internal → relative)
  - No unused variables/imports
  - Consistent naming: camelCase functions, PascalCase components, UPPER_CASE constants
- Prettier config shared:
  - Single quotes, trailing commas, semicolons
  - Print width 100, tab width 2
- Add lint-staged + husky pre-commit hook
- Run full lint fix across entire codebase

### OPS-031: Architecture Patterns Audit
**Agent roles:** architect, core

**Review checklist:**
- [ ] All services follow same pattern: inject repo → validate → execute → return DTO
- [ ] All controllers: validate DTO → call service → return response
- [ ] Consistent error handling: use NestJS exceptions (NotFoundException, BadRequestException, etc.)
- [ ] No business logic in controllers (must be in services)
- [ ] No direct repository access from controllers
- [ ] Frontend hooks follow consistent pattern: useAuth, useFetch, useDebounce, etc.
- [ ] API client (api.ts) follows consistent namespace pattern
- [ ] All pages follow consistent layout: header → content → navigation
- [ ] 'use client' only where strictly needed (not on server-compatible pages)

### OPS-032: Dead Code Cleanup
**Agent roles:** core, qa

**Implementation:**
- Remove unused imports across all files
- Remove commented-out code blocks
- Remove unused components/pages
- Remove unused API endpoints
- Remove test ring pages (if any remain)
- Remove AccentThemeProvider if permanently abandoned
- Remove OfflineBanner old implementation (if replaced)
- Verify no orphaned entity fields
- Check for unused i18n keys

### OPS-033: CSS/Tailwind Cleanup + Design Tokens
**Agent roles:** frontend, design

**Implementation:**
- Audit globals.css: remove old CSS classes that are no longer used
- Verify all CSS variables are documented and consistent
- Create design token reference:
  - Colors: --background, --card, --foreground, --muted, --border, --accent-color
  - Spacing: consistent use of Tailwind spacing scale
  - Typography: font sizes, weights, line heights
  - Borders: radius values, widths
  - Shadows: consistent shadow classes
- Remove any inline styles that could be Tailwind classes (EXCEPT LiveHero ring — DEC-016)
- Ensure dark mode works on ALL components (test each page)

### OPS-034: API Response Format Standardization
**Agent roles:** backend, architect

**Implementation:**
- All successful responses: `{ data: T }` or `T` directly (pick one, be consistent)
- All error responses: `{ statusCode, message, error }` (NestJS default — verify all match)
- All list responses: `{ data: T[], total: number, page: number, limit: number }` for paginated
- All timestamps: ISO 8601 format
- All money values: number (not string) with 2 decimal places
- Document API response format in PROJECT_GUIDE.md

### OPS-035: Shared Types Audit
**Agent roles:** core, architect

**Implementation:**
- Verify all types in `packages/contracts/` are actually shared (used by both api and web)
- Move api-only types to api package
- Move web-only types to web package
- Ensure no duplicate type definitions between packages
- Verify enum values match between frontend and backend
- Check that DTOs, entities, and frontend types are aligned
- Add barrel exports (index.ts) for clean imports

## Estimated Effort: 10-14 hours
## Build verification: full lint pass, full build, full test suite, visual inspection of all pages
## Rule: NO NEW FEATURES in this batch — only cleanup and consistency
