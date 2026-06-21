# Relatório de preparação — GitHub + Hostinger Business

**Projeto:** Lar dos Anjos Pet  
**Repositório alvo:** `https://github.com/LucasNangell/lardosanjos.git`  
**Data:** 2026-06-21  
**Plataforma:** Hostinger Business (Node.js Web Apps + MySQL — **não VPS**)

---

## Etapa 1 — Diagnóstico da arquitetura real

| # | Pergunta | Resposta |
|---|----------|----------|
| 1 | É monorepo? | **Sim** — `pnpm-workspace.yaml` com `apps/*` e `packages/*` |
| 2 | Package manager? | **pnpm 9** (`packageManager` na raiz) |
| 3 | Existe `apps/web`? | **Sim** |
| 4 | Existe `apps/admin`? | **Sim** |
| 5 | Existe `apps/api`? | **Sim** |
| 6 | `apps/web` é Next.js? | **Sim** — Next.js 14.2 |
| 7 | `apps/admin` é Next.js? | **Sim** — Next.js 14.2 |
| 8 | `apps/api` é NestJS? | **Sim** — NestJS 10 + Fastify |
| 9 | Existe Prisma? | **Sim** — `packages/database/prisma/schema.prisma`, provider **MySQL** |
| 10 | Existe Redis/BullMQ? | **Sim** — fila `asaas-webhooks` via BullMQ; **desabilitada** sem `REDIS_URL` |
| 11 | Build standalone Next.js? | **Não** — `output: 'standalone'` não configurado |
| 12 | `apps/web` pode ser estático? | **Não** — rotas dinâmicas, ISR (`revalidate = 300`), dashboard doador, fetch em build |
| 13 | `apps/admin` pode ser estático? | **Não** — painel autenticado, rotas dinâmicas |
| 14 | API precisa Node.js Web App? | **Sim** — NestJS persistente |
| 15 | Quantas Node.js Web Apps? | **3** (API + Web + Admin) |
| 16 | URLs recomendadas | `lardosanjos.online`, `admin.lardosanjos.online`, `api.lardosanjos.online` |
| 17 | Variáveis antes do **build** | `NEXT_PUBLIC_*` (web, admin) |
| 18 | Variáveis de **runtime** | API: `DATABASE_URL`, `JWT_*`, `ASAAS_*`, `REDIS_URL`, `R2_*`, `CORS_*`, etc. |

### Pacotes workspace

| Pacote | Uso |
|--------|-----|
| `@lardosanjos/database` | Prisma client |
| `@lardosanjos/types` | Tipos compartilhados |
| `@lardosanjos/validators` | Validações |
| `@lardosanjos/ui` | Componentes UI (web, admin) |

Build Hostinger deve rodar na **raiz** do monorepo para resolver workspaces.

---

## Etapa 2 — Estratégia de deploy escolhida

| Componente | Estratégia |
|------------|------------|
| `public_html` | **Opcional** — apenas cópia de `schema.sql` + doc; **não** destino dos apps |
| API | **Node.js Web App** na raiz, `hostinger:build:api` / `start:api` |
| Web | **Node.js Web App** na raiz, `hostinger:build:web` / `start:web` |
| Admin | **Node.js Web App** na raiz, `hostinger:build:admin` / `start:admin` |
| Redis | **Externo** (Upstash, Redis Cloud, etc.) — **obrigatório** para webhooks |
| MySQL | **Hostinger** — import `deploy/schema.sql` ou `migrate deploy` |
| R2 | Cloudflare — uploads/comprovantes |
| Resend | E-mail transacional |
| Docker/Nginx/VPS | **Não usados** em produção Hostinger |

### Regras de negócio preservadas

- Pix avulso: BR Code interno, **sem Asaas**
- Confirmação manual antes de transparência
- Asaas: cartão, boleto, assinaturas, webhooks

---

## 1. Estrutura final — arquivos criados/alterados

### Criados

```
README_DEPLOY_HOSTINGER_GITHUB.md
RELATORIO_PREPARACAO_GITHUB_HOSTINGER.md
deploy/schema.sql
deploy/hostinger-env-api.example
deploy/hostinger-env-web.example
deploy/hostinger-env-admin.example
deploy/COMANDOS_HOSTINGER.md
deploy/CONFIGURACAO_NODE_APPS.md
deploy/CONFIGURACAO_BANCO_MYSQL.md
deploy/CHECKLIST_POS_DEPLOY.md
public_html/schema.sql
public_html/DEPLOY_HOSTINGER.md
```

### Alterados

```
package.json                    — scripts hostinger:build:*, build:*, start:*, prisma:*
apps/api/package.json           — start:prod
apps/web/package.json           — start (PORT do hPanel)
apps/admin/package.json         — start (PORT do hPanel)
packages/database/package.json  — prisma:migrate:deploy
.env.example                    — exemplos seguros, sem credenciais reais
.gitignore                      — regras GitHub-safe
```

### Mantidos (referência VPS — não usar na Hostinger)

```
docker-compose.prod.yml
apps/api/Dockerfile
.github/workflows/deploy-api.yml
OPERACOES_PRODUCAO.md
```

---

## 3. Comandos para GitHub

```bash
git remote add origin https://github.com/LucasNangell/lardosanjos.git
git branch -M main
git add .
git commit -m "Preparar deploy Hostinger via GitHub"
git push -u origin main
```

Se o remote já existir:

```bash
git remote set-url origin https://github.com/LucasNangell/lardosanjos.git
git push -u origin main
```

Validação pré-push:

```bash
pnpm run check:secrets
pnpm lint
pnpm typecheck
pnpm build
```

---

## 4. Apps Node a criar no Hostinger

### App 1 — API

| Item | Valor |
|------|--------|
| Domínio | `https://api.lardosanjos.online` |
| Application root | `/` (raiz do repo) |
| Build | `pnpm run hostinger:build:api` |
| Start | `pnpm run start:api` |
| Node | 20.x |
| Env | `deploy/hostinger-env-api.example` |
| Observações | `PORT` injetada pelo hPanel; health em `/api/v1/health/ready` |

### App 2 — Web

| Item | Valor |
|------|--------|
| Domínio | `https://lardosanjos.online` |
| Application root | `/` |
| Build | `pnpm run hostinger:build:web` |
| Start | `pnpm run start:web` |
| Env | `deploy/hostinger-env-web.example` |
| Observações | Definir `NEXT_PUBLIC_*` **antes** do build |

### App 3 — Admin

| Item | Valor |
|------|--------|
| Domínio | `https://admin.lardosanjos.online` |
| Application root | `/` |
| Build | `pnpm run hostinger:build:admin` |
| Start | `pnpm run start:admin` |
| Env | `deploy/hostinger-env-admin.example` |
| Observações | Painel protegido; cookies JWT via API |

---

## 5. Banco

| Item | Detalhe |
|------|---------|
| SQL | `deploy/schema.sql` (cópia: `public_html/schema.sql`) |
| Origem | Migrations Prisma MySQL concatenadas |
| Import | phpMyAdmin → banco vazio → Importar |
| Alternativa | `pnpm run db:migrate:deploy` em banco vazio (sem importar SQL) |
| DATABASE_URL | `mysql://USER:PASS@HOST:3306/DB` — codificar `@` como `%40` |
| Seed | `pnpm run db:seed` com `SEED_ADMIN_*` (uma vez) |

**Recomendação Hostinger:** Opção A (import SQL) — mais simples sem terminal.

---

## 6. Variáveis por app

### API (runtime)

`NODE_ENV`, `PORT`, `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `MFA_ENCRYPTION_KEY`, `ASAAS_*`, `CLOUDFLARE_R2_*`, `RESEND_API_KEY`, `EMAIL_FROM`, `WEB_URL`, `ADMIN_URL`, `API_URL`, `CORS_ORIGINS`, `SENTRY_DSN` (opcional), `SEED_ADMIN_*` (seed)

### Web (build + runtime)

`NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_SITE_NAME`, `NODE_ENV`

### Admin (build + runtime)

`NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_ADMIN_URL`, `NODE_ENV`

---

## 7. Checklist pós-deploy

Ver `deploy/CHECKLIST_POS_DEPLOY.md`:

1. Home, admin, `/health`, `/health/ready`
2. Login admin + seed
3. Pix avulso → comprovante → confirmar → transparência
4. Pix pendente fora da transparência
5. Asaas + webhook
6. Upload R2
7. E-mail Resend
8. PWA + sitemap

---

## 8. Riscos e limitações

| Risco | Mitigação |
|-------|-----------|
| Hostinger não é VPS | Sem Docker/root; usar Node.js Web Apps |
| Sem Redis local | Redis externo obrigatório (`REDIS_URL`) |
| 3 apps Node | Verificar limite do plano Business |
| Monorepo no hPanel | Application root = raiz; scripts `hostinger:build:*` |
| `NEXT_PUBLIC_*` | Rebuild web/admin ao mudar URL |
| Webhooks | API HTTPS pública + Redis + secret Asaas |
| Uploads | R2 — filesystem Hostinger é efêmero/limitado |
| Jobs/filas | BullMQ depende de Redis externo sempre online |
| Backup | hPanel/phpMyAdmin — não mysqldump cron no shared |
| CI vs deploy | `ci.yml` = validação; deploy = hPanel GitHub |

---

## Redis/BullMQ — detalhe

- **Com `REDIS_URL`:** webhooks Asaas processados assincronamente.
- **Sem `REDIS_URL`:** API sobe, mas worker não inicia; eventos ficam em `asaas_webhook_events` com `processed=false`.
- **Conclusão:** Redis **obrigatório em produção** para operação financeira completa.

---

## Verificações finais executadas

```bash
pnpm install
pnpm --filter api test    # 168 passed (sessão anterior)
pnpm build                # web + admin + api OK
pnpm run check:secrets
```

---

## Próximo passo do operador

1. Push para GitHub.
2. Criar 3 Node.js Web Apps no hPanel.
3. Importar `deploy/schema.sql`.
4. Configurar envs e Redis externo.
5. Deploy e checklist pós-deploy.

Documentação principal: **`README_DEPLOY_HOSTINGER_GITHUB.md`**
