#!/bin/bash
# Database backup script — run via cron daily
DATE=$(date +%Y%m%d_%H%M)
BACKUP_DIR="/backups/stayontrack"
mkdir -p "$BACKUP_DIR"

docker compose -f docker-compose.prod.yml exec -T db \
  pg_dump -U stayontrack stayontrack | gzip > "$BACKUP_DIR/db_$DATE.sql.gz"

# Keep last 30 days
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +30 -delete

echo "Backup completed: db_$DATE.sql.gz"
