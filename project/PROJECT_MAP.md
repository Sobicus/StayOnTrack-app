# StayOnTrack — Полная карта проекта

> Обновлено: 2026-03-28 | Commit: `fd23c2b` | Branch: dev

---

## 1. АРХИТЕКТУРА

```
G:\StayOnTrackDev\
├── apps/
│   ├── api/          — NestJS backend (localhost:4800, prefix /api/v1)
│   └── web/          — Next.js 14 frontend (localhost:4801)
├── packages/
│   └── contracts/    — Shared types, enums, constants, formulas
├── project/          — Documentation (ROADMAP, STATE, DECISIONS, TASKS)
├── nginx/            — Reverse proxy config
├── scripts/          — Backup scripts
├── docker-compose.yml      — Dev (PostgreSQL on port 5450)
└── docker-compose.prod.yml — Production (API + Web + DB + Nginx)
```

---

## 2. API ENDPOINTS (67 total)

### AUTH (12 endpoints)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/register` | No | Регистрация (email, password 8+, username) |
| POST | `/auth/login` | No | Вход (email, password) → tokens |
| POST | `/auth/refresh` | No | Обновление токенов (refreshToken) |
| POST | `/auth/logout` | JWT | Выход (204) |
| POST | `/auth/forgot-password` | No | Запрос сброса пароля (1/5мин) |
| POST | `/auth/reset-password` | No | Сброс пароля (JWT token) |
| POST | `/auth/verify-email` | JWT | Подтверждение email (6-digit code) |
| POST | `/auth/resend-verification` | JWT | Повторная отправка кода (1/мин) |
| POST | `/auth/telegram` | No | Авторизация через Telegram initData |
| GET | `/auth/google` | Passport | Redirect на Google OAuth |
| GET | `/auth/google/callback` | Passport | Callback → redirect с токенами |
| GET | `/auth/me` | JWT | Текущий профиль пользователя |

### USERS (6 endpoints)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/users/me` | JWT | Профиль пользователя |
| PATCH | `/users/me` | JWT | Обновление настроек |
| GET | `/users/me/export` | JWT | GDPR экспорт данных |
| POST | `/users/me/telegram-code` | JWT | Генерация кода привязки Telegram |
| DELETE | `/users/me/telegram` | JWT | Отвязка Telegram |
| DELETE | `/users/me` | JWT | Удаление аккаунта |

### HABITS (7 endpoints)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/habits/templates` | No | Каталог шаблонов (24 шт) |
| POST | `/habits` | JWT | Создание привычки |
| GET | `/habits` | JWT | Список привычек |
| GET | `/habits/:id` | JWT | Одна привычка |
| PATCH | `/habits/:id` | JWT | Обновление |
| DELETE | `/habits/:id` | JWT | Удаление |
| PATCH | `/habits/reorder/bulk` | JWT | Сортировка |

### HABIT-LOGS (7 endpoints)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/habit-logs` | JWT | Чек-ин (AVOIDED/PARTIAL/CONSUMED) |
| POST | `/habit-logs/batch` | JWT | Пакетный чек-ин |
| GET | `/habit-logs/frequency-status` | JWT | Статус частоты |
| GET | `/habit-logs/day` | JWT | Сводка дня (по timezone) |
| GET | `/habit-logs/range` | JWT | Логи за диапазон дат |
| GET | `/habit-logs/habit/:habitId` | JWT | Логи привычки |
| DELETE | `/habit-logs/:id` | JWT | Отмена чек-ина |

### STATS (8 endpoints)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/stats` | JWT | Общая статистика |
| GET | `/stats/equivalents` | JWT | Эквиваленты усилий (бег, ходьба) |
| GET | `/stats/live` | JWT | Live-счётчик для dashboard |
| GET | `/stats/trends` | JWT | Тренды по неделям (LineChart) |
| GET | `/stats/range` | JWT | Статистика за период |
| GET | `/stats/patterns` | JWT | Анализ паттернов (день недели, категории) |
| GET | `/stats/insights` | JWT | Текстовые инсайты |
| GET | `/stats/report` | JWT | Месячный/годовой отчёт (Wrapped) |

### STREAKS (2 endpoints)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/streaks` | JWT | Текущий streak, best, shields |
| POST | `/streaks/recover` | JWT | Восстановление streak (200 XP) |

### ACHIEVEMENTS (1 endpoint)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/achievements` | JWT | 40 достижений, 7 категорий |

### GAMIFICATION (3 endpoints)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/gamification/level` | JWT | Уровень, XP, прогресс |
| GET | `/gamification/quests` | JWT | 3 дневных квеста |
| POST | `/gamification/quests/check` | JWT | Проверка квестов |

### CHALLENGES (10 endpoints)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/challenges` | JWT | Создание (1v1/group) |
| GET | `/challenges` | JWT | Мои челленджи |
| POST | `/challenges/join` | JWT | Вступить по invite code |
| GET | `/challenges/browse` | JWT | Публичные челленджи |
| GET | `/challenges/invitations` | JWT | Приглашения |
| GET | `/challenges/:id` | JWT | Детали + leaderboard |
| PATCH | `/challenges/:id/accept` | JWT | Принять |
| PATCH | `/challenges/:id/decline` | JWT | Отклонить |
| PATCH | `/challenges/:id/cancel` | JWT | Отменить (создатель) |
| POST | `/challenges/:id/invite` | JWT | Пригласить юзеров |

### FRIENDS (8 endpoints)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/friends/requests` | JWT | Отправить запрос (по username) |
| GET | `/friends/requests/incoming` | JWT | Входящие запросы |
| GET | `/friends/requests/outgoing` | JWT | Исходящие запросы |
| PATCH | `/friends/requests/:id/accept` | JWT | Принять (+shield +50XP обоим) |
| PATCH | `/friends/requests/:id/decline` | JWT | Отклонить |
| GET | `/friends` | JWT | Список друзей |
| DELETE | `/friends/:friendId` | JWT | Удалить друга |
| GET | `/friends/leaderboard` | JWT | Таблица лидеров |

### NOTIFICATIONS (4 endpoints)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/notifications/send-daily-reminders` | JWT | Триггер напоминаний |
| POST | `/notifications/send-weekly-digest` | JWT | Триггер дайджеста |
| POST | `/notifications/subscribe` | JWT | Подписка на Web Push |
| POST | `/notifications/unsubscribe` | JWT | Отписка от Web Push |

### ANALYTICS (4 endpoints)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/analytics/retention` | JWT | Retention когорты |
| GET | `/analytics/dau` | JWT | DAU (30 дней) |
| GET | `/analytics/funnel` | JWT | Воронка |
| GET | `/analytics/events/:type` | JWT | События по типу |

### HEALTH (1 endpoint)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | No | Статус API + DB |

---

## 3. FRONTEND PAGES (16 страниц)

| Route | Описание | API вызовы |
|-------|----------|------------|
| `/` | Landing → redirect если авторизован | — |
| `/auth/login` | Вход + Google OAuth кнопка | auth.login |
| `/auth/register` | Регистрация + Google OAuth | auth.register |
| `/auth/verify-email` | 6-digit код верификации | auth.verifyEmail, auth.resendVerification |
| `/auth/forgot-password` | Сброс пароля | auth.forgotPassword |
| `/auth/reset-password` | Новый пароль | auth.resetPassword |
| `/auth/google/callback` | OAuth callback → сохранение токенов | — |
| `/dashboard` | LiveHero ring, streak, quests, stats | stats, streaks, habitLogs, gamification |
| `/habits` | Список + каталог + чек-ин | habits, habitLogs, templates |
| `/stats` | Графики, heatmap, insights | stats, trends, patterns, insights |
| `/stats/report` | Monthly Wrapped (5 карточек) | stats.report |
| `/friends` | Друзья + запросы + leaderboard | friends |
| `/challenges` | Челленджи + create + browse | challenges, habits |
| `/challenges/[id]` | Детали + leaderboard + invite | challenges |
| `/achievements` | 40 достижений, 7 категорий + табы | achievements |
| `/settings` | Профиль, настройки, Telegram, Google | users, gamification |

---

## 4. DATABASE ENTITIES (12 таблиц)

### users (36 колонок)
Основная: id, email (unique), passwordHash, username (unique), avatarUrl, googleId
Настройки: timezone, currency, unitSystem, weekStartDay, locale, dayEndHour, monthlySavingsGoal
Геймификация: totalXp, streakShieldsRemaining, lastShieldReplenishDate
Auth: refreshTokenHash, passwordResetTokenHash, passwordResetExpires, emailVerified, emailVerificationCode
Telegram: telegramChatId, telegramLinked, telegramLinkCode, telegramLinkCodeExpiresAt
Push: pushSubscription (jsonb)
Прочее: weightKg, heightCm, goal, visibility, onboardingCompleted, emailReminders, reminderHour

### habits (15 колонок)
userId (FK→users, INDEX), title, emoji, category, habitType (AVOIDANCE|ACHIEVEMENT), targetUnit, caloriesPerOccurrence, pricePerOccurrence, frequencyType, occurrencesPerWeek, isActive, sortOrder

### habit_logs (10 колонок)
habitId (FK→habits, INDEX), userId (FK→users), date, status (AVOIDED|PARTIAL|CONSUMED), portionRatio, savedCalories, savedMoney, completedAmount
UNIQUE(habitId, date), INDEX(userId, date)

### friend_requests (6 колонок)
fromUserId, toUserId, status (PENDING|ACCEPTED|DECLINED), inviteRewardClaimed
UNIQUE(fromUserId, toUserId), INDEX(toUserId, status)

### friendships (4 колонки)
userId, friendId — двунаправленная (A→B + B→A)
UNIQUE(userId, friendId), INDEX(friendId, userId)

### challenges (15 колонок)
creatorUserId, title, description, type, targetValue, habitId, startDate, endDate, status, winnerId, maxParticipants, inviteCode (unique), visibility
INDEX(creatorUserId), INDEX(status, visibility)

### challenge_participants (5 колонок)
challengeId, userId, status, currentValue
UNIQUE(challengeId, userId)

### quests (7 колонок)
userId, questType, date, completed, completedAt, xpReward
UNIQUE(userId, questType, date), INDEX(userId, date)

### habit_templates (8 колонок) — справочник
nameEn, nameRu, defaultCalories, defaultMoney, emoji, category, sortOrder
24 шаблона, 7 категорий

### activities (9 колонок) — справочник
slug (unique), name, category, unit, met, caloriesPerUnitBase, baseWeightKg

### audit_logs (5 колонок) — логирование
userId, action, metadata (jsonb), ipAddress

### analytics_events (4 колонки) — аналитика
userId, eventType, eventData (jsonb)
INDEX(eventType, createdAt), INDEX(userId, eventType)

---

## 5. SHARED CONTRACTS (packages/contracts)

### Enums
ProfileVisibility, HabitCategory, HabitFrequencyType, HabitLogStatus, HabitType, ActivityCategory, ActivityUnit, FriendRequestStatus, ChallengeType, ChallengeStatus, ChallengeParticipantStatus, ChallengeVisibility, Locale

### Constants
- XP_REWARDS: CHECK_IN=10, FULL_DAY_AVOIDED=25, QUEST_COMPLETE=50, STREAK_MILESTONE=100, INVITE_ACCEPT=50
- STREAK_RECOVERY_XP_COST=200, STREAK_SHIELDS_PER_WEEK=1
- LEVEL_THRESHOLDS: 17 уровней (0–50000 XP)
- CURRENCIES: EUR, USD, GBP, PLN, UAH, RUB
- CURRENCY_SYMBOLS: €, $, £, zł, ₴, ₽

### Formulas
- getSavedCalories(cal, portionRatio)
- getPotentialWeightAvoided(totalCal) = totalCal / 7700
- getCaloriesPerMinute(met, weightKg) = (MET * 3.5 * weight) / 200

---

## 6. FRONTEND COMPONENTS (20 шт)

### Dashboard
- `live-hero.tsx` — Animated neon ring (INLINE styles only! DEC-016)
- `animated-counter.tsx` — Count-up анимация

### Gamification
- `xp-progress-bar.tsx` — XP прогресс бар
- `level-badge.tsx` — Бейдж уровня
- `daily-quests.tsx` — 3 дневных квеста
- `streak-recovery.tsx` — Восстановление streak

### Habits
- `habit-catalog.tsx` — Каталог шаблонов с фильтрами
- `habit-sparkline.tsx` — 7-точечный мини-график

### Settings
- `theme-selector.tsx` — Акцентные цвета (unlock по уровню)

### Common
- `error-boundary.tsx` — React error boundary
- `skeleton.tsx` — Loading скелетоны
- `empty-state.tsx` — Пустое состояние

### PWA
- `sw-register.tsx` — Service Worker
- `push-permission.tsx` — Запрос push-разрешения

### Layout
- `app-shell.tsx` — Header + bottom nav + auth redirect

---

## 7. ENV ПЕРЕМЕННЫЕ

### Обязательные
```
DB_HOST, DB_PORT, DB_USER, DB_PASS, DB_NAME
JWT_SECRET, JWT_REFRESH_SECRET
```

### Email (Gmail SMTP)
```
GMAIL_USER, GMAIL_APP_PASSWORD
```

### Google OAuth
```
GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL
```

### Telegram
```
TELEGRAM_BOT_TOKEN
```

### Web Push
```
VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_EMAIL
NEXT_PUBLIC_VAPID_PUBLIC_KEY (frontend)
```

### Прочие
```
CORS_ORIGIN, NODE_ENV, PORT
NEXT_PUBLIC_API_URL (frontend)
```

---

## 8. ТЕСТЫ

- **Unit tests**: 155 тестов, 10 test suites (auth, habits, habit-logs, stats, streaks, achievements, challenges, friends, gamification, notifications)
- **E2E tests**: 7 файлов (auth, habits, gamification, checkin, stats, friends, streaks)
- **Frontend tests**: 0 (не реализованы)
- **CI**: GitHub Actions — lint + API tests + web build

---

## 9. КЛЮЧЕВЫЕ РЕШЕНИЯ

- **DEC-016**: LiveHero ring — 100% inline styles, НИКОГДА CSS classes
- **DEC-017**: Timezone — IANA строка, авто-синхронизация из браузера
- **Password Reset**: JWT-based O(1) lookup вместо O(n) bcrypt
- **Email**: Gmail SMTP через Nodemailer (не Resend)
- **Achievements**: Динамический расчёт из stats (без БД таблицы)
- **CI**: Всегда собирать contracts ПЕРЕД тестами API
