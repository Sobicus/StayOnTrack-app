# Batch 9: Analytics & Reports

## Tasks
- TASK-080 — Simple analytics
- TASK-081 — Annual/Monthly report
- TASK-082 — Positive habits

## Scope

### TASK-080: Simple Analytics (Pattern Analysis)
**Agent roles:** backend, frontend
**Depends on:** Stats module (COMPLETED), habit_logs table

**Backend:**
- Analytics module already exists (`apps/api/src/modules/analytics/`) with basic endpoints
- Extend with user-facing pattern analysis:
  - `GET /stats/patterns` — analyze user's habit log patterns:
    - Best day of week (most avoidances)
    - Worst day of week (most failures)
    - Best time of day (if time tracking added)
    - Most avoided habit
    - Longest streak per habit
    - Category breakdown (% fast food vs drinks vs sweets)
  - `GET /stats/insights` — generated text insights:
    - "You're strongest on Wednesdays — 89% avoidance rate"
    - "Weekends are your challenge — consider setting a weekend goal"
    - "You saved 12,500 kcal this month — equivalent to 3.5 hours of running"

**Frontend:**
- New section on Stats page: "Insights"
- Pattern cards with icons and numbers
- Day-of-week bar chart (Mon-Sun avoidance rate)
- Category pie/donut chart
- "Most improved" highlight

**Risks:**
- Need enough data (7+ days) before showing patterns — show "Keep logging to unlock insights" otherwise
- SQL queries must be efficient — use GROUP BY with date functions, not app-level aggregation

### TASK-081: Annual/Monthly Report (Wrapped Style)
**Agent roles:** backend, frontend, design, retention
**Depends on:** TASK-080 (patterns), Stats module

**Backend:**
- `GET /stats/report?period=month&date=2026-03` — comprehensive monthly report
- `GET /stats/report?period=year&date=2026` — annual report
- Report data:
  - Total saved: calories, money, weight
  - Total check-ins, avoidance rate
  - Best streak, current streak
  - Top 3 most avoided habits
  - Comparison to previous period (% change)
  - Fun equivalents ("You saved enough for 23 movie tickets")
  - Rank among friends (optional, if friends exist)

**Frontend:**
- Swipeable card deck (Spotify Wrapped style):
  - Card 1: "Your March 2026" — total savings hero number
  - Card 2: Top habit avoided
  - Card 3: Streak highlight
  - Card 4: Money saved equivalents
  - Card 5: Comparison to last month
  - Card 6: "Share your results" (screenshot/share)
- Accessible from Stats page: "View Monthly Report" button
- Animated transitions between cards (Framer Motion)

**Risks:**
- Share functionality needs canvas-to-image (html2canvas or similar)
- Reports for periods with no data should show "Not enough data yet"

### TASK-082: Positive Habits
**Agent roles:** backend, frontend, architect, retention
**Depends on:** Habits module, habit entity schema

**Backend:**
- Habit entity already has preparation for `habitType` field
- Add `habitType: 'AVOIDANCE' | 'ACHIEVEMENT'` to Habit entity (default 'AVOIDANCE')
- Achievement habits: sport, water, meditation, reading, walking
- Check-in for achievements: "Did it!" instead of "Avoided!"
- Stats for achievements: total completions, streak, etc.
- Achievement habits do NOT count toward calories/money saved
- They have their own metrics: duration (minutes), quantity (glasses, pages), distance (km)

**Frontend:**
- Habits page: toggle "Avoidance" / "Achievement" tabs
- Different UI for achievement habits:
  - Green check instead of red avoidance
  - "Did it!" button instead of "Avoided!"
  - Different emoji set (sport, water, book, etc.)
- Dashboard: separate section or combined streak view
- Stats: separate achievement stats section

**Risks:**
- This is a significant schema change — migration required
- Must not break existing avoidance logic
- LiveHero currently only shows avoidance metrics — decide: include achievements or keep separate?
- Recommendation: keep separate initially, add combined view later

## Estimated Effort: 14-18 hours
## Build verification: insights render, report cards animate, achievement habit CRUD works
