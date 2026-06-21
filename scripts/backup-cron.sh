#!/bin/bash
set -euo pipefail

INTERVAL_HOURS="${BACKUP_INTERVAL_HOURS:-12}"
CRON_EXPR="0 */${INTERVAL_HOURS} * * *"

echo "[backup-cron] Agendando mysqldump a cada ${INTERVAL_HOURS}h (${CRON_EXPR})"

mkdir -p /etc/crontabs
echo "${CRON_EXPR} /usr/local/bin/backup-mysql.sh >> /var/log/backup-mysql.log 2>&1" > /etc/crontabs/root
echo "[backup-cron] Executando backup inicial..."
/usr/local/bin/backup-mysql.sh || echo "[backup-cron] Backup inicial falhou — verifique credenciais"

exec crond -f -l 2
