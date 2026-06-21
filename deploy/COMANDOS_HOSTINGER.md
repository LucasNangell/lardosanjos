# Comandos Hostinger — Lar dos Anjos Pet

Referência rápida de build/start para **Node.js Web Apps** no hPanel (monorepo na **raiz** do repositório).

> Hostinger Business **não é VPS**: sem Docker, sem root, sem Nginx manual. Use os comandos abaixo no hPanel.

---

## Pré-requisitos no hPanel

- Node.js **20.x**
- Package manager: **pnpm** (via `corepack enable` nos scripts `hostinger:build:*`)
- Application root: **`/`** (raiz do repositório clonado)

---

## API NestJS

| Campo | Valor |
|-------|--------|
| Domínio sugerido | `api.lardosanjos.online` |
| Build command | `pnpm run hostinger:build:api` |
| Start command | `pnpm run start:api` |
| Output / entry | `apps/api/dist/main.js` |

### Comandos equivalentes (manual / SSH se disponível)

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm run build:api
pnpm run start:api
```

### Pós-deploy (seed — apenas 1ª vez)

```bash
pnpm run db:seed
```

Requer variáveis `SEED_ADMIN_*` no hPanel. Remova a senha do painel após o seed.

---

## Web Next.js (público)

| Campo | Valor |
|-------|--------|
| Domínio sugerido | `lardosanjos.online` |
| Build command | `pnpm run hostinger:build:web` |
| Start command | `pnpm run start:web` |

**Antes do build**, configure no hPanel (ver `deploy/hostinger-env-web.example`):

- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SITE_NAME`

---

## Admin Next.js

| Campo | Valor |
|-------|--------|
| Domínio sugerido | `admin.lardosanjos.online` |
| Build command | `pnpm run hostinger:build:admin` |
| Start command | `pnpm run start:admin` |

**Antes do build**, configure (ver `deploy/hostinger-env-admin.example`):

- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_ADMIN_URL`

---

## Banco de dados

### Opção A — Importar SQL (recomendada no Hostinger)

1. Criar banco MySQL no hPanel.
2. phpMyAdmin → Importar → `deploy/schema.sql` (ou `public_html/schema.sql`).
3. Montar `DATABASE_URL` na API.

### Opção B — Prisma migrate deploy

Somente em **banco vazio**, **sem** importar `schema.sql`:

```bash
pnpm run db:migrate:deploy
pnpm run db:seed
```

---

## Healthcheck

```bash
curl https://api.lardosanjos.online/api/v1/health
curl https://api.lardosanjos.online/api/v1/health/ready
```

---

## Redis externo (obrigatório)

A API usa BullMQ para webhooks Asaas. Configure `REDIS_URL` com serviço externo (Upstash, Redis Cloud, etc.).

Sem Redis: webhooks são **persistidos** mas o **processamento assíncrono fica desabilitado** (ver logs da API).

---

## Redeploy após push no GitHub

1. Push na branch `main`.
2. hPanel → Node.js Web App → **Redeploy** / aguarde deploy automático.
3. Se alterou `NEXT_PUBLIC_*`: **rebuild obrigatório** do web/admin.

---

## Scripts úteis na raiz

| Script | Descrição |
|--------|-----------|
| `pnpm run hostinger:build:api` | Install + build API + deps |
| `pnpm run hostinger:build:web` | Install + build web |
| `pnpm run hostinger:build:admin` | Install + build admin |
| `pnpm run start:api` | Inicia API produção |
| `pnpm run start:web` | Inicia Next web |
| `pnpm run start:admin` | Inicia Next admin |
| `pnpm run db:migrate:deploy` | Migrations Prisma |
| `pnpm run db:seed` | Seed roles + admin |
| `pnpm run check:secrets` | Valida ausência de secrets no Git |
