# StayOnTrack — Project State

## Last Updated: 2026-03-13

## Current Phase: Phase 3 — Challenges + Social Rewards

## Active Focus
- TASK-030: Challenges backend (1-on-1, scalable for groups)
- TASK-031: Challenges frontend
- TASK-040: Invite rewards (shield on friend accept)
- TASK-041: Extended achievements (SOCIAL, CHALLENGES categories)

## Completed Phases
- ✅ Phase 0: Foundation (monorepo, skeletons, contracts, docs)
- ✅ Phase 1: Core Solo Experience (auth, habits, check-in, stats, streaks, achievements, i18n, onboarding, PWA)
- ✅ Phase 2: Basic Social (friends, privacy, leaderboard)
- ✅ Infrastructure: 24 unit tests, CI/CD (GitHub Actions), dark mode, mobile-first

## Key Decisions (recent)
- Challenges: start 1-on-1, but code via participants[] for future group scaling
- Invite shields: no limit (each accepted friend = +1 shield)
- Task order: Challenges → Auth upgrade → Settings → Telegram → Analytics

## Risks
- Solo developer — limited bandwidth
- No designer — UI depends on shadcn/ui + good implementation
- Gmail SMTP for email verification — may have sending limits

## Key Metrics to Track (when MVP launches)
- Daily check-in completion rate
- Week 1 retention
- Average check-in time (target: 3-5 seconds)
- Streak length distribution
- Habit creation rate
- Challenge participation rate
