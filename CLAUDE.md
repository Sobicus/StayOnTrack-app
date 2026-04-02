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
│   └── nginx.conf    ← Reverse proxy (продакшн), требует обновления для SSL
├── scripts/
│   └── backup.sh     ← Cron-скрипт резервного копирования БД
├── project/          ← ВСЯ ДОКУМЕНТАЦИЯ (читай сюда)
│   ├── INFRASTRUCTURE.md  ← Полный план деплоя на VPS (читай перед деплоем!)
│   ├── PROJECT_STATE.md   ← Текущий статус, известные баги
│   ├── PROJECT_MAP.md     ← 67 API эндпойнтов, 16 страниц, 12 сущностей
│   ├── PROJECT_GUIDE.md   ← Быстрый старт для разработки
│   ├── DECISIONS_LOG.md   ← Архитектурные решения (DEC-001..DEC-017)
│   ├── API_CONVENTIONS.md ← REST-соглашения
│   ├── ROADMAP.md         ← Планы v2+
│   └── tasks/             ← Задачи: INDEX.md, EXECUTION_QUEUE.md, BATCH-05..11
├── StayOnTrack_docs/ ← Продуктовые Word-документы (vision, PRD, UX concept)
├── other/            ← Устаревшие доки первой итерации (можно архивировать)
├── docker-compose.yml       ← Dev: только PostgreSQL на порту 5450
├── docker-compose.prod.yml  ← Prod: api + web + db + nginx + certbot
├── .env.example             ← Шаблон для разработки
├── .env.production.example  ← Шаблон для VPS (ВНИМАНИЕ: нужно обновить домен!)
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
| **API prefix** | Все эндпойнты: `/api/v1/...` | Nginx роутит `/api/` → контейнер api |

---

## Текущее состояние (апрель 2026)

- **Все фичи MVP реализованы** (батчи 1–11 + пост-MVP)
- **Ветки:** `dev` (рабочая) → `main` (стабильная)
- **Последние задачи:**
  - TASK-080 ✅ — Social sharing cards (achievements + challenges)
  - TASK-070 ✅ — Telegram Login Widget auth
  - TASK-090 ✅ — Daily target для позитивных привычек + habit-вкладка в LiveHero
- **Следующий шаг:** OPS-100 — деплой на VPS (см. `project/INFRASTRUCTURE.md`)

### Известные проблемы (некритичные)
- JWT refresh-токены инвалидируются при рестарте API
- Frontend тесты: 0% покрытия
- `behavior-change.txt` в корне — личные заметки, не нужны в репо

---

## Навигация по документам

| Что нужно | Куда идти |
|-----------|-----------|
| Развернуть на VPS | `project/INFRASTRUCTURE.md` |
| Текущий статус / что сделано | `project/PROJECT_STATE.md` |
| Все API эндпойнты | `project/PROJECT_MAP.md` |
| Архитектурные решения | `project/DECISIONS_LOG.md` |
| Задачи и беклог | `project/tasks/INDEX.md` |
| Очередь задач | `project/tasks/EXECUTION_QUEUE.md` |
| REST-соглашения | `project/API_CONVENTIONS.md` |
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
2. Прочти `project/PROJECT_STATE.md` — текущий статус и известные проблемы
3. Прочти `project/DECISIONS_LOG.md` — чтобы не нарушить критические решения
4. Спроси пользователя, что он хочет сделать

---

## Структура папок — что куда

| Папка | Назначение | Статус |
|-------|-----------|--------|
| `apps/` | Исходный код (API + Web) | Активная разработка |
| `packages/contracts/` | Shared типы | Активная разработка |
| `project/` | Вся документация | Актуально |
| `nginx/` | Nginx конфиг для прода | Нужно обновить для SSL |
| `scripts/` | Утилиты для прода | Готово |
| `StayOnTrack_docs/` | Продуктовые Word-доки | Архив/справка |
| `other/` | Старые доки (устарели) | Можно удалить |
