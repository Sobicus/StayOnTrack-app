# StayOnTrack Agents / Агенты StayOnTrack

## Project Context / Контекст проекта
EN:
This repository contains the StayOnTrack product workspace. The main shared sources of truth are:
- `PROJECT_GUIDE.md` for product essence, architecture, API contracts, and shared engineering rules.
- `DELIVERY_WORKFLOW.md` for cross-role sequencing and handoff gates.
- `tasks/TASK_TEMPLATE.md` for delivery tracking and handoff notes.
- `apps/web/FRONTEND_RULES.md` for frontend-specific rules.
- `apps/api/BACKEND_RULES.md` for backend-specific rules.
- `WORKSPACE_STRUCTURE.md` for the quick repository layout map and actual app roots.
- `docs/*` for stabilized domain maps and `docs/strategy/*` for future-facing reference material.

RU:
Этот репозиторий содержит рабочее пространство продукта StayOnTrack. Основные общие источники истины:
- `PROJECT_GUIDE.md` для сути продукта, архитектуры, API-контрактов и общих инженерных правил.
- `DELIVERY_WORKFLOW.md` для последовательности ролей и контрольных точек передачи.
- `tasks/TASK_TEMPLATE.md` для трекинга delivery и handoff-заметок.
- `apps/web/FRONTEND_RULES.md` для правил фронтенда.
- `apps/api/BACKEND_RULES.md` для правил бэкенда.
- `WORKSPACE_STRUCTURE.md` для быстрой карты структуры репозитория и фактических корней приложений.
- `docs/*` для карт стабилизированных доменов и `docs/strategy/*` для future-facing reference-материалов.

## Skills / Навыки
### Available skills
- `stayontrack-analyst`: Turn raw ideas, vague requests, and incomplete feature thoughts into structured feature definitions, acceptance criteria, assumptions, and scoped task inputs. (file: G:/StayOnTrack/.codex/skills/stayontrack-analyst/SKILL.md)
- `stayontrack-core`: Shared architecture, contracts, documentation, architecture review, anti-duplication checks, and project-wide engineering guardrails. (file: G:/StayOnTrack/.codex/skills/stayontrack-core/SKILL.md)
- `stayontrack-orchestrator`: Delivery orchestration across analyst, backend, frontend, design, QA, DevOps, retention, and future mobile work. (file: G:/StayOnTrack/.codex/skills/stayontrack-orchestrator/SKILL.md)
- `stayontrack-backend`: NestJS, TypeORM, PostgreSQL, auth, DTOs, services, migrations, and backend business logic. (file: G:/StayOnTrack/.codex/skills/stayontrack-backend/SKILL.md)
- `stayontrack-frontend`: Next.js/React UI, forms, client integration, state, and frontend delivery rules. (file: G:/StayOnTrack/.codex/skills/stayontrack-frontend/SKILL.md)
- `stayontrack-design`: UX/product design handoff for flows, states, copy, responsiveness, and implementation-ready UI behavior. (file: G:/StayOnTrack/.codex/skills/stayontrack-design/SKILL.md)
- `stayontrack-qa`: Review, test strategy, regression analysis, acceptance checks, and E2E validation. (file: G:/StayOnTrack/.codex/skills/stayontrack-qa/SKILL.md)
- `stayontrack-devops`: CI/CD, Docker, environments, secrets, deployment safety, observability, and rollback planning. (file: G:/StayOnTrack/.codex/skills/stayontrack-devops/SKILL.md)
- `stayontrack-retention`: retention, onboarding, motivational framing, notification strategy, and anti-dark-pattern product guidance. (file: G:/StayOnTrack/.codex/skills/stayontrack-retention/SKILL.md)
- `stayontrack-mobile`: future mobile delivery guidance for Expo/React Native flows once `apps/mobile` becomes real implementation work. (file: G:/StayOnTrack/.codex/skills/stayontrack-mobile/SKILL.md)

## Skill Trigger Rules / Правила активации навыков
EN:
- Skills in this project act as role playbooks, not autonomous background workers.
- Use `stayontrack-analyst` when the input is raw, ambiguous, missing structure, or sounds like product thinking rather than an implementation task.
- Use `stayontrack-core` for any non-trivial StayOnTrack work and for architecture review, duplication control, simplicity checks, dead code concerns, and module-boundary enforcement.
- Use `stayontrack-orchestrator` when a task spans multiple roles, needs sequencing, needs to be normalized into the task template, or requires a delivery owner.
- Use `stayontrack-backend` for NestJS, TypeORM, PostgreSQL, DTO, auth, migrations, API, stats, or business-logic work.
- Use `stayontrack-frontend` for screens, forms, client state, API consumption, accessibility, and frontend implementation.
- Use `stayontrack-design` when UX, interaction states, validation behavior, copy, layout, or responsive behavior must be defined before frontend work.
- Use `stayontrack-qa` for reviews, bug hunts, missing tests, regression risk, acceptance checks, or cross-stack validation.
- Use `stayontrack-devops` for CI/CD, pipeline setup, GitHub Actions or equivalent, Docker, environment variables, deployment flow, monitoring, or rollback design.
- Use `stayontrack-retention` when the task touches onboarding, motivation loops, streak framing, push strategy, gamification, or retention mechanics.
- Use `stayontrack-mobile` only when a task truly touches mobile implementation or mobile-specific UX; keep it dormant otherwise.
- Use the minimal set of skills that covers the task.

RU:
- Навыки в этом проекте работают как role playbook, а не как автономные фоновые исполнители.
- Используй `stayontrack-analyst`, когда входные данные сырые, неоднозначные, без структуры или больше похожи на продуктовые мысли, чем на задачу реализации.
- Используй `stayontrack-core` для любой нетривиальной работы по StayOnTrack, а также для архитектурного review, контроля дублирования, проверки простоты решений, dead code и соблюдения границ модулей.
- Используй `stayontrack-orchestrator`, когда задача затрагивает несколько ролей, требует последовательности, должна быть приведена к task template или ей нужен владелец delivery.
- Используй `stayontrack-backend` для NestJS, TypeORM, PostgreSQL, DTO, auth, migrations, API, статистики и бизнес-логики.
- Используй `stayontrack-frontend` для экранов, форм, клиентского состояния, работы с API, accessibility и фронтенд-реализации.
- Используй `stayontrack-design`, когда UX, состояния интерфейса, поведение валидации, тексты, layout или responsive-поведение нужно определить до фронтенда.
- Используй `stayontrack-qa` для ревью, поиска багов, недостающих тестов, оценки регрессий, проверок приемки и сквозной валидации.
- Используй `stayontrack-devops` для CI/CD, настройки pipeline, GitHub Actions или аналога, Docker, env-переменных, деплоя, мониторинга и rollback.
- Используй `stayontrack-retention`, когда задача затрагивает onboarding, мотивационные циклы, framing стрика, push-стратегию, геймификацию или retention-механику.
- Используй `stayontrack-mobile` только когда задача действительно касается mobile-реализации или mobile-specific UX; в остальное время держи его dormant.
- Используй минимальный набор навыков, который покрывает задачу.

## Delivery Order / Порядок delivery
EN:
- Default cross-domain order for raw or underspecified work: `stayontrack-analyst` -> `stayontrack-orchestrator` -> `stayontrack-core` -> relevant role skills -> `stayontrack-qa` -> `stayontrack-devops` if delivery infrastructure is affected -> `stayontrack-orchestrator` closeout.
- Insert `stayontrack-retention` before design or implementation when activation, onboarding, streak messaging, notifications, or gamification mechanics are being defined.
- Insert `stayontrack-mobile` only when `apps/mobile` or mobile-specific behavior is in scope.
- If the task is already well-structured, skip `stayontrack-analyst`.
- Put `stayontrack-backend` before `stayontrack-frontend` when contracts, auth, or data model change.
- Put `stayontrack-design` before `stayontrack-frontend` when UX or screen-state decisions are missing.
- Use `stayontrack-qa` before closing any non-trivial delivery.
- Close the task only after acceptance evidence is captured in the task file and all impacted docs and memory layers are updated or explicitly marked as `not_needed`.

RU:
- Базовый порядок для сырых или недоопределенных задач: `stayontrack-analyst` -> `stayontrack-orchestrator` -> `stayontrack-core` -> нужные role skills -> `stayontrack-qa` -> `stayontrack-devops`, если затронута инфраструктура delivery -> финальное закрытие через `stayontrack-orchestrator`.
- Вставляй `stayontrack-retention` перед design или реализацией, когда определяются activation, onboarding, сообщения о стрике, уведомления или gamification-механики.
- Вставляй `stayontrack-mobile` только когда в scope входят `apps/mobile` или mobile-specific поведение.
- Если задача уже хорошо структурирована, пропускай `stayontrack-analyst`.
- Ставь `stayontrack-backend` раньше `stayontrack-frontend`, когда меняются контракты, auth или модель данных.
- Ставь `stayontrack-design` раньше `stayontrack-frontend`, когда не определены UX-решения или состояния экранов.
- Используй `stayontrack-qa` перед закрытием любой нетривиальной поставки.
- Закрывай задачу только после фиксации доказательств приемки в task-файле и обновления всех затронутых docs- и memory-слоев либо их явной отметки как `not_needed`.

## Active vs Reference Skill Rule / Правило active vs reference для skills
EN:
- The project-local StayOnTrack skills are the active operational role system.
- Future-heavy product and platform ideas may live in `docs/strategy/*` and can inform planning, but they do not override approved current architecture or contracts.
- A separate `architect` role is intentionally not created right now; architecture authority remains inside `stayontrack-core`.

RU:
- Project-local StayOnTrack skills являются активной operational role system.
- Future-heavy продуктовые и platform-идеи могут жить в `docs/strategy/*` и помогать планированию, но не переопределяют утвержденную текущую архитектуру или контракты.
- Отдельная роль `architect` сейчас намеренно не создается; архитектурная authority остается внутри `stayontrack-core`.

## Documentation Sync Rule / Правило синхронизации документации
EN:
For every non-trivial change, the acting role set must assess impact on the following layers before closeout:
- current task file in `tasks/*`
- shared guides and role-rule files
- domain docs under `docs/*` when a stabilized flow, endpoint contract usage, or implementation map changed
- runtime docs such as `README.md` when local run, integration, or operator guidance changed
- project memory files (`PROJECT_STATE.md`, `DECISIONS_LOG.md`, `ROADMAP.md`, `tasks/INDEX.md`) when relevant

The default assumption is not that docs are optional; the default assumption is that impacted docs must be updated unless explicitly marked `not_needed` in the task record.

RU:
Для каждого нетривиального изменения набор активных ролей должен до закрытия оценить влияние на следующие слои:
- текущий task-файл в `tasks/*`
- общие guide-файлы и role-rule документы
- domain docs в `docs/*`, когда изменился стабилизированный flow, использование endpoint-контракта или implementation map
- runtime docs вроде `README.md`, когда изменилась локальная инструкция запуска, интеграция или operator-guidance
- файлы памяти проекта (`PROJECT_STATE.md`, `DECISIONS_LOG.md`, `ROADMAP.md`, `tasks/INDEX.md`), когда это релевантно

Базовое предположение теперь не в том, что docs опциональны; базовое предположение в том, что все затронутые docs должны быть обновлены, если только в task-записи они явно не отмечены как `not_needed`.

## Git Execution Rule / Правило работы с Git
EN:
- The current StayOnTrack repository uses GitHub Free with a private repository, so GitHub branch protection is not treated as an enforced safety net.
- For every normal non-hotfix task, work must start from `dev` and continue in a short-lived branch rather than by implementing directly on `dev` or `main`.
- During active solo development, Codex is allowed to merge the verified work branch into `dev` and promote `dev` into `main` after checks pass.
- When Codex creates a branch, it must use the `codex/` prefix, for example `codex/feature/task-010-stats-summary`.
- Promotion flow remains `work branch -> dev -> main`, and merges should follow `REPOSITORY_WORKFLOW.md`.
- GitHub PRs are optional visibility artifacts in the current solo-development mode, not mandatory gates.
- At task closeout, Codex must return the local repository checkout to `dev` before the next normal task starts.

RU:
- Текущий репозиторий StayOnTrack использует GitHub Free с private-repo, поэтому GitHub branch protection не считается реально применяемой страховкой.
- Для каждой обычной non-hotfix задачи работа должна начинаться от `dev` и продолжаться в короткоживущей ветке, а не через реализацию прямо в `dev` или `main`.
- Во время активной solo-разработки Codex может вливать проверенную рабочую ветку в `dev` и продвигать `dev` в `main` после прохождения проверок.
- Если ветку создает Codex, она должна использовать префикс `codex/`, например `codex/feature/task-010-stats-summary`.
- Путь продвижения остается `рабочая ветка -> dev -> main`, а merge должен следовать `REPOSITORY_WORKFLOW.md`.
- GitHub PR в текущем solo-режиме являются optional visibility-артефактом, а не обязательным gate.
- При закрытии задачи Codex обязан вернуть локальный checkout репозитория на `dev` до старта следующей обычной задачи.
## Work Item Identity Rule / Правило идентичности work-item
EN:
- Treat work-item IDs as immutable catalog labels, not as the execution queue.
- Use `tasks/EXECUTION_QUEUE.md` as the live order of what should be executed next.
- Use `TASK-*` for planned roadmap delivery.
- Use `FIX-*` for unplanned bug, regression, or acceptance-finding work.
- Use `OPS-*` for local environment, CI/CD, Docker, tooling, release, and operator-readiness work.
- Use `SPIKE-*` for research and decision-probing work.
- Do not renumber historical items to restore visual order; update the execution queue instead.

RU:
- Считай ID work-item'ов неизменяемыми ярлыками каталога, а не очередью исполнения.
- Используй `tasks/EXECUTION_QUEUE.md` как живой порядок того, что должно выполняться следующим.
- Используй `TASK-*` для плановой roadmap-реализации.
- Используй `FIX-*` для внеплановых багов, регрессий и acceptance-находок.
- Используй `OPS-*` для локальных окружений, CI/CD, Docker, tooling, релизов и operator-readiness.
- Используй `SPIKE-*` для research и проверки решений.
- Не перенумеровывай исторические item'ы ради визуального порядка; вместо этого обновляй execution queue.

