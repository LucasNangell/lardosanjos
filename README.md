# Lar dos Anjos Pet — Monorepo

Plataforma de doações, gestão administrativa e portal público para o abrigo Lar dos Anjos Pet (Brasília).

## Estrutura

| Pacote | Porta | Descrição |
|--------|-------|-----------|
| `apps/web` | 3000 | Portal público (Next.js 14 App Router, PWA) |
| `apps/admin` | 3001 | Painel administrativo |
| `apps/api` | 4000 | API REST (NestJS + Fastify) |
| `packages/database` | — | Prisma ORM (MySQL) |
| `packages/types` | — | Tipos compartilhados |
| `packages/ui` | — | Componentes UI base |
| `packages/validators` | — | Schemas Zod |

## Pré-requisitos

- Node.js ≥ 20
- pnpm 9
- MySQL 8.0
- Redis (opcional, para filas BullMQ)

## Setup

```bash
# Instalar dependências
pnpm install

# Configurar variáveis de ambiente
cp .env.example .env
# Edite DATABASE_URL, JWT_SECRET, SEED_* etc.

# Gerar client Prisma e aplicar migrations
pnpm db:generate
pnpm db:migrate

# Seed inicial (roles, permissões, planos)
pnpm db:seed

# Build de todos os pacotes
pnpm build
```

## Desenvolvimento

```bash
pnpm dev
```

Isso inicia web (3000), admin (3001) e api (4000) via Turbo.

## Variáveis de ambiente

### API (`apps/api/.env` ou raiz `.env`)

| Variável | Descrição |
|----------|-----------|
| `DATABASE_URL` | Conexão MySQL |
| `JWT_SECRET` | Assinatura de tokens |
| `JWT_REFRESH_SECRET` | Refresh tokens |
| `CORS_ORIGINS` | Origens permitidas (ex: `http://localhost:3000,http://localhost:3001`) |
| `ASAAS_API_KEY` | Chave Asaas (sandbox/produção) |
| `CLOUDFLARE_R2_*` | Storage de arquivos (opcional em dev) |

### Frontend

| Variável | Descrição |
|----------|-----------|
| `NEXT_PUBLIC_API_URL` | URL da API (ex: `http://localhost:4000/api/v1`) |

> **Segurança:** Pix avulso é processado apenas no backend. Nenhuma chave Pix ou segredo aparece no frontend.

## Testes

```bash
# API (Jest)
pnpm --filter api test

# Typecheck global
pnpm typecheck
```

## Endpoints principais (Fases 18–21)

### Públicos
- `GET /api/v1/public/animals` — Lista animais
- `GET /api/v1/public/animals/:id` — Detalhe do animal
- `GET /api/v1/public/campaigns` — Campanhas ativas
- `GET /api/v1/public/campaigns/:slug` — Detalhe da campanha
- `GET /api/v1/public/mural` — Mural dos Anjos (consentimento LGPD)
- `POST /api/v1/public/lgpd/consent` — Registro de consentimento
- `POST /api/v1/public/lgpd/data-export-request` — Solicitação de exportação
- `POST /api/v1/public/lgpd/data-deletion-request` — Solicitação de exclusão

### Admin (JWT + RBAC)
- CRUD `/api/v1/admin/animals` — Permissões `ANIMAL_READ` / `ANIMAL_WRITE`
- CRUD `/api/v1/admin/campaigns` — Permissões `CAMPAIGN_READ` / `CAMPAIGN_WRITE`

## PWA

O portal web inclui `manifest.json`, service worker (`/sw.js`) e prompt de instalação. Ícones placeholder estão em `apps/web/public/icons/`.

## Documentação adicional

- `PLANO_IMPLEMENTACAO_LAR_DOS_ANJOS.md` — Plano completo por fases
- `RELATORIO_EXECUCAO_PROMPTS.md` — Status de execução das fases
- `RELATORIO_FINAL_VALIDACAO_LAR_DOS_ANJOS.md` — Relatório de validação final
