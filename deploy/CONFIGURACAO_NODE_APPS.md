# Configuração Node.js Web Apps — Hostinger + GitHub

Guia para deploy do monorepo **Lar dos Anjos Pet** via hPanel (Hostinger Business) conectado ao GitHub.

---

## Visão geral

Serão necessárias **3 Node.js Web Apps** (limite do plano: verifique quantas apps seu plano Business permite):

| App | Domínio | Framework |
|-----|---------|-----------|
| API | `api.lardosanjos.online` | NestJS + Fastify |
| Web | `lardosanjos.online` | Next.js 14 |
| Admin | `admin.lardosanjos.online` | Next.js 14 |

**Application root:** raiz do repositório (`/`) em todos os casos, com comandos `pnpm` filtrados.

**Não use Docker** em produção na Hostinger Business.

---

## Passo a passo no hPanel

### 1. Conectar GitHub

1. Acesse **hPanel** → **Websites**.
2. Selecione o site ou crie um novo.
3. Vá em **Node.js** / **Deploy Node.js App** / **GitHub** (nome pode variar).
4. Autorize o GitHub e selecione:
   - Repositório: `LucasNangell/lardosanjos`
   - Branch: `main`

Repita o processo para **cada** subdomínio/app (API, Web, Admin) ou crie sites separados conforme o hPanel permitir.

### 2. Configurar versão Node

- Node.js **20.x** (mínimo definido em `package.json` → `engines.node`).

### 3. App 1 — API

| Campo | Valor |
|-------|--------|
| Nome | Lar dos Anjos — API |
| Domínio | `api.lardosanjos.online` |
| Application root | `/` (raiz do repo) |
| Build command | `pnpm run hostinger:build:api` |
| Start command | `pnpm run start:api` |
| Port | definida pelo hPanel (`PORT` — geralmente injetada automaticamente) |

**Variáveis de ambiente:** copie de `deploy/hostinger-env-api.example` para o hPanel.

Ordem recomendada:

1. Criar banco MySQL e importar `deploy/schema.sql`.
2. Configurar `DATABASE_URL`.
3. Configurar `REDIS_URL` (externo).
4. Configurar JWT, Asaas, R2, Resend.
5. Deploy.
6. Rodar seed (uma vez) se necessário.
7. Testar `/api/v1/health/ready`.

### 4. App 2 — Web

| Campo | Valor |
|-------|--------|
| Domínio | `lardosanjos.online` |
| Build command | `pnpm run hostinger:build:web` |
| Start command | `pnpm run start:web` |

**Crítico — variáveis antes do build:**

```env
NEXT_PUBLIC_API_URL=https://api.lardosanjos.online/api/v1
NEXT_PUBLIC_APP_URL=https://lardosanjos.online
NEXT_PUBLIC_SITE_NAME=Lar dos Anjos Pet
```

`NEXT_PUBLIC_*` são **embutidas no bundle** no momento do `next build`. Se mudar a URL da API, é necessário **novo build**.

### 5. App 3 — Admin

| Campo | Valor |
|-------|--------|
| Domínio | `admin.lardosanjos.online` |
| Build command | `pnpm run hostinger:build:admin` |
| Start command | `pnpm run start:admin` |

Variáveis antes do build:

```env
NEXT_PUBLIC_API_URL=https://api.lardosanjos.online/api/v1
NEXT_PUBLIC_ADMIN_URL=https://admin.lardosanjos.online
```

### 6. SSL

Ative **SSL gratuito** (Let's Encrypt) para cada domínio/subdomínio no hPanel.

### 7. Logs e redeploy

- Após cada `git push` na `main`, acione redeploy ou aguarde hook automático.
- Consulte logs de build e runtime no hPanel em caso de falha.

---

## Por que não export estático?

| App | Export estático? | Motivo |
|-----|------------------|--------|
| Web | **Não** | Rotas dinâmicas (`/animais/[id]`, `/campanhas/[slug]`), ISR, dashboard doador com auth client-side, PWA com SSR parcial |
| Admin | **Não** | SPA autenticada contra API, rotas dinâmicas |
| API | **N/A** | Sempre Node.js |

Alternativa `public_html`: use apenas para hospedar `schema.sql` ou página estática de fallback — **não** como destino principal dos apps.

---

## Webhook Asaas

URL de produção:

```txt
https://api.lardosanjos.online/api/v1/integrations/asaas/webhook
```

Configure no painel Asaas com o mesmo `ASAAS_WEBHOOK_SECRET` da API.

---

## Monorepo — se o hPanel não aceitar root `/`

Alternativa: manter root na raiz e usar scripts da raiz (já preparados). **Não** apontar application root para `apps/api` isoladamente — as dependências workspace (`@lardosanjos/database`, etc.) exigem instalação na raiz.

---

## CI GitHub (opcional)

O workflow `.github/workflows/ci.yml` valida install, lint, typecheck, test e build — **não faz deploy** para Hostinger. O deploy é feito pelo hPanel via GitHub.

---

## Variáveis: build vs runtime

| Variável | App | Quando |
|----------|-----|--------|
| `NEXT_PUBLIC_*` | web, admin | **Build** (obrigatório antes) |
| `DATABASE_URL` | api | Runtime |
| `JWT_*` | api | Runtime |
| `ASAAS_*` | api | Runtime |
| `REDIS_URL` | api | Runtime |
| `CLOUDFLARE_R2_*` | api | Runtime |
| `CORS_ORIGINS` | api | Runtime |
