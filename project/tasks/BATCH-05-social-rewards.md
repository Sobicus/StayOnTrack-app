# Batch 5: Social Rewards + Extended Achievements

## Tasks
- TASK-040 — Invite rewards
- TASK-041 — Extended achievements

## Scope

### TASK-040: Invite Rewards
**Agent roles:** backend, frontend
**Depends on:** Friends module (COMPLETED), Streaks module (COMPLETED)

**Backend:**
- Add `inviteRewardClaimed: boolean` to `FriendRequest` entity (prevent double-claim)
- On friend request ACCEPT: grant 1 Streak Shield to both users
- Add `streakShields: number` field to User entity if not present (check current schema)
- Create `POST /friends/requests/:id/accept` side-effect: award shield + XP(+50)
- No limit on invite rewards (per DEC in ROADMAP)

**Frontend:**
- Show toast "You earned a Streak Shield!" on friend accept
- Show shield count on Settings/Profile page
- Add shield icon to streak display on dashboard

**Risks:**
- Verify Streak Shield logic in `streaks.service.ts` — currently shields replenish on Monday. Invited shields should be separate pool or additive.

### TASK-041: Extended Achievements
**Agent roles:** backend, frontend, retention
**Depends on:** Achievements module (COMPLETED), Friends (COMPLETED), Challenges (COMPLETED)

**Backend:**
- Add new achievement definitions to existing achievement system:
  - SOCIAL: `first_friend`, `five_friends`, `invite_champion` (10 friends)
  - CHALLENGES: `first_challenge`, `challenge_winner`, `five_challenges_won`
  - DISCIPLINE: `weekend_warrior` (7 weekend avoidances), `no_sugar_week`, `perfect_month`
- Extend achievement progress calculation in `achievements.service.ts`
- Add trigger points: friend accept → check social achievements, challenge complete → check challenge achievements

**Frontend:**
- Add new achievement cards to /achievements page (already exists)
- Add category tabs: ALL | SOLO | SOCIAL | CHALLENGES | DISCIPLINE
- Achievement unlock toast with animation

**Risks:**
- Achievement calculation should be lazy (on-demand) not eager (on every action) to avoid performance issues

## Estimated Effort: 4-6 hours
## Build verification: `npm run build` in api + web, run existing tests
