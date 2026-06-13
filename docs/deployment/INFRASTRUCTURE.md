# StayOnTrack — Деплой на VPS: полное руководство

> Для тех, кто делает это впервые. Всё объяснено простыми словами.
> Последнее обновление: апрель 2026

---

## Словарь — что всё это значит

**VPS** (Virtual Private Server) — твой арендованный компьютер в интернете. Работает 24/7, на нём живёт приложение. Наш сервер: Hetzner CX23, Ubuntu 24.04, IP: `204.168.219.189`.

**SSH** — способ подключиться к серверу и управлять им через терминал. Как TeamViewer, только текстом.

**Docker** — программа, которая упаковывает приложение в "контейнер" — изолированный ящик со всем нужным. Запускаешь контейнер — приложение работает, не важно что за сервер.

**Docker Compose** — инструмент для запуска нескольких контейнеров сразу. У нас 4 контейнера: база данных, API, сайт, Nginx.

**Nginx** — программа-роутер. Пользователь заходит на `stayontrack.day` → Nginx решает куда отправить запрос: на сайт или на API. Ещё отвечает за SSL.

**SSL / HTTPS** — шифрование соединения. Замочек в браузере. Без него браузеры пишут "Небезопасно" и `.day` домены вообще не открываются без HTTPS (это их обязательное требование).

**Let's Encrypt / Certbot** — бесплатный сервис для SSL-сертификата. Certbot — программа, которая получает и продлевает его автоматически.

**CI/CD** (Continuous Integration / Continuous Deployment) — автоматический конвейер. При каждом push в main → GitHub сам запускает тесты и деплоит на сервер. Без CI/CD нужно деплоить вручную.

**ENV файл** — файл с секретами (пароли, ключи API). Никогда не попадает в git. Живёт только на сервере.

**Миграции БД** — скрипты изменения структуры базы данных. Запускаются автоматически при старте API — таблицы создадутся сами.

---

## Наша архитектура (как всё устроено)

```
Пользователь в браузере
        │
        ▼
   stayontrack.day  ←── Nginx (порты 80 и 443)
        │
        ├── api.stayontrack.day ──→ API контейнер (NestJS, порт 4800)
        │                                  │
        │                                  └──→ БД контейнер (PostgreSQL)
        │
        └── stayontrack.day ────→ Web контейнер (Next.js, порт 4801)

Сервер: 204.168.219.189 (Hetzner, Германия)
Домен: stayontrack.day (DNS уже настроен)
```

---

## Кто что делает

| Шаг | Что | Кто |
|-----|-----|-----|
| 1 | Подключиться к серверу | **Ты** |
| 2 | Настроить безопасность сервера | **Ты** (команды даю я) |
| 3 | Установить Docker | **Ты** (команды даю я) |
| 4 | Загрузить код на сервер | **Ты** (одна команда) |
| 5 | Создать файл с секретами | **Ты** (заполнить значения) |
| 6 | Запустить приложение | **Ты** (одна команда) |
| 7 | Получить SSL сертификат | **Ты** (одна команда) |
| 8 | Включить HTTPS | **Я** обновляю конфиг + **ты** перезапускаешь |
| 9 | Настроить автобэкап | **Ты** (две команды) |
| 10 | Настроить автодеплой CI/CD | **Я** создаю файл + **ты** добавляешь ключ в GitHub |

**Принцип:** я штурман, ты водитель. Я говорю что писать — ты пишешь на сервере.

---

## ШАГ 1 — Подключиться к серверу

> 👤 **Делаешь: ты**

Открой Terminal (Mac/Linux) или PowerShell (Windows):

```bash
ssh root@204.168.219.189
```

Введи пароль от сервера (тот что прислал Hetzner).
Увидишь `root@ubuntu:~#` — ты на сервере, можно работать.

---

## ШАГ 2 — Настроить безопасность

> 👤 **Делаешь: ты** — вставляй команды блок за блоком

### 2а. Обновить систему
```bash
apt update && apt upgrade -y
```
_Обновляем все системные пакеты. Как Windows Update. Займёт минуту-две._

### 2б. Настроить файрвол
```bash
ufw allow OpenSSH
ufw allow 80
ufw allow 443
ufw --force enable
ufw status
```
_UFW — файрвол (брандмауэр). Разрешаем только SSH, HTTP и HTTPS. Всё остальное заблокировано — защита от атак._

### 2в. Создать рабочего пользователя
```bash
adduser deploy
```
_Введи пароль для пользователя `deploy`, на остальные вопросы просто Enter_

```bash
usermod -aG sudo deploy
usermod -aG docker deploy
```
_Даём пользователю права на sudo (администрирование) и Docker_

Переключись на нового пользователя — дальше работаем от него:
```bash
su - deploy
cd /home/deploy
```

---

## ШАГ 3 — Установить Docker

> 👤 **Делаешь: ты**
> _Docker устанавливается один раз. Скопируй весь блок целиком и вставь._

```bash
sudo apt install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
```

Проверь что установилось:
```bash
docker --version
docker compose version
```
_Должно вывести версии (Docker 24+, Compose 2+) — значит всё ок._

---

## ШАГ 4 — Загрузить код на сервер

> 👤 **Делаешь: ты**

```bash
git clone https://github.com/Sobicus/StayOnTrack-app.git stayontrack
cd stayontrack
git checkout main
```

Проверь что файлы скачались:
```bash
ls
```
_Должны быть: `apps`, `docs`, `nginx`, `docker-compose.prod.yml` и т.д._

---

## ШАГ 5 — Создать файл с секретами

> 👤 **Делаешь: ты** — самый важный шаг
> _Секреты — пароли и ключи. Создаём прямо на сервере, в git они не попадают никогда._

**Сначала сгенерируй JWT секреты** (случайные строки):
```bash
openssl rand -base64 64
```
_Скопируй вывод — это будет JWT_SECRET_

```bash
openssl rand -base64 64
```
_Скопируй вывод — это будет JWT_REFRESH_SECRET_

**Создай файл с секретами:**
```bash
nano .env.production
```

Вставь это и замени все значения на реальные:

```env
# ── База данных ──────────────────────────────────────────
DB_HOST=db
DB_PORT=5432
DB_USER=stayontrack
DB_PASS=ПРИДУМАЙ_СИЛЬНЫЙ_ПАРОЛЬ
DB_NAME=stayontrack

# ── JWT токены авторизации ────────────────────────────────
JWT_SECRET=ВСТАВЬ_СГЕНЕРИРОВАННУЮ_СТРОКУ_1
JWT_REFRESH_SECRET=ВСТАВЬ_СГЕНЕРИРОВАННУЮ_СТРОКУ_2

# ── Домены ───────────────────────────────────────────────
CORS_ORIGIN=https://stayontrack.day
NEXT_PUBLIC_API_URL=https://api.stayontrack.day/api/v1
NEXT_PUBLIC_APP_URL=https://stayontrack.day

# ── Email через Gmail SMTP ────────────────────────────────
# GMAIL_APP_PASSWORD — 16-значный «App password» из Google Account →
# Security → 2-Step Verification → App passwords (НЕ обычный пароль!)
GMAIL_USER=youraddress@gmail.com
GMAIL_APP_PASSWORD=xxxxxxxxxxxxxxxx
EMAIL_FROM=StayOnTrack <noreply@stayontrack.day>

# ── Google OAuth (вход через Google) ─────────────────────
GOOGLE_CLIENT_ID=xxxxxxxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxx
GOOGLE_CALLBACK_URL=https://api.stayontrack.day/api/v1/auth/google/callback

# ── Telegram (вход через Telegram виджет) ────────────────
TELEGRAM_BOT_TOKEN=xxxxxxxxxx:xxxxxxxxxx
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=StayOnTrackBot

# ── Web Push уведомления ─────────────────────────────────
# Генерация: npm install -g web-push && web-push generate-vapid-keys
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_EMAIL=mailto:noreply@stayontrack.day
```

Сохранить файл: `Ctrl+X` → `Y` → `Enter`

Проверь что файл создан:
```bash
cat .env.production
```

---

## ШАГ 6 — Запустить приложение

> 👤 **Делаешь: ты**
> _Первый раз займёт 5-10 минут — Docker собирает образы с нуля._

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```

Следи за процессом (Ctrl+C чтобы выйти, контейнеры продолжат работать):
```bash
docker compose -f docker-compose.prod.yml logs -f --tail=30
```

Проверь что всё запустилось:
```bash
docker compose -f docker-compose.prod.yml ps
```

Результат должен быть такой:
```
NAME                  STATUS
stayontrack_db        running (healthy)
stayontrack_api       running (healthy)
stayontrack_web       running (healthy)
stayontrack_nginx     running
```

Проверь что API отвечает:
```bash
curl http://stayontrack.day/api/v1/health
```
_Должно вернуть: `{"status":"ok"}` — приложение работает!_

> **База данных стартует пустой** — это нормально. TypeORM автоматически создаст все таблицы при первом запуске. Это и есть старт с нуля.

---

## ШАГ 7 — Получить SSL сертификат

> 👤 **Делаешь: ты**
> _SSL = замочек в браузере. Бесплатно через Let's Encrypt. `.day` домен без него не открывается._

```bash
docker compose -f docker-compose.prod.yml --profile ssl run --rm certbot \
  certonly --webroot \
  --webroot-path=/var/www/certbot \
  -d stayontrack.day \
  -d www.stayontrack.day \
  -d api.stayontrack.day \
  --email admin@stayontrack.day \
  --agree-tos \
  --no-eff-email
```

Если всё хорошо увидишь:
```
Successfully received certificate.
```

---

## ШАГ 8 — Включить HTTPS

> 🤖 **Делаю: я (Claude)** — обновлю nginx.conf и запушу
> 👤 **Делаешь: ты** — подтянешь изменения и перезапустишь nginx

**Скажи мне когда будешь на этом шаге** — я раскомментирую HTTPS блоки в конфиге.

После того как я запушу — ты на сервере:
```bash
git pull origin main
docker compose -f docker-compose.prod.yml restart nginx
```

Проверь HTTPS:
```bash
curl https://stayontrack.day
curl https://api.stayontrack.day/api/v1/health
```

Открой в браузере `https://stayontrack.day` — увидишь сайт с замочком 🔒

Настрой автопродление сертификата (раз в день certbot проверяет):
```bash
crontab -e
```
Добавь в конец:
```
0 12 * * * docker compose -f /home/deploy/stayontrack/docker-compose.prod.yml --profile ssl run --rm certbot renew && docker compose -f /home/deploy/stayontrack/docker-compose.prod.yml restart nginx
```

---

## ШАГ 9 — Автобэкап базы данных

> 👤 **Делаешь: ты**
> _Каждый день в 3:00 ночи автоматически сохраняется копия БД. Старые удаляются через 30 дней._

```bash
sudo mkdir -p /backups/stayontrack
sudo chown deploy:deploy /backups/stayontrack
chmod +x /home/deploy/stayontrack/scripts/backup.sh
```

Добавить в расписание:
```bash
crontab -e
```
Добавь в конец (или в тот же файл что редактировал выше):
```
0 3 * * * /home/deploy/stayontrack/scripts/backup.sh >> /var/log/backup.log 2>&1
```

Проверь что бэкап работает:
```bash
/home/deploy/stayontrack/scripts/backup.sh
ls /backups/stayontrack/
```
_Должен появиться файл `db_ДАТА_ВРЕМЯ.sql.gz`_

---

## ШАГ 10 — Автодеплой CI/CD

> 🤖 **Делаю: я** — создам `.github/workflows/deploy.yml`
> 👤 **Делаешь: ты** — генерируешь SSH ключ и добавляешь в GitHub

_Смысл: push в main → GitHub автоматически заходит на сервер и обновляет приложение. Без этого нужно делать git pull вручную каждый раз._

Сгенерируй SSH ключ на сервере:
```bash
ssh-keygen -t ed25519 -C "github-deploy" -f ~/.ssh/github_deploy -N ""
cat ~/.ssh/github_deploy.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

Скопируй приватный ключ (понадобится для GitHub):
```bash
cat ~/.ssh/github_deploy
```
_Скопируй весь вывод — от `-----BEGIN` до `-----END`_

Перейди в GitHub:
`Settings → Secrets and variables → Actions → New repository secret`

| Имя | Значение |
|-----|---------|
| `VPS_HOST` | `204.168.219.189` |
| `VPS_USER` | `deploy` |
| `VPS_SSH_KEY` | весь вывод `cat ~/.ssh/github_deploy` |
| `VPS_PORT` | `22` |

**Скажи мне когда добавишь секреты** — создам файл автодеплоя.

---

## Шпаргалка: частые команды на сервере

```bash
# Перейти в папку проекта
cd /home/deploy/stayontrack

# Статус всех контейнеров
docker compose -f docker-compose.prod.yml ps

# Логи в реальном времени (Ctrl+C чтобы выйти)
docker compose -f docker-compose.prod.yml logs -f

# Только логи API
docker compose -f docker-compose.prod.yml logs api -f --tail=50

# Обновить приложение вручную
git pull origin main
docker compose -f docker-compose.prod.yml up -d --build

# Перезапустить один сервис
docker compose -f docker-compose.prod.yml restart api

# Зайти в базу данных
docker exec -it stayontrack_db psql -U stayontrack stayontrack

# Освободить место на диске
docker image prune -f
```

## Если что-то пошло не так

```bash
# Посмотреть ошибки
docker compose -f docker-compose.prod.yml logs api --tail=100
docker compose -f docker-compose.prod.yml logs nginx --tail=50

# Полная пересборка (если сломалось совсем)
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d --build
```
