# Operações de Produção — Lar dos Anjos Pet

Guia operacional da Fase 22: deploy, manutenção, backup, restore, rollback, monitoramento e secrets.

## Arquitetura

| Componente | Hospedagem | Domínio |
|------------|------------|---------|
| Site público (`apps/web`) | Vercel | `lardosanjos.online` |
| Admin (`apps/admin`) | Vercel | `admin.lardosanjos.online` |
| API NestJS | VPS/Docker | `api.lardosanjos.online` |
| MySQL 8.0 | Container ou managed | interno |
| Redis | Container | interno |
| Backups | Cron container → R2 privado | — |
| Assets/comprovantes | Cloudflare R2 | `assets.lardosanjos.online` |

**Regra crítica:** Pix avulso é interno (BR Code/EMV). Asaas apenas para recorrente/cartão/boleto.

---

## 1. Deploy inicial

### API (VPS)

```bash
git clone <repo> /opt/lardosanjos
cd /opt/lardosanjos
cp .env.production.example .env.production
# Edite .env.production com secrets reais (nunca commite)

docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
docker compose -f docker-compose.prod.yml logs -f api
```

### Frontends (Vercel)

1. Crie dois projetos: **web** (root `apps/web`) e **admin** (root `apps/admin`).
2. Configure variáveis:
   - Web: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_APP_URL`
   - Admin: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_ADMIN_URL`
3. Domínios customizados na Vercel conforme tabela acima.

### MySQL — usuários

```bash
mysql -h <host> -u root -p < deploy/sql/create-backup-user.sql
```

A aplicação usa `lardosanjos_app` (criado pelo compose). Backups usam `lardosanjos_backup`.

### Certificados HTTPS (API)

```bash
certbot certonly --webroot -w deploy/nginx/certbot -d api.lardosanjos.online
cp /etc/letsencrypt/live/api.lardosanjos.online/fullchain.pem deploy/nginx/certs/
cp /etc/letsencrypt/live/api.lardosanjos.online/privkey.pem deploy/nginx/certs/
docker compose -f docker-compose.prod.yml restart nginx
```

Renovação: cron `certbot renew` + reload nginx (mensal ou `--dry-run`).

---

## 2. CI/CD (GitHub Actions)

- **CI** (`.github/workflows/ci.yml`): push/PR → install, lint, typecheck, test, build, check secrets.
- **Deploy API** (`.github/workflows/deploy-api.yml`): manual (`workflow_dispatch`).

Secrets GitHub (Environment `production`):

| Secret | Uso |
|--------|-----|
| `DEPLOY_SSH_HOST` | IP/host VPS |
| `DEPLOY_SSH_USER` | usuário SSH |
| `DEPLOY_SSH_KEY` | chave privada |
| `DEPLOY_APP_PATH` | ex: `/opt/lardosanjos` |

Variable: `DEPLOY_API_URL=https://api.lardosanjos.online`

---

## 3. Healthchecks

| Endpoint | Uso |
|----------|-----|
| `GET /api/v1/health` | Liveness (processo up) |
| `GET /api/v1/health/ready` | Readiness (MySQL + Redis) |

Monitor externo (UptimeRobot, etc.): poll `/health/ready` a cada 1–5 min.

---

## 4. Backup MySQL

- **Ferramenta:** `mysqldump` (não `pg_dump`)
- **Intervalo:** 12 horas (`BACKUP_INTERVAL_HOURS=12`)
- **Destino:** R2 bucket privado `BACKUP_R2_BUCKET`
- **Retenção:** 30 dias (`BACKUP_RETENTION_DAYS=30`)
- **Container:** serviço `backup` no `docker-compose.prod.yml`

Backup manual:

```bash
docker compose -f docker-compose.prod.yml exec backup /usr/local/bin/backup-mysql.sh
```

---

## 5. Restore de teste

**Somente em homologação ou banco isolado.**

```bash
export MYSQL_RESTORE_HOST=...
export MYSQL_RESTORE_USER=...
export MYSQL_RESTORE_PASSWORD=...
export MYSQL_RESTORE_DATABASE=lardosanjos
# + credenciais R2 se --from-r2

./scripts/restore-mysql.sh --from-r2 mysql-backups/lardosanjos_YYYYMMDD_HHMMSS.sql.gz
```

Validação pós-restore:

```sql
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM pix_donations;
SHOW TABLES;
```

---

## 6. Rollback

1. Anote o SHA/tag da release estável anterior.
2. No VPS:
   ```bash
   cd /opt/lardosanjos
   git checkout <tag-estavel>
   docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build api
   ```
3. Se migration irreversível foi aplicada, restaure backup anterior ao deploy.
4. Frontends Vercel: redeploy da deployment anterior no dashboard.
5. Confirme `/health/ready` e fluxo Pix/Asaas crítico.

**Não** faça rollback de schema sem restore de banco compatível.

---

## 7. Monitoramento (Sentry)

API: defina `SENTRY_DSN` em `.env.production`. Erros NestJS são enviados automaticamente.

Frontends: opcional `NEXT_PUBLIC_SENTRY_DSN` na Vercel.

Campos sensíveis (Authorization, Cookie) são removidos no `beforeSend`.

---

## 8. Gestão de secrets

- Desenvolvimento: `.env` local (gitignored)
- Produção: `.env.production` no servidor + Vercel env + GitHub Secrets
- **Nunca** commitar: `.env`, `.env.production`, chaves Asaas, R2, JWT
- Rotacionar: JWT, webhook secret Asaas, senhas MySQL, chaves R2 — após incidente ou periodicamente
- Validar: `node scripts/check-no-secrets.mjs`

---

## 9. Manutenção rotineira

| Tarefa | Frequência |
|--------|------------|
| Verificar backups no R2 | Semanal |
| Restore de teste | Mensal (homolog) |
| Atualizar dependências (`pnpm audit`) | Mensal |
| Renovar certificado TLS | Automático (certbot) |
| Revisar logs Sentry | Diário |
| Revisar fila Redis/webhooks Asaas | Diário |

Migrations:

```bash
docker compose -f docker-compose.prod.yml exec api \
  pnpm --filter @lardosanjos/database exec prisma migrate deploy
```

---

## 10. Ambientes

| Ambiente | Asaas | Pix | Banco |
|----------|-------|-----|-------|
| Local | Sandbox | Teste | MySQL local/remoto dev |
| Desenvolvimento | Sandbox | Teste | MySQL dev |
| Homologação | Sandbox | Teste | MySQL homolog |
| Produção | Produção | Real | MySQL prod |

---

## 11. Validação fluxos financeiros (produção)

1. Pix R$ 1,00 → QR gerado → comprovante → confirmar manual → transparência.
2. Assinatura sandbox **desligada**; usar valor simbólico real Asaas.
3. Webhook: painel Asaas → eventos `PAYMENT_CONFIRMED` recebidos.
4. Pix pendente não soma em `/transparencia`.

---

## 12. Links úteis

- Health: https://api.lardosanjos.online/api/v1/health
- Ready: https://api.lardosanjos.online/api/v1/health/ready
- Checklists: `PRODUCAO_PRE_CHECKLIST.md`, `PRODUCAO_POS_CHECKLIST.md`, `HOMOLOGACAO_CHECKLIST.md`

---

## Riscos e decisões

- **MySQL no compose:** adequado para VPS único; para alta disponibilidade, use MySQL managed (PlanetScale, RDS, etc.) e remova serviço `mysql` do compose.
- **Backup via aws-cli:** compatível com API S3 do R2; bucket deve ser privado.
- **Root MySQL:** apenas para bootstrap do container; app e backup usam usuários dedicados.
- **Deploy front na Vercel:** builds via `turbo --filter`; monorepo requer root directory correto.
