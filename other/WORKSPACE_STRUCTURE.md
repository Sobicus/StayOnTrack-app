# StayOnTrack Workspace Structure / Структура workspace StayOnTrack

## Purpose / Назначение
EN:
This file is the quick map of the repository layout. Use it when you need to understand where the real backend, frontend, shared packages, skills, and project docs live after the monorepo normalization.

RU:
Этот файл - быстрая карта структуры репозитория. Используй его, когда нужно быстро понять, где после monorepo-нормализации лежат реальные backend, frontend, shared package, skills и проектная документация.

## Current Layout / Текущая структура
EN:
```text
G:\StayOnTrack
|-- apps
|   |-- api
|   |-- web
|   `-- mobile
|-- packages
|   `-- contracts
|-- docs
|   |-- auth
|   |-- ops
|   |-- logs
|   |-- stats
|   `-- strategy
|       |-- planning
|       `-- source-notes
|-- tasks
|-- .codex
|   `-- skills
|-- .github
|-- AGENTS.md
|-- PROJECT_GUIDE.md
|-- PROJECT_STATE.md
|-- DELIVERY_WORKFLOW.md
|-- DECISIONS_LOG.md
|-- ROADMAP.md
`-- REPOSITORY_WORKFLOW.md
```

RU:
```text
G:\StayOnTrack
|-- apps
|   |-- api
|   |-- web
|   `-- mobile
|-- packages
|   `-- contracts
|-- docs
|   |-- auth
|   |-- ops
|   |-- logs
|   |-- stats
|   `-- strategy
|       |-- planning
|       `-- source-notes
|-- tasks
|-- .codex
|   `-- skills
|-- .github
|-- AGENTS.md
|-- PROJECT_GUIDE.md
|-- PROJECT_STATE.md
|-- DELIVERY_WORKFLOW.md
|-- DECISIONS_LOG.md
|-- ROADMAP.md
`-- REPOSITORY_WORKFLOW.md
```

## Real App Roots / Реальные корни приложений
EN:
- Backend application: `apps/api`
- Frontend web application: `apps/web`
- Future mobile application placeholder: `apps/mobile`
- Future shared API/DTO contract home: `packages/contracts`

RU:
- Backend-приложение: `apps/api`
- Frontend web-приложение: `apps/web`
- Placeholder для будущего mobile-приложения: `apps/mobile`
- Будущий дом для общих API/DTO-контрактов: `packages/contracts`

## What Lives Where / Что где лежит
EN:
- `apps/api`: NestJS backend, TypeORM migrations, backend tests, backend README, backend rules, local Docker Compose
- `apps/web`: Next.js frontend, frontend tests, frontend README, frontend rules
- `apps/mobile`: reserved folder for a future real mobile app
- `packages/contracts`: reserved place for shared contracts when duplication between apps becomes real
- `docs`: detailed domain maps like flow, endpoint map, implementation map, and operator docs such as local port allocation, first-time setup, daily operator checklist, and dependency triage
- `docs/strategy`: future-facing reference material that can inform planning without overriding approved current architecture
- `docs/strategy/planning`: structured planning workspace for backlog waves, guardrails, source matrix, and future task promotion
- `docs/strategy/source-notes`: extracted text from external planning documents for repo-local analysis
- `tasks`: task records, backlog, and delivery evidence
- `.codex/skills`: active project-local role playbooks such as backend, frontend, QA, retention, and dormant mobile guidance

RU:
- `apps/api`: NestJS-бэкенд, TypeORM-миграции, backend-тесты, backend README, backend rules, локальный Docker Compose
- `apps/web`: Next.js-фронтенд, frontend-тесты, frontend README, frontend rules
- `apps/mobile`: зарезервированная папка для будущего реального mobile-приложения
- `packages/contracts`: зарезервированное место для общих контрактов, когда между приложениями появится реальное дублирование
- `docs`: детальные карты доменов, такие как flow, endpoint map, implementation map и operator-docs вроде локального распределения портов, первого запуска, ежедневного operator-checklist и dependency-triage
- `docs/strategy`: future-facing reference-материалы, которые помогают планированию, но не переопределяют утвержденную текущую архитектуру
- `docs/strategy/planning`: структурированный planning-workspace для backlog-wave, guardrails, source-matrix и будущего продвижения задач
- `docs/strategy/source-notes`: извлеченный текст из внешних planning-документов для repo-local анализа
- `tasks`: task-записи, backlog и доказательства delivery
- `.codex/skills`: активные project-local role playbook, такие как backend, frontend, QA, retention и dormant mobile-guidance

## Common Confusion Notes / Частые точки путаницы
EN:
- The old root-level folders `backendStayOnTrack` and `frontendStayOnTrack` are no longer the real app locations.
- If you need to run backend commands, start from `apps/api`.
- If you need to run frontend commands, start from `apps/web`.
- CI is also aligned to `apps/api/**`, `apps/web/**`, and shared `packages/contracts/**` paths.
- Future-facing ideas may exist under `docs/strategy/*`, but they are reference-only until approved in the project guide or decisions log.

RU:
- Старые корневые папки `backendStayOnTrack` и `frontendStayOnTrack` больше не являются реальными расположениями приложений.
- Если нужно запускать backend-команды, стартуй из `apps/api`.
- Если нужно запускать frontend-команды, стартуй из `apps/web`.
- CI тоже выровнен под пути `apps/api/**`, `apps/web/**` и общий `packages/contracts/**`.
- Future-facing идеи могут лежать в `docs/strategy/*`, но остаются reference-only, пока их не утвердят project guide или decisions log.

## Local Service Map / Карта локальных сервисов
EN:
- Web: `http://localhost:4601`
- API: `http://localhost:4600/api/v1`
- Swagger: `http://localhost:4600/api/v1/docs`
- PostgreSQL: `localhost:5440`
- Reserved future RabbitMQ: AMQP `5674`, management `15682`

RU:
- Web: `http://localhost:4601`
- API: `http://localhost:4600/api/v1`
- Swagger: `http://localhost:4600/api/v1/docs`
- PostgreSQL: `localhost:5440`
- Зарезервированный будущий RabbitMQ: AMQP `5674`, management `15682`

## Quick Start / Быстрый старт
EN:
- Backend: `npm run dev:api` from repo root or `cd apps/api` (local default `http://localhost:4600/api/v1`)
- Frontend: `npm run dev:web` from repo root or `cd apps/web` (local default `http://localhost:4601`)
- Project docs and guides: stay in the repo root plus `docs/*` and `tasks/*`

RU:
- Бэкенд: `npm run dev:api` из корня repo или `cd apps/api` (локальный default `http://localhost:4600/api/v1`)
- Фронтенд: `npm run dev:web` из корня repo или `cd apps/web` (локальный default `http://localhost:4601`)
- Проектные docs и guide-файлы остаются в корне repo плюс в `docs/*` и `tasks/*`

## Local Startup Note / Заметка о локальном запуске
EN:
- After the monorepo normalization, prefer the repo-root scripts for normal local startup.
- The web dev script intentionally uses webpack-backed `next dev` because the default Turbopack path reproduced repeated `/auth/login` reloads and `Next.js package not found` panics in the current Windows setup.

RU:
- После monorepo-нормализации для обычного локального старта нужно предпочитать repo-root scripts.
- Web dev-скрипт намеренно использует webpack-backed `next dev`, потому что дефолтный Turbopack-путь воспроизводил повторные reload на `/auth/login` и panic `Next.js package not found` в текущей Windows-конфигурации.

## Package Manager Note / Заметка о package manager
EN:
- The normalized repo layout does not currently use root npm workspaces for installs.
- `apps/api/package-lock.json` and `apps/web/package-lock.json` remain the authoritative lockfiles for CI and app-level installs.
- Re-introduce root npm workspaces only when shared packages are actually consumed and the install strategy is intentionally migrated.

RU:
- Нормализованная структура repo сейчас не использует root npm workspaces для установки зависимостей.
- `apps/api/package-lock.json` и `apps/web/package-lock.json` остаются authoritative lockfile для CI и app-level install.
- Возвращать root npm workspaces нужно только тогда, когда shared package действительно начнут потребляться и install-strategy будет осознанно мигрирована.








