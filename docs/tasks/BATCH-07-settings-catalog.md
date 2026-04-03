# Batch 7: Settings & Catalog

## Tasks
- TASK-060 — Extended settings
- TASK-061 — Habit catalog seed

## Scope

### TASK-060: Extended Settings
**Agent roles:** backend, frontend
**Depends on:** User entity (has `currency` field already? check), Settings page (COMPLETED)

**Backend:**
- Add/verify User entity fields:
  - `currency: string` (default 'EUR') — EUR, USD, GBP, PLN, UAH, RUB
  - `weekStartDay: number` (default 1 = Monday) — 0=Sun, 1=Mon
  - `unitSystem: string` (default 'metric') — 'metric' | 'imperial'
  - `language: string` (default 'en') — 'en' | 'ru' (future: 'uk', 'es', 'fr', 'pt')
- Update `PATCH /users/me` to accept all new fields
- Update stats formatting to respect currency + unit system
- Weight display: kg (metric) / lbs (imperial), conversion factor 2.205

**Frontend:**
- Settings page sections:
  - Currency selector (dropdown with symbols)
  - Unit system toggle (Metric / Imperial)
  - Week start day (Monday / Sunday)
  - Language selector (EN / RU)
- All selections should take effect immediately (no save button)
- Dashboard, stats, and habit displays respect these settings

**Risks:**
- Currency symbol already handled in LiveHero via CURRENCY_SYMBOLS map — extend it
- i18n already exists via next-intl — language change should switch locale
- Imperial conversions affect: weight stats, effort equivalents

### TASK-061: Habit Catalog Seed
**Agent roles:** backend, frontend, retention
**Depends on:** Activities module (COMPLETED), Habits module (COMPLETED)

**Backend:**
- Create `habit-templates` table or JSON catalog: 20+ popular items
- Categories: Fast Food, Sweets, Drinks, Snacks, Smoking, Alcohol, Shopping
- Each template: name (EN + RU), defaultCalories, defaultMoney, emoji, category
- `GET /habits/templates` — return catalog filtered by locale
- "Quick add" should create a Habit from template with user's currency prices

**Frontend:**
- "Quick add" grid on Habits page (already partially exists as БЫСТРОЕ ДОБАВЛЕНИЕ)
- Currently shows user's existing habits — need to also show catalog templates
- Category filter tabs
- Tap template → creates habit with defaults → user can edit
- Search/filter within catalog

**Catalog items (examples):**
| Name | Calories | Price (EUR) | Category |
|------|----------|-------------|----------|
| Big Mac | 550 | 5.50 | Fast Food |
| Pizza Slice | 285 | 3.00 | Fast Food |
| Coca-Cola 0.5L | 210 | 2.50 | Drinks |
| Beer 0.5L | 215 | 4.00 | Alcohol |
| Cigarette Pack | 0 | 7.00 | Smoking |
| Chocolate Bar | 230 | 2.50 | Sweets |
| Donut | 250 | 2.00 | Sweets |
| Chips Bag | 540 | 3.50 | Snacks |
| ... (20+ total) | | | |

**Risks:**
- Prices vary by country — use EUR defaults, user adjusts
- Calorie values should be medically accurate (cross-reference)
- Must support both i18n names

## Estimated Effort: 6-8 hours
## Build verification: build + check habit creation flow
