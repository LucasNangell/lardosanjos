#!/bin/bash
set -euo pipefail

# Backup MySQL com mysqldump → Cloudflare R2 (bucket privado)
# Retenção padrão: 30 dias | Intervalo: 12h (via backup-cron.sh)

TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
BACKUP_DIR="${BACKUP_DIR:-/tmp/backups}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
PREFIX="${BACKUP_R2_PREFIX:-mysql-backups}"

mkdir -p "${BACKUP_DIR}"

: "${MYSQL_BACKUP_HOST:?Defina MYSQL_BACKUP_HOST}"
: "${MYSQL_BACKUP_USER:?Defina MYSQL_BACKUP_USER}"
: "${MYSQL_BACKUP_PASSWORD:?Defina MYSQL_BACKUP_PASSWORD}"
: "${MYSQL_BACKUP_DATABASE:?Defina MYSQL_BACKUP_DATABASE}"
: "${BACKUP_R2_BUCKET:?Defina BACKUP_R2_BUCKET}"
: "${CLOUDFLARE_R2_ACCESS_KEY_ID:?Defina CLOUDFLARE_R2_ACCESS_KEY_ID}"
: "${CLOUDFLARE_R2_SECRET_ACCESS_KEY:?Defina CLOUDFLARE_R2_SECRET_ACCESS_KEY}"
: "${CLOUDFLARE_R2_ACCOUNT_ID:?Defina CLOUDFLARE_R2_ACCOUNT_ID}"

MYSQL_PORT="${MYSQL_BACKUP_PORT:-3306}"
DUMP_FILE="${BACKUP_DIR}/lardosanjos_${TIMESTAMP}.sql.gz"
R2_ENDPOINT="https://${CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com"
OBJECT_KEY="${PREFIX}/lardosanjos_${TIMESTAMP}.sql.gz"

echo "[backup] Iniciando mysqldump de ${MYSQL_BACKUP_DATABASE}@${MYSQL_BACKUP_HOST}..."

export MYSQL_PWD="${MYSQL_BACKUP_PASSWORD}"
mysqldump \
  --host="${MYSQL_BACKUP_HOST}" \
  --port="${MYSQL_PORT}" \
  --user="${MYSQL_BACKUP_USER}" \
  --single-transaction \
  --routines \
  --triggers \
  --set-gtid-purged=OFF \
  "${MYSQL_BACKUP_DATABASE}" | gzip > "${DUMP_FILE}"
unset MYSQL_PWD

echo "[backup] Enviando para R2 s3://${BACKUP_R2_BUCKET}/${OBJECT_KEY}..."
AWS_ACCESS_KEY_ID="${CLOUDFLARE_R2_ACCESS_KEY_ID}" \
AWS_SECRET_ACCESS_KEY="${CLOUDFLARE_R2_SECRET_ACCESS_KEY}" \
aws s3 cp "${DUMP_FILE}" "s3://${BACKUP_R2_BUCKET}/${OBJECT_KEY}" \
  --endpoint-url "${R2_ENDPOINT}" \
  --only-show-errors

echo "[backup] Removendo dumps locais com mais de ${RETENTION_DAYS} dias..."
find "${BACKUP_DIR}" -name 'lardosanjos_*.sql.gz' -mtime +"${RETENTION_DAYS}" -delete

echo "[backup] Limpando objetos antigos no R2 (>${RETENTION_DAYS}d)..."
CUTOFF="$(date -d "-${RETENTION_DAYS} days" +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || date -v-"${RETENTION_DAYS}"d +%Y-%m-%dT%H:%M:%SZ)"

AWS_ACCESS_KEY_ID="${CLOUDFLARE_R2_ACCESS_KEY_ID}" \
AWS_SECRET_ACCESS_KEY="${CLOUDFLARE_R2_SECRET_ACCESS_KEY}" \
aws s3 ls "s3://${BACKUP_R2_BUCKET}/${PREFIX}/" --endpoint-url "${R2_ENDPOINT}" | while read -r line; do
  FILE_DATE="$(echo "${line}" | awk '{print $1"T"$2"Z"}')"
  FILE_KEY="$(echo "${line}" | awk '{print $4}')"
  if [[ "${FILE_DATE}" < "${CUTOFF}" && -n "${FILE_KEY}" ]]; then
    AWS_ACCESS_KEY_ID="${CLOUDFLARE_R2_ACCESS_KEY_ID}" \
    AWS_SECRET_ACCESS_KEY="${CLOUDFLARE_R2_SECRET_ACCESS_KEY}" \
    aws s3 rm "s3://${BACKUP_R2_BUCKET}/${PREFIX}/${FILE_KEY}" \
      --endpoint-url "${R2_ENDPOINT}" \
      --only-show-errors
  fi
done

rm -f "${DUMP_FILE}"
echo "[backup] Concluído: ${OBJECT_KEY}"
