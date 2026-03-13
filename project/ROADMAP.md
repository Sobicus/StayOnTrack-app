# StayOnTrack — Roadmap

## Phase 0: Foundation ✅ IN PROGRESS
- [x] Product analysis and decision-making
- [ ] Monorepo setup (Turborepo + npm workspaces)
- [ ] Docker (PostgreSQL)
- [ ] NestJS backend skeleton
- [ ] Next.js frontend skeleton
- [ ] Shared contracts package
- [ ] Agent system and task tracking
- [ ] First working "hello world" — both apps running

## Phase 1: Core Solo Experience (MVP)
### 1.1 Auth
- Registration (email + password)
- Login (JWT)
- Profile (username, avatar, weight, goal, locale)
- Password reset (later — Gmail SMTP)

### 1.2 Habits
- Create habit (title, category, calories, price, frequency, portion)
- Edit habit
- Delete / archive habit
- Habit list with status
- Pre-populated habit catalog (popular items with known calories/prices)

### 1.3 Daily Check-in
- Mark each active habit: avoided / partial / consumed
- Partial: select portion ratio (25%, 50%, 75%)
- Instant reward screen with animation
- 3-5 second completion target

### 1.4 Stats & Equivalents
- Today summary (saved calories, money, weight equivalent)
- Effort equivalents (3-5 most relevant activities)
- Weekly summary
- Monthly summary
- All-time stats
- Progress chart (daily bars)

### 1.5 Streak
- Current streak counter
- Best streak record
- Streak Shield (1 per week)
- Shield status indicator

### 1.6 UI Polish
- Dark mode (both themes)
- i18n (EN + RU)
- Mobile-first responsive
- Micro-animations on check-in rewards
- Onboarding flow (first habit creation)

## Phase 2: Basic Social
### 2.1 Friends
- Search by username
- Send/accept/decline friend request
- Friends list
- View friend's public progress

### 2.2 Privacy
- Profile visibility: private / friends / public
- Granular privacy flags (show/hide: streak, calories, money, habits, challenges)

### 2.3 Friend Leaderboard
- Leaderboard among friends (calories saved, streak, money saved)
- Weekly/monthly periods

## Phase 3: Challenges
### 3.1 Direct Challenges
- Create challenge (type, duration, target)
- Invite friend
- Accept/decline
- Progress tracking
- Winner determination

### 3.2 Challenge Types
- Habit-specific (no chocolate for 7 days)
- Calories-based (save most calories in 2 weeks)
- Streak-based (longest streak wins)
- Money-based (save most money)

## Phase 4: Future (post-MVP)
- Group challenges
- Accountability circles / communities
- Global leaderboard
- Achievement badges system
- Discipline Score (0-100)
- AI Coach (pattern analysis, relapse prediction)
- Push notifications
- Annual Reality Report (Spotify Wrapped style)
- Future Reality Simulator
- Habit Heatmap (GitHub style)
- Positive habits (habitType: 'achievement')
- Telegram Mini App
- React Native mobile app
- Advanced monetization (Premium analytics, Premium social, Guided programs)
