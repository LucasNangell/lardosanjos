#!/bin/bash
set -euo pipefail

# Restore de teste a partir de dump .sql.gz (local ou R2)
# Uso:
#   ./scripts/restore-mysql.sh /caminho/backup.sql.gz
#   ./scripts/restore-mysql.sh --from-r2 mysql-backups/lardosanjos_20260621_120000.sql.gz

FROM_R2=false
DUMP_SOURCE=""

if [[ "${1:-}" == "--from-r2" ]]; then
  FROM_R2=true
  DUMP_SOURCE="${2:?Informe a chave do objeto R2}"
else
  DUMP_SOURCE="${1:?Informe o arquivo .sql.gz local}"
fi

: "${MYSQL_RESTORE_HOST:?Defina MYSQL_RESTORE_HOST}"
: "${MYSQL_RESTORE_USER:?Defina MYSQL_RESTORE_USER}"
: "${MYSQL_RESTORE_PASSWORD:?Defina MYSQL_RESTORE_PASSWORD}"
: "${MYSQL_RESTORE_DATABASE:?Defina MYSQL_RESTORE_DATABASE}"

MYSQL_PORT="${MYSQL_RESTORE_PORT:-3306}"
WORK_FILE="/tmp/restore_lardosanjos.sql.gz"

if [[ "${FROM_R2}" == "true" ]]; then
  : "${BACKUP_R2_BUCKET:?Defina BACKUP_R2_BUCKET}"
  : "${CLOUDFLARE_R2_ACCOUNT_ID:?Defina CLOUDFLARE_R2_ACCOUNT_ID}"
  : "${CLOUDFLARE_R2_ACCESS_KEY_ID:?Defina CLOUDFLARE_R2_ACCESS_KEY_ID}"
  : "${CLOUDFLARE_R2_SECRET_ACCESS_KEY:?Defina CLOUDFLARE_R2_SECRET_ACCESS_KEY}"
  R2_ENDPOINT="https://${CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com"
  echo "[restore] Baixando s3://${BACKUP_R2_BUCKET}/${DUMP_SOURCE}..."
  AWS_ACCESS_KEY_ID="${CLOUDFLARE_R2_ACCESS_KEY_ID}" \
  AWS_SECRET_ACCESS_KEY="${CLOUDFLARE_R2_SECRET_ACCESS_KEY}" \
  aws s3 cp "s3://${BACKUP_R2_BUCKET}/${DUMP_SOURCE}" "${WORK_FILE}" \
    --endpoint-url "${R2_ENDPOINT}" \
    --only-show-errors
else
  cp "${DUMP_SOURCE}" "${WORK_FILE}"
fi

echo "[restore] ATENÇÃO: isto sobrescreve o banco ${MYSQL_RESTORE_DATABASE} em ${MYSQL_RESTORE_HOST}"
read -r -p "Digite RESTORE para continuar: " CONFIRM
if [[ "${CONFIRM}" != "RESTORE" ]]; then
  echo "Abortado."
  exit 1
fi

export MYSQL_PWD="${MYSQL_RESTORE_PASSWORD}"
echo "[restore] Restaurando..."
gunzip -c "${WORK_FILE}" | mysql \
  --host="${MYSQL_RESTORE_HOST}" \
  --port="${MYSQL_PORT}" \
  --user="${MYSQL_RESTORE_USER}" \
  "${MYSQL_RESTORE_DATABASE}"
unset MYSQL_PWD

rm -f "${WORK_FILE}"
echo "[restore] Concluído. Valide integridade: SELECT COUNT(*) FROM users;"
