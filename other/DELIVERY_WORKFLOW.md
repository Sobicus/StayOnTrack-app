# StayOnTrack Delivery Workflow / Delivery-процесс StayOnTrack

## Purpose / Назначение
EN:
This file defines how StayOnTrack work moves from request to completion. Skills represent project roles and reusable playbooks; they are not autonomous long-running agents.

RU:
Этот файл определяет, как работа по StayOnTrack проходит путь от запроса до завершения. Навыки представляют роли проекта и переиспользуемые playbook-процессы; это не автономные долгоживущие агенты.

## Default Flow / Базовый поток
EN:
1. Analyst turns raw, vague, or underspecified input into a structured feature or task statement.
2. Orchestrator frames the delivery task and decides which roles are required.
3. Core performs architecture and contract alignment review before implementation spreads.
4. Retention works before implementation when activation, onboarding, motivational framing, reminder strategy, or gamification mechanics are being defined.
5. Backend works first when API, auth, data model, or business logic changes.
6. Design works before frontend or mobile when UX, states, copy, or layout are not fully defined.
7. Frontend implements the web UI against the agreed contract and handoff.
8. Mobile joins only when `apps/mobile` or mobile-specific behavior is actually in scope.
9. QA validates changed layers and reports defects or missing tests.
10. Cross-stack E2E validation runs when both frontend and backend changed.
11. DevOps validates CI/CD, environment, migration rollout, and deployment safety when relevant.
12. Orchestrator closes the task only after evidence is captured and all impacted docs, guides, and memory layers are updated or explicitly marked as not needed.
13. Before the task is considered cleanly handed off, the repository closeout step must happen: push the work branch, give the merge or pull handoff, and return the local checkout to `dev`.

RU:
1. Analyst преобразует сырое, расплывчатое или недоопределенное описание в структурированную feature- или task-постановку.
2. Оркестратор формулирует delivery-задачу и определяет, какие роли нужны.
3. Core выполняет архитектурный и контрактный review до того, как реализация разойдется по слоям.
4. Retention подключается до реализации, когда определяются activation, onboarding, мотивационное framing, стратегия напоминаний или gamification-механики.
5. Бэкенд идет первым, когда меняются API, auth, модель данных или бизнес-логика.
6. Design работает до фронтенда или mobile, когда UX, состояния, тексты или layout еще не определены.
7. Фронтенд реализует web-UI по согласованному контракту и handoff-описанию.
8. Mobile подключается только тогда, когда в scope реально входят `apps/mobile` или mobile-specific поведение.
9. QA валидирует измененные слои и сообщает о дефектах или недостающих тестах.
10. Сквозная E2E-проверка выполняется, когда менялись и фронтенд, и бэкенд.
11. DevOps валидирует CI/CD, окружения, rollout миграций и безопасность деплоя, когда это актуально.
12. Оркестратор закрывает задачу только после фиксации доказательств и обновления всех затронутых docs-, guide- и memory-слоев либо их явной отметки как not needed.
13. Перед тем как задача считается чисто переданной дальше, должен случиться repository-closeout: push рабочей ветки, merge- или pull-handoff и возврат локального checkout на `dev`.

## Critical Backend Readiness Gates / Readiness-gate для критичных backend-доменов
EN:
For critical backend domains consumed directly by frontend, such as auth/account, frontend work must not start until the backend readiness gate is explicitly closed. The minimum gate package is:
- frozen shared contract in `PROJECT_GUIDE.md`
- current Swagger/OpenAPI output
- explicit frontend handoff notes
- final E2E acceptance matrix
- CI-aligned local verification path

RU:
Для критичных backend-доменов, которые фронтенд потребляет напрямую, например auth/account, frontend-работа не должна стартовать, пока backend readiness gate явно не закрыт. Минимальный состав gate-пакета:
- зафиксированный общий контракт в `PROJECT_GUIDE.md`
- актуальный Swagger/OpenAPI output
- явные frontend handoff notes
- финальная E2E acceptance matrix
- локальный verification-path, синхронизированный с CI

## Change Impact Assessment / Оценка влияния изменений
EN:
Every non-trivial task must classify which guides or rule sets are affected before implementation starts:
- `PROJECT_GUIDE.md` when product scope, shared contracts, architecture, versioning, or shared engineering rules change.
- `apps/web/FRONTEND_RULES.md` when frontend conventions, frontend architecture, UI state standards, or frontend delivery rules change.
- `apps/api/BACKEND_RULES.md` when backend architecture, persistence rules, security rules, migrations, or backend delivery rules change.
- `AGENTS.md`, `DELIVERY_WORKFLOW.md`, or `tasks/TASK_TEMPLATE.md` when the team workflow, role boundaries, or delivery process changes.
- More than one guide when the task shifts project direction across multiple layers.

RU:
До начала реализации каждая нетривиальная задача должна определить, какие guide-файлы или наборы правил затрагиваются:
- `PROJECT_GUIDE.md`, когда меняются product scope, общие контракты, архитектура, версионирование или общие инженерные правила.
- `apps/web/FRONTEND_RULES.md`, когда меняются фронтенд-конвенции, архитектура фронтенда, стандарты UI-состояний или правила поставки фронтенда.
- `apps/api/BACKEND_RULES.md`, когда меняются архитектура бэкенда, правила хранения, правила безопасности, миграции или правила поставки бэкенда.
- `AGENTS.md`, `DELIVERY_WORKFLOW.md` или `tasks/TASK_TEMPLATE.md`, когда меняется командный workflow, границы ролей или delivery-процесс.
- Несколько guide-файлов сразу, когда задача меняет направление проекта в нескольких слоях.

## Ownership And Approval / Ответственность и утверждение
EN:
- Analyst identifies likely impacted guides and records them as a proposal.
- Orchestrator turns that proposal into a concrete task entry and ensures guide impact is explicit.
- Core decides whether the task changes project-wide direction, shared architecture, or only local implementation details.
- Backend owns proposed edits to backend rules; Frontend owns proposed edits to frontend rules.
- Retention owns proposed engagement, notification-tone, onboarding, and motivational-mechanic guidance.
- Core must review and approve any change that touches `PROJECT_GUIDE.md`, shared contracts, module boundaries, or architecture direction.
- Explicit user approval is required when the task changes product direction, tech stack, shared architecture, public API behavior, security posture, or delivery process.
- Orchestrator blocks implementation start when guide impact or approval is unclear for a contract- or architecture-affecting task.

RU:
- Analyst определяет вероятно затронутые guide-файлы и фиксирует это как proposal.
- Orchestrator превращает этот proposal в конкретную запись в task-файле и следит, чтобы влияние на guide-файлы было явно описано.
- Core решает, меняет ли задача глобальный вектор проекта, общую архитектуру или только локальные детали реализации.
- Backend отвечает за предлагаемые изменения правил бэкенда; Frontend отвечает за предлагаемые изменения правил фронтенда.
- Retention отвечает за предлагаемые guidance по engagement, тону уведомлений, onboarding и мотивационным механикам.
- Core обязан просмотреть и утвердить любое изменение, затрагивающее `PROJECT_GUIDE.md`, общие контракты, границы модулей или архитектурное направление.
- Явное утверждение пользователя обязательно, если задача меняет вектор продукта, технологический стек, общую архитектуру, публичное поведение API, security posture или delivery-процесс.
- Orchestrator блокирует старт реализации, если для задачи, затрагивающей контракт или архитектуру, неясно влияние на guide-файлы или approval.

## Role Gates / Контрольные точки ролей
### Analyst / Аналитик
EN:
Normalize raw product thinking into a structured feature statement with scope, non-goals, assumptions, acceptance criteria, and open questions.

RU:
Приведи сырые продуктовые мысли к структурированной feature-постановке с объемом, non-goals, assumptions, критериями приемки и открытыми вопросами.

### Orchestrator / Оркестратор
EN:
Define goal, scope, non-goals, dependencies, acceptance criteria, and role sequence. Create or update the task file in `tasks/`.

RU:
Определи цель, объем, что не входит в задачу, зависимости, критерии приемки и порядок ролей. Создай или обнови task-файл в `tasks/`.

### Core / Core
EN:
Validate alignment with `PROJECT_GUIDE.md`, API contracts, naming, documentation language rule, architecture boundaries, duplication risk, dead code, and overengineered solutions.

RU:
Проверь соответствие `PROJECT_GUIDE.md`, API-контрактам, именованию, правилу двуязычной документации, архитектурным границам, риску дублирования, dead code и чрезмерно тяжелым решениям.

### Retention / Retention
EN:
Define onboarding mechanics, motivational framing, push strategy, engagement loops, and anti-dark-pattern guardrails when product behavior design is part of the task.

RU:
Определи onboarding-механику, мотивационное framing, push-стратегию, engagement-loop и anti-dark-pattern guardrails, когда в задачу входит продуктовый behavioral-design.

### Backend / Бэкенд
EN:
Deliver API, migrations, DTOs, entities, services, tests, and contract updates when the server side changes.

RU:
Подготовь API, миграции, DTO, entity, сервисы, тесты и обновления контрактов, если меняется серверная часть.

### Design / Дизайн
EN:
Produce an implementation-ready handoff: screen purpose, states, copy, validation, accessibility, and responsive behavior.

RU:
Подготовь handoff, готовый к реализации: назначение экрана, состояния, тексты, валидацию, accessibility и responsive-поведение.

### Frontend / Фронтенд
EN:
Implement UI against the agreed API and design handoff. Do not silently change contracts.

RU:
Реализуй UI по согласованному API и design handoff. Не меняй контракт молча.

### Mobile / Mobile
EN:
Implement or plan mobile-specific behavior only when the mobile app becomes an active surface; otherwise stay dormant.

RU:
Реализуй или планируй mobile-specific поведение только тогда, когда mobile-app становится активной поверхностью; в остальное время роль остается dormant.

### QA / QA
EN:
Validate behavior, regressions, edge cases, tests, and acceptance criteria. Report findings first and block closeout on unresolved critical issues.

RU:
Проверь поведение, регрессии, крайние случаи, тесты и критерии приемки. Сначала сообщай о найденных проблемах и блокируй закрытие при нерешенных критичных issues.

### DevOps / DevOps
EN:
Validate pipeline jobs, environment variables, secrets handling, migration rollout, deployment order, monitoring, and rollback steps.

RU:
Проверь pipeline jobs, env-переменные, работу с секретами, rollout миграций, порядок деплоя, мониторинг и шаги rollback.

## Skip Rules / Правила пропуска
EN:
- Skip Analyst only when the task is already clearly structured.
- Skip a role when its area is unaffected.
- Skip Retention when the task does not shape activation, motivation, notifications, or gamification.
- Skip Design only when UI behavior is already fully specified or unchanged.
- Skip Mobile when `apps/mobile` and mobile-specific behavior are untouched.
- Skip DevOps only when no pipeline, environment, release, or deployment concern is touched.
- Skip E2E only when the task is isolated to one layer and integration risk is low.

RU:
- Пропускай Analyst только когда задача уже четко структурирована.
- Пропускай роль, если ее зона не затронута.
- Пропускай Retention, когда задача не формирует activation, мотивацию, уведомления или геймификацию.
- Пропускай Design только когда поведение UI уже полностью определено или не меняется.
- Пропускай Mobile, когда `apps/mobile` и mobile-specific поведение не затронуты.
- Пропускай DevOps только когда не затрагиваются pipeline, окружения, релиз или деплой.
- Пропускай E2E только когда задача изолирована в одном слое и риск интеграции низкий.

## Git Branch Flow / Git-поток по веткам
EN:
- `main` is reserved for accepted production-ready code.
- `dev` is the main integration branch for the next release candidate.
- New implementation work should start from a short-lived branch created from `dev`.
- Normal promotion flow is `work branch -> dev -> main`.
- Emergency production fixes use `hotfix/*` from `main` and must be merged back into `dev`.
- Because GitHub-enforced protection is not available in the current private-repo setup, treat the branch-first workflow as mandatory manual discipline.
- During the current active solo-development phase, Codex may perform the promotion merges itself after validation instead of stopping at a GitHub PR handoff.
- Follow `REPOSITORY_WORKFLOW.md` for naming, merge, and push conventions.
- Task closeout is not complete until the local checkout is returned to `dev` after promotion or explicit handoff.

RU:
- `main` зарезервирован для принятого production-ready кода.
- `dev` - основная интеграционная ветка для следующего кандидата на релиз.
- Новая реализационная работа должна начинаться с короткоживущей ветки, созданной от `dev`.
- Нормальный путь продвижения такой: `рабочая ветка -> dev -> main`.
- Экстренные production-фиксы идут через `hotfix/*` от `main` и затем обязательно вливаются обратно в `dev`.
- Так как GitHub-enforced защита недоступна в текущей конфигурации private-repo, branch-first workflow нужно считать обязательной ручной дисциплиной.
- Во время текущей фазы активной solo-разработки Codex может сам выполнять promotion-merge после валидации вместо остановки на handoff GitHub PR.
- Для правил именования, merge и push использовать `REPOSITORY_WORKFLOW.md`.
- Закрытие задачи не считается завершенным, пока локальный checkout не возвращен на `dev` после продвижения или явного handoff.

## Work Item Identity And Queue / Идентичность work-item и очередь
EN:
- Work-item IDs are immutable catalog identifiers, not execution-order guarantees.
- `tasks/INDEX.md` is the full catalog of task and support records.
- `tasks/EXECUTION_QUEUE.md` is the live source of truth for what goes next.
- Planned roadmap delivery should continue to use `TASK-*`.
- Unplanned bug or regression work should use `FIX-*`.
- Operational, environment, CI/CD, tooling, and operator-readiness work should use `OPS-*`.
- Research or decision-probing work should use `SPIKE-*`.
- Do not renumber historical items to restore visual order; instead, update the execution queue.

RU:
- ID work-item'ов являются неизменяемыми идентификаторами каталога, а не гарантией порядка исполнения.
- `tasks/INDEX.md` является полным каталогом task- и support-записей.
- `tasks/EXECUTION_QUEUE.md` является живым источником истины для того, что идет следующим.
- Плановая roadmap-реализация должна продолжать использовать `TASK-*`.
- Внеплановые баги и регрессии должны использовать `FIX-*`.
- Операционные задачи, окружения, CI/CD, tooling и operator-readiness должны использовать `OPS-*`.
- Исследовательская работа и проверка решений должны использовать `SPIKE-*`.
- Не перенумеровывай исторические item'ы ради восстановления визуального порядка; вместо этого обновляй execution queue.
## Mandatory Sync Policy / Обязательная политика синхронизации
EN:
No non-trivial task is considered done by code alone. Before closeout, the delivery owner must explicitly assess and update every impacted layer:
- current task file in `tasks/*`
- shared guides and role-rule files
- domain docs under `docs/*` for stabilized or contract-frozen flows
- runtime docs such as README or Swagger notes when behavior or local run guidance changed
- project memory files (`PROJECT_STATE.md`, `DECISIONS_LOG.md`, `ROADMAP.md`, `tasks/INDEX.md`) when relevant

RU:
Ни одна нетривиальная задача не считается завершенной только кодом. До закрытия владелец delivery обязан явно оценить и обновить каждый затронутый слой:
- текущий task-файл в `tasks/*`
- общие guide-файлы и role-rule документы
- domain docs в `docs/*` для стабилизированных или contract-frozen flow
- runtime docs вроде README или Swagger notes, когда изменилось поведение или локальная инструкция запуска
- файлы памяти проекта (`PROJECT_STATE.md`, `DECISIONS_LOG.md`, `ROADMAP.md`, `tasks/INDEX.md`), когда это релевантно

## Project Memory / Память проекта
EN:
After every non-trivial task, update the project memory files when relevant:
- `PROJECT_STATE.md` for current state, active focus, completed work, and risks.
- `DECISIONS_LOG.md` for architecture, process, product, or structural decisions.
- `ROADMAP.md` when milestone order or priorities change.
- `tasks/INDEX.md` when a task is created, completed, blocked, or redirected.

RU:
После каждой нетривиальной задачи обновляй файлы памяти проекта, когда это уместно:
- `PROJECT_STATE.md` для текущего состояния, активного фокуса, выполненной работы и рисков.
- `DECISIONS_LOG.md` для архитектурных, процессных, продуктовых или структурных решений.
- `ROADMAP.md`, когда меняются порядок этапов или приоритеты.
- `tasks/INDEX.md`, когда задача создается, завершается, блокируется или меняет направление.

## Done Criteria / Критерии завершения
EN:
- The task file records scope, role sequence, handoffs, architecture notes, and verification.
- All impacted documentation layers are updated or explicitly marked as `not_needed`, including task files, guides, domain docs, and runtime docs when relevant.
- Tests or validation evidence exist for changed areas.
- Remaining risks are explicit.
- Project memory files are updated when the task changed project state, decisions, roadmap, or task inventory.

RU:
- В task-файле зафиксированы объем, последовательность ролей, handoff, архитектурные заметки и верификация.
- Все затронутые слои документации обновлены или явно отмечены как `not_needed`, включая task-файлы, guide-файлы, domain docs и runtime docs, когда это релевантно.
- Для измененных зон есть тесты или доказательства проверки.
- Оставшиеся риски явно описаны.
- Файлы памяти проекта обновлены, если задача изменила состояние проекта, решения, roadmap или список задач.

