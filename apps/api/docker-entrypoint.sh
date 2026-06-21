#!/bin/sh
set -eu

echo "[entrypoint] Aplicando migrations Prisma (MySQL)..."
pnpm --filter @lardosanjos/database exec prisma migrate deploy

echo "[entrypoint] Iniciando API NestJS..."
exec node apps/api/dist/main.js
