# Batch 8: Telegram Integration

## Tasks
- TASK-070 — Telegram Bot
- TASK-071 — Push notifications
- TASK-072 — Telegram Mini App

## Scope

### TASK-070: Telegram Bot (Basic)
**Agent roles:** backend, architect
**Depends on:** Auth module, Stats module, Habits module

**Backend:**
- Install `telegraf` (Telegram Bot framework for Node.js)
- Create `telegram` module in API
- Add to User entity: `telegramChatId: string | null`, `telegramLinked: boolean`
- Bot commands:
  - `/start` — welcome message + link instructions
  - `/link <code>` — link Telegram account to web account (6-digit code from Settings)
  - `/stats` — today's saved calories, money, streak
  - `/checkin` — quick inline keyboard to mark habits as avoided
  - `/streak` — current streak info
- Generate link code: `POST /users/me/telegram-code` — returns 6-digit code valid 10 min
- Verify link: bot sends code to API, API matches userId

**Frontend:**
- Settings page: "Link Telegram" section with generated code
- Show linked status with Telegram username
- "Unlink" button

**Risks:**
- Need BotFather token (TELEGRAM_BOT_TOKEN env var)
- Webhook vs polling: use polling in dev, webhook in prod
- Bot must run in same process or separate worker

### TASK-071: Push Notifications (Web Push + Telegram)
**Agent roles:** backend, frontend
**Depends on:** TASK-070, Notifications module (COMPLETED)

**Backend:**
- Install `web-push` library
- Add to User entity: `pushSubscription: jsonb | null`
- `POST /notifications/subscribe` — store push subscription
- `POST /notifications/unsubscribe` — remove subscription
- Extend existing notification triggers:
  - Daily reminder → send Web Push + Telegram message
  - Streak at risk → send Web Push + Telegram message
  - Challenge invite → send Web Push
  - Friend request → send Web Push
- VAPID keys generation and storage in env

**Frontend:**
- Service Worker push event handler (already have SW from PWA)
- Permission request prompt (non-intrusive, after first check-in)
- Notification settings: Web Push toggle, Telegram toggle (per notification type)
- Handle notification clicks → navigate to relevant page

**Risks:**
- Push notifications require HTTPS in production
- Safari/iOS has limited Web Push support (iOS 16.4+)
- User can deny permissions — graceful fallback

### TASK-072: Telegram Mini App
**Agent roles:** frontend, architect
**Depends on:** TASK-070 (bot must exist)

**Implementation:**
- Telegram Mini App uses web frontend inside Telegram WebView
- Detect Telegram WebView via `window.Telegram.WebApp`
- Auth: use Telegram `initData` to authenticate (hash validation on backend)
- New backend endpoint: `POST /auth/telegram` — validate initData, return JWT
- Adapt UI:
  - Hide top navbar (Telegram has its own)
  - Use Telegram theme colors (`var(--tg-theme-bg-color)`, etc.)
  - Use Telegram's back button, main button, haptic feedback
- Register Mini App in BotFather (set web_app URL)

**Risks:**
- Mini App must be served over HTTPS (production domain required)
- Cannot test fully in localhost — use ngrok for dev testing
- Telegram WebView has limited API support (no Web Push, limited storage)
- Must detect and handle both standalone PWA and Telegram Mini App contexts

## Estimated Effort: 12-16 hours
## Build verification: bot responds to /start, push notification received, Mini App opens
## Prerequisites: TELEGRAM_BOT_TOKEN, VAPID keys, HTTPS domain
