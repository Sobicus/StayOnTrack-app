# StayOnTrack — Контекст проекта для AI-ассистента

> Этот файл — точка входа для нового разговора. Прочти его первым.

---

## Что такое StayOnTrack

Трекер вредных и полезных привычек с геймификацией. Пользователь логирует привычки (не покупал кофе, не курил, ходил гулять), получает XP, уровни, достижения, соревнуется с друзьями в челленджах. Мотивация через визуализацию прогресса и социальный слой.

**Домен:** `stayontrack.day` | **Статус:** MVP готов, деплой на VPS ещё не выполнен

---

## Стек

| Слой | Технология |
|------|-----------|
| Backend | NestJS 10 + TypeORM + PostgreSQL 16 |
| Frontend | Next.js 14 (App Router) + Tailwind CSS |
| Monorepo | Turborepo + npm workspaces |
| Auth | JWT (access + refresh) + Google OAuth + Telegram Widget |
| Email | Resend (production) / console (dev) |
| Notifications | Web Push (VAPID) + Telegram Bot |
| i18n | next-intl, 7 языков (en/ru/uk/fr/de/es/pt) |
| Deploy | Docker Compose + Nginx + Let's Encrypt |
| CI | GitHub Actions (lint + type-check + tests + build) |

---

## Структура репозитория

```
StayOnTrackDev/
├── apps/
│   ├── api/          ← NestJS backend (порт 4800, /api/v1)
│   │   ├── Dockerfile
│   │   └── src/
│   │       ├── modules/   ← 13 модулей: auth, habits, stats, gamification...
│   │       └── migrations/
│   └── web/          ← Next.js frontend (порт 4801)
│       ├── Dockerfile
│       └── src/
│           ├── app/       ← 16 страниц (App Router)
│           ├── components/
│           └── messages/  ← i18n JSON-файлы
├── packages/
│   └── contracts/    ← Shared TypeScript типы/енамы/константы
├── nginx/
│   └── nginx.conf    ← Reverse proxy (продакшн, subdomain routing + HTTP→HTTPS)
├── scripts/
│   └── backup.sh     ← Cron-скрипт резервного копирования БД
├── docs/             ← ВСЯ ДОКУМЕНТАЦИЯ
│   ├── deployment/
│   │   └── INFRASTRUCTURE.md   ← Полный план деплоя на VPS ⬅ читай перед деплоем
│   ├── architecture/
│   │   ├── DECISIONS_LOG.md    ← Архитектурные решения DEC-001..DEC-017
│   │   ├── PROJECT_MAP.md      ← 67 API эндпойнтов, 16 страниц, 12 сущностей
│   │   ├── API_CONVENTIONS.md  ← REST-соглашения
│   │   ├── ARCHITECTURE_AUDIT.md
│   │   └── AGENT_SYSTEM.md
│   ├── project-status/
│   │   └── PROJECT_STATE.md    ← Текущий статус, что сделано, известные баги
│   ├── quick-start/
│   │   └── PROJECT_GUIDE.md    ← Быстрый старт для разработки
│   ├── roadmap/
│   │   └── ROADMAP.md          ← Планы v2+
│   └── tasks/
│       ├── INDEX.md            ← Каталог всех задач
│       ├── EXECUTION_QUEUE.md  ← Очередь задач
│       └── BATCH-05..11.md     ← История выполненных батчей
├── StayOnTrack_docs/ ← Продуктовые Word-документы (vision, PRD, UX concept)
├── docker-compose.yml       ← Dev: только PostgreSQL на порту 5450
├── docker-compose.prod.yml  ← Prod: api + web + db + nginx + certbot
├── .env.example             ← Шаблон для разработки
├── .env.production.example  ← Шаблон для VPS
└── CLAUDE.md                ← Этот файл
```

---

## Порты

| Сервис | Порт (dev) | Порт (prod / Docker internal) |
|--------|-----------|-------------------------------|
| PostgreSQL | 5450 (mapped) | 5432 (internal) |
| NestJS API | 4800 | 4800 (internal) |
| Next.js Web | 4801 | 4801 (internal) |
| Nginx | — | 80 + 443 (external) |

---

## Критические архитектурные решения

| ID | Решение | Почему важно |
|----|---------|-------------|
| **DEC-016** | LiveHero ring (`live-hero.tsx`) — ТОЛЬКО inline styles, никакого Tailwind для SVG/анимации | Tailwind конфликтовал с rotate/conic-gradient, сломал кольцо. Нарушение = кольцо ломается. |
| **DEC-017** | Timezone автоматически синхронизируется из браузера при каждом логине | Пользователи в разных часовых поясах, ручная настройка неудобна |
| **DB** | TypeORM `synchronize: false` + `migrationsRun: true` в production | В dev — auto-sync, в prod — миграции запускаются автоматически при старте контейнера |
| **Auth** | JWT: access 15 мин + refresh 7 дней. Ротация refresh токенов при каждом обновлении | После рестарта API все refresh-токены инвалидируются (известный баг, некритично для MVP) |
| **API prefix** | Все эндпойнты: `/api/v1/...` | Nginx роутит по субдомену api.stayontrack.day |

---

## Текущее состояние (апрель 2026)

- **Все фичи MVP реализованы** (батчи 1–11 + пост-MVP)
- **Ветки:** `dev` (рабочая) → `main` (стабильная)
- **Последние задачи:**
  - TASK-080 ✅ — Social sharing cards (achievements + challenges)
  - TASK-070 ✅ — Telegram Login Widget auth
  - TASK-090 ✅ — Daily target для позитивных привычек + habit-вкладка в LiveHero
- **Следующий шаг:** OPS-100 — деплой на VPS (см. `docs/deployment/INFRASTRUCTURE.md`)

### Известные проблемы (некритичные)
- JWT refresh-токены инвалидируются при рестарте API
- Frontend тесты: 0% покрытия

---

## Навигация по документам

| Что нужно | Куда идти |
|-----------|-----------|
| Развернуть на VPS | `docs/deployment/INFRASTRUCTURE.md` |
| Текущий статус / что сделано | `docs/project-status/PROJECT_STATE.md` |
| Все API эндпойнты | `docs/architecture/PROJECT_MAP.md` |
| Архитектурные решения | `docs/architecture/DECISIONS_LOG.md` |
| Задачи и беклог | `docs/tasks/INDEX.md` |
| Очередь задач | `docs/tasks/EXECUTION_QUEUE.md` |
| REST-соглашения | `docs/architecture/API_CONVENTIONS.md` |
| Продуктовое видение | `StayOnTrack_docs/Product Vision Document PRDstyle.docx` |

---

## Dev setup (локальная разработка)

```bash
# 1. Запустить PostgreSQL
npm run db:up

# 2. Скопировать и заполнить env
cp .env.example apps/api/.env
cp .env.example apps/web/.env.local

# 3. Запустить все сервисы
npm run dev
# API:  http://localhost:4800/api/v1
# Web:  http://localhost:4801
# Docs: http://localhost:4800/api/v1/docs (Swagger)

# Остановить БД
npm run db:down
```

---

## Как правильно начать новый разговор

1. Прочти `CLAUDE.md` (этот файл)
2. Прочти `docs/project-status/PROJECT_STATE.md` — текущий статус и известные проблемы
3. Прочти `docs/architecture/DECISIONS_LOG.md` — чтобы не нарушить критические решения
4. Спроси пользователя, что он хочет сделать
