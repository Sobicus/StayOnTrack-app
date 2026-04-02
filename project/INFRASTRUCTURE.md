# StayOnTrack — Полный план деплоя на VPS

> Последнее обновление: апрель 2026
> Статус: **Готов к выполнению** — все фазы расписаны пошагово

---

## Обзор инфраструктуры

```
Internet (HTTPS)
     │
     ▼
Nginx (порт 80 → редирект, порт 443 → SSL)
     │
     ├── stayontrack.day          → web контейнер (порт 4801, Next.js)
     └── api.stayontrack.day      → api контейнер (порт 4800, NestJS /api/v1)
                                         │
                                         └── db контейнер (PostgreSQL, только internal)
```

| Параметр | Значение |
|----------|---------|
| Провайдер | Hetzner Cloud (CX23) |
| IP | `204.168.219.189` |
| ОС | Ubuntu 24.04 LTS |
| CPU / RAM / SSD | 2 vCPU / 4 GB / 40 GB NVMe |
| Домен | `stayontrack.day` (Namecheap) |
| SSL | Let's Encrypt (автообновление) |
| Управление | `docker compose -f docker-compose.prod.yml` |

### DNS записи (уже настроены в Namecheap)

| Type | Host | Value | Назначение |
|------|------|-------|-----------|
| A | @ | 204.168.219.189 | stayontrack.day → frontend |
| A | www | 204.168.219.189 | www → frontend |
| A | api | 204.168.219.189 | api.stayontrack.day → backend |

---

## ⚠️ Критические исправления ДО деплоя

Эти проблемы **сломают деплой** если не исправить заранее.

### 1. `NEXT_PUBLIC_API_URL` не попадает в Next.js build

**Проблема:** `NEXT_PUBLIC_*` переменные в Next.js статически встраиваются **во время сборки** (build time), а не runtime. В `docker-compose.prod.yml` переменная передаётся как runtime env — frontend никогда не узнает реальный URL API.

**Исправление** в `apps/web/Dockerfile` — добавить ARG перед `npm run build`:

```dockerfile
# ---- Builder ----
FROM node:20-alpine AS builder
WORKDIR /app

# ... (копирование файлов) ...

ENV NEXT_TELEMETRY_DISABLED=1

# ДОБАВИТЬ ЭТИ ДВЕ СТРОКИ:
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN cd apps/web && npm run build
```

**Исправление** в `docker-compose.prod.yml` для сервиса `web` — добавить build args:

```yaml
web:
  build:
    context: .
    dockerfile: apps/web/Dockerfile
    args:
      NEXT_PUBLIC_API_URL: ${NEXT_PUBLIC_API_URL}
```

### 2. JWT_REFRESH_SECRET отсутствует в docker-compose.prod.yml

**Проблема:** API использует `JWT_REFRESH_SECRET` для refresh-токенов, но в `docker-compose.prod.yml` передаётся только `JWT_SECRET`.

**Исправление** в `docker-compose.prod.yml` в блоке `api.environment`:

```yaml
JWT_SECRET: ${JWT_SECRET:?JWT_SECRET is required}
JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET:?JWT_REFRESH_SECRET is required}  # ДОБАВИТЬ
```

### 3. `.env.production.example` содержит неправильный домен

**Проблема:** Все URL в примере используют `stayontrack.app` вместо `stayontrack.day`.

**Что исправить в своём `.env.production` на сервере:**
- `CORS_ORIGIN=https://stayontrack.day`
- `NEXT_PUBLIC_API_URL=https://api.stayontrack.day/api/v1`
- `GOOGLE_CALLBACK_URL=https://api.stayontrack.day/api/v1/auth/google/callback`
- `FROM_EMAIL=noreply@stayontrack.day`
- `VAPID_EMAIL=mailto:noreply@stayontrack.day`

### 4. nginx.conf не настроен для subdomain-роутинга и SSL

**Проблема:** Текущий `nginx/nginx.conf` роутит по пути (`/api/` → api, `/` → web) на порту 80. Нет subdomain-роутинга, нет HTTPS. Домен `.day` **обязан** работать через HTTPS (HSTS preload).

**Исправление:** Заменить содержимое `nginx/nginx.conf` готовой конфигурацией (см. раздел ниже).

### 5. NEXT_PUBLIC_TELEGRAM_BOT_USERNAME не передаётся в контейнер

**Проблема:** Telegram Login Widget требует имя бота в env переменной.

**Исправление** в `docker-compose.prod.yml` в блоке `web.build.args` и `web.environment`:

```yaml
web:
  build:
    args:
      NEXT_PUBLIC_TELEGRAM_BOT_USERNAME: ${NEXT_PUBLIC_TELEGRAM_BOT_USERNAME:-}
  environment:
    NEXT_PUBLIC_TELEGRAM_BOT_USERNAME: ${NEXT_PUBLIC_TELEGRAM_BOT_USERNAME:-}
```

---

## Финальный nginx.conf (заменить перед деплоем)

Сохранить в `nginx/nginx.conf` — полностью заменить содержимое:

```nginx
events {
    worker_connections 1024;
}

http {
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Gzip
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript image/svg+xml;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=general:10m rate=30r/s;
    limit_req_zone $binary_remote_addr zone=api:10m rate=20r/s;

    # Upstreams
    upstream api  { server api:4800; }
    upstream web  { server web:4801; }

    # ──────────────────────────────────────────
    # HTTP: только для certbot challenge и редиректа на HTTPS
    # ──────────────────────────────────────────
    server {
        listen 80;
        server_name stayontrack.day www.stayontrack.day api.stayontrack.day;

        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }

        location / {
            return 301 https://$host$request_uri;
        }
    }

    # ──────────────────────────────────────────
    # HTTPS: Frontend — stayontrack.day
    # ──────────────────────────────────────────
    server {
        listen 443 ssl http2;
        server_name stayontrack.day www.stayontrack.day;

        ssl_certificate     /etc/letsencrypt/live/stayontrack.day/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/stayontrack.day/privkey.pem;
        ssl_protocols       TLSv1.2 TLSv1.3;
        ssl_ciphers         HIGH:!aNULL:!MD5;
        ssl_session_cache   shared:SSL:10m;

        limit_req zone=general burst=50 nodelay;

        location / {
            proxy_pass http://web;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
        }
    }

    # ──────────────────────────────────────────
    # HTTPS: API — api.stayontrack.day
    # ──────────────────────────────────────────
    server {
        listen 443 ssl http2;
        server_name api.stayontrack.day;

        ssl_certificate     /etc/letsencrypt/live/stayontrack.day/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/stayontrack.day/privkey.pem;
        ssl_protocols       TLSv1.2 TLSv1.3;
        ssl_ciphers         HIGH:!aNULL:!MD5;
        ssl_session_cache   shared:SSL:10m;

        limit_req zone=api burst=30 nodelay;

        location / {
            proxy_pass http://api;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_connect_timeout 30s;
            proxy_send_timeout 30s;
            proxy_read_timeout 30s;
        }
    }
}
```

> ⚠️ **До получения SSL-сертификата** оставь только HTTP-блок (без HTTPS server-блоков) — иначе nginx не запустится.

---

## Фаза 1 — Первичная настройка сервера

```bash
# Подключиться к серверу
ssh root@204.168.219.189

# Обновить систему
apt update && apt upgrade -y

# Создать non-root пользователя deploy
adduser deploy
usermod -aG sudo deploy

# Скопировать SSH-ключ для deploy пользователя
rsync --archive --chown=deploy:deploy ~/.ssh /home/deploy

# Настроить UFW файрвол
ufw allow OpenSSH
ufw allow 80
ufw allow 443
ufw --force enable
ufw status

# Отключить вход по паролю (безопасность)
sed -i 's/^PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sed -i 's/^#PasswordAuthentication no/PasswordAuthentication no/' /etc/ssh/sshd_config
systemctl restart ssh

# Переключиться на deploy
su - deploy
```

---

## Фаза 2 — Установка Docker

```bash
# Установить Docker
sudo apt install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Добавить deploy в группу docker (без sudo)
sudo usermod -aG docker deploy
newgrp docker

# Проверить
docker --version
docker compose version
```

---

## Фаза 3 — Загрузка кода на сервер

```bash
# Клонировать репо (использовать deploy key или HTTPS)
cd /home/deploy
git clone https://github.com/Sobicus/StayOnTrack-app.git stayontrack
cd stayontrack
git checkout main
```

---

## Фаза 4 — Настройка переменных окружения

Создать файл `.env.production` в корне проекта (НЕ коммитить в git!):

```bash
nano .env.production
```

Содержимое (заполнить реальными значениями):

```env
# ── База данных ──────────────────────────────────────────
DB_HOST=db
DB_PORT=5432
DB_USER=stayontrack
DB_PASS=СГЕНЕРИРОВАТЬ_СИЛЬНЫЙ_ПАРОЛЬ          # openssl rand -base64 32
DB_NAME=stayontrack

# ── JWT ──────────────────────────────────────────────────
JWT_SECRET=СГЕНЕРИРОВАТЬ_64_СИМВОЛА            # openssl rand -base64 64
JWT_REFRESH_SECRET=СГЕНЕРИРОВАТЬ_64_СИМВОЛА    # openssl rand -base64 64

# ── CORS ─────────────────────────────────────────────────
CORS_ORIGIN=https://stayontrack.day

# ── API URL (для фронтенда, встраивается при сборке) ─────
NEXT_PUBLIC_API_URL=https://api.stayontrack.day/api/v1

# ── Email (Resend) ───────────────────────────────────────
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
FROM_EMAIL=noreply@stayontrack.day

# ── Google OAuth ─────────────────────────────────────────
GOOGLE_CLIENT_ID=xxxxxxxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxxxxxx
GOOGLE_CALLBACK_URL=https://api.stayontrack.day/api/v1/auth/google/callback

# ── Telegram ─────────────────────────────────────────────
TELEGRAM_BOT_TOKEN=xxxxxxxxxx:xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=StayOnTrackBot   # без @

# ── Web Push (VAPID) — генерация ниже ───────────────────
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_EMAIL=mailto:noreply@stayontrack.day
```

### Генерация VAPID ключей (один раз):

```bash
# Установить web-push CLI
npm install -g web-push
web-push generate-vapid-keys
# Скопировать Public Key и Private Key в .env.production
```

### Генерация случайных секретов:

```bash
openssl rand -base64 32   # для DB_PASS
openssl rand -base64 64   # для JWT_SECRET
openssl rand -base64 64   # для JWT_REFRESH_SECRET
```

---

## Фаза 5 — Исправление кода (перед первым деплоем)

Выполнить исправления из секции "Критические исправления" выше, потом:

```bash
# На локальной машине
git add apps/web/Dockerfile docker-compose.prod.yml nginx/nginx.conf
git commit -m "fix(ops): fix NEXT_PUBLIC_API_URL build arg, JWT_REFRESH_SECRET, nginx subdomain routing"
git push origin main

# На сервере
cd /home/deploy/stayontrack
git pull origin main
```

---

## Фаза 6 — Первый запуск (без SSL)

**Шаг 1:** Временно оставить в `nginx/nginx.conf` ТОЛЬКО HTTP-блок (без HTTPS, без 443), иначе nginx упадёт без сертификатов.

**Шаг 2:** Запустить всё:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build

# Проверить статус
docker compose -f docker-compose.prod.yml ps

# Логи
docker compose -f docker-compose.prod.yml logs -f --tail=50
docker compose -f docker-compose.prod.yml logs api --tail=50
docker compose -f docker-compose.prod.yml logs web --tail=50
```

**Шаг 3:** Проверить что работает по HTTP:

```bash
curl http://stayontrack.day/api/v1/health   # должен вернуть {"status":"ok"}
curl http://stayontrack.day                  # должен вернуть HTML
```

---

## Фаза 7 — SSL-сертификат (Let's Encrypt)

**Шаг 1:** Убедиться что HTTP работает и сертификат certbot может получить challenge.

**Шаг 2:** Получить сертификат:

```bash
# Запустить certbot (wildcard-сертификат для stayontrack.day + api.stayontrack.day)
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

**Шаг 3:** Заменить `nginx/nginx.conf` на полную версию с HTTPS из раздела выше.

**Шаг 4:** Перезапустить nginx:

```bash
docker compose -f docker-compose.prod.yml restart nginx
```

**Шаг 5:** Проверить HTTPS:

```bash
curl https://stayontrack.day/api/v1/health   # {"status":"ok"}
curl https://api.stayontrack.day/api/v1/health
curl https://stayontrack.day                  # HTML страница
```

**Шаг 6:** Автообновление сертификата — добавить в cron:

```bash
crontab -e
# Добавить:
0 12 * * * /home/deploy/stayontrack/scripts/renew-ssl.sh >> /var/log/certbot-renew.log 2>&1
```

Создать скрипт `scripts/renew-ssl.sh`:

```bash
#!/bin/bash
cd /home/deploy/stayontrack
docker compose -f docker-compose.prod.yml --profile ssl run --rm certbot renew
docker compose -f docker-compose.prod.yml restart nginx
```

```bash
chmod +x scripts/renew-ssl.sh
```

---

## Фаза 8 — Проверка деплоя

```bash
# Все контейнеры запущены и healthy
docker compose -f docker-compose.prod.yml ps

# Ожидаемый результат:
# stayontrack_db    running (healthy)
# stayontrack_api   running (healthy)
# stayontrack_web   running (healthy)
# stayontrack_nginx running

# Проверка API
curl https://api.stayontrack.day/api/v1/health
# {"status":"ok","database":"connected"}

# Swagger документация
# Открыть в браузере: https://api.stayontrack.day/api/v1/docs

# Проверка фронтенда
# Открыть в браузере: https://stayontrack.day

# Проверить логи на ошибки
docker compose -f docker-compose.prod.yml logs api --since=5m
docker compose -f docker-compose.prod.yml logs web --since=5m
```

---

## Фаза 9 — CI/CD автодеплой (GitHub Actions)

Добавить секреты в GitHub (Settings → Secrets → Actions):

| Secret | Значение |
|--------|---------|
| `VPS_HOST` | `204.168.219.189` |
| `VPS_USER` | `deploy` |
| `VPS_SSH_KEY` | содержимое `~/.ssh/id_ed25519` (приватный ключ) |
| `VPS_PORT` | `22` |

Создать `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          port: ${{ secrets.VPS_PORT }}
          script: |
            cd /home/deploy/stayontrack
            git pull origin main
            docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
            docker image prune -f
```

> После этого каждый push в `main` → автоматический деплой на сервер.

---

## Фаза 10 — Резервное копирование БД

Настроить `scripts/backup.sh` (уже существует):

```bash
# Проверить скрипт
cat scripts/backup.sh

# Добавить в cron (каждый день в 3:00)
crontab -e
# Добавить:
0 3 * * * /home/deploy/stayontrack/scripts/backup.sh >> /var/log/backup.log 2>&1
```

Содержимое `scripts/backup.sh` (уже корректное):
- Сохраняет в `/backups/stayontrack/db_YYYYMMDD_HHMM.sql.gz`
- Удаляет бэкапы старше 30 дней автоматически

```bash
# Создать директорию для бэкапов
sudo mkdir -p /backups/stayontrack
sudo chown deploy:deploy /backups/stayontrack
chmod +x /home/deploy/stayontrack/scripts/backup.sh

# Тест бэкапа
/home/deploy/stayontrack/scripts/backup.sh
ls -la /backups/stayontrack/
```

---

## Фаза 11 — Мониторинг (опционально)

### Uptime Kuma (рекомендуется)

```bash
# Добавить сервис в docker-compose.prod.yml:
uptime-kuma:
  image: louislam/uptime-kuma:1
  container_name: uptime_kuma
  restart: always
  ports:
    - "3001:3001"
  volumes:
    - uptime_kuma:/app/data
  networks:
    - internal
```

Открыть: `http://204.168.219.189:3001` и настроить мониторинг:
- `https://stayontrack.day` — каждые 60 сек
- `https://api.stayontrack.day/api/v1/health` — каждые 60 сек

### Логи

```bash
# Просмотр логов в реальном времени
docker compose -f docker-compose.prod.yml logs -f

# Логи конкретного сервиса
docker compose -f docker-compose.prod.yml logs api -f --tail=100

# Размер Docker-данных
docker system df
```

---

## Откат (Rollback)

```bash
cd /home/deploy/stayontrack

# Откат к предыдущему коммиту
git log --oneline -10  # найти нужный хеш
git checkout <commit-hash>
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build

# Вернуться на main
git checkout main
```

---

## Полезные команды (шпаргалка)

```bash
# Статус всех контейнеров
docker compose -f docker-compose.prod.yml ps

# Перезапустить всё
docker compose -f docker-compose.prod.yml restart

# Перезапустить один сервис
docker compose -f docker-compose.prod.yml restart api

# Пересобрать и перезапустить (после деплоя нового кода)
docker compose -f docker-compose.prod.yml up -d --build

# Зайти в контейнер API
docker exec -it stayontrack_api sh

# Зайти в базу данных
docker exec -it stayontrack_db psql -U stayontrack stayontrack

# Ручной бэкап БД
docker exec stayontrack_db pg_dump -U stayontrack stayontrack > backup_manual.sql

# Очистить неиспользуемые образы (освободить место)
docker image prune -f

# Посмотреть использование диска
df -h
docker system df
```

---

## Чеклист: полная готовность к деплою

### Код (сделать на локальной машине, закоммитить в main)
- [ ] Исправить `apps/web/Dockerfile` — добавить `ARG/ENV NEXT_PUBLIC_API_URL`
- [ ] Исправить `docker-compose.prod.yml` — добавить `JWT_REFRESH_SECRET` + build args для web
- [ ] Обновить `nginx/nginx.conf` — subdomain routing + HTTPS блоки (пока без SSL, просто структура)
- [ ] Добавить `.github/workflows/deploy.yml` для автодеплоя

### Сервер (сделать на VPS)
- [ ] Обновить систему
- [ ] Создать пользователя `deploy`
- [ ] Настроить UFW (22, 80, 443)
- [ ] Установить Docker + Docker Compose plugin
- [ ] Клонировать репо в `/home/deploy/stayontrack`
- [ ] Создать `.env.production` с реальными секретами
- [ ] Запустить сервисы: `docker compose up -d --build`
- [ ] Проверить HTTP: `curl http://stayontrack.day/api/v1/health`
- [ ] Получить SSL через certbot
- [ ] Подключить HTTPS в nginx.conf и перезапустить
- [ ] Проверить HTTPS на всех доменах
- [ ] Настроить cron для бэкапов (3:00 ежедневно)
- [ ] Настроить cron для обновления SSL (раз в день)

### GitHub (добавить секреты)
- [ ] `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`, `VPS_PORT`

### Проверка после деплоя
- [ ] `https://stayontrack.day` открывается
- [ ] `https://api.stayontrack.day/api/v1/health` возвращает `{"status":"ok"}`
- [ ] Регистрация работает (email приходит)
- [ ] Google OAuth работает
- [ ] Telegram Login Widget работает
- [ ] Docker контейнеры healthy: `docker compose ps`
