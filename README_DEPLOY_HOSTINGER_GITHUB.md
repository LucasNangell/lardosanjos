# Deploy Hostinger + GitHub — Lar dos Anjos Pet

Passo a passo completo para publicar o monorepo na **Hostinger Business** via **GitHub** e hPanel.

> **Sem Docker, sem VPS, sem root.** Três Node.js Web Apps + MySQL Hostinger + Redis externo.

---

## Documentação relacionada

| Arquivo | Conteúdo |
|---------|----------|
| [deploy/CONFIGURACAO_NODE_APPS.md](deploy/CONFIGURACAO_NODE_APPS.md) | Configurar cada app no hPanel |
| [deploy/CONFIGURACAO_BANCO_MYSQL.md](deploy/CONFIGURACAO_BANCO_MYSQL.md) | MySQL e schema |
| [deploy/COMANDOS_HOSTINGER.md](deploy/COMANDOS_HOSTINGER.md) | Build/start commands |
| [deploy/CHECKLIST_POS_DEPLOY.md](deploy/CHECKLIST_POS_DEPLOY.md) | Validação pós-deploy |
| [RELATORIO_PREPARACAO_GITHUB_HOSTINGER.md](RELATORIO_PREPARACAO_GITHUB_HOSTINGER.md) | Diagnóstico e estratégia |
| [deploy/hostinger-env-api.example](deploy/hostinger-env-api.example) | Env API |
| [deploy/hostinger-env-web.example](deploy/hostinger-env-web.example) | Env Web |
| [deploy/hostinger-env-admin.example](deploy/hostinger-env-admin.example) | Env Admin |

---

## 1. Preparar repositório GitHub

```bash
git init
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

Antes do push, confirme:

```bash
pnpm run check:secrets
pnpm lint
pnpm typecheck
pnpm build
```

**Nunca** commite `.env`, senhas reais ou `node_modules`.

---

## 2. Criar banco MySQL na Hostinger

1. hPanel → **MySQL** → criar banco e usuário.
2. phpMyAdmin → importar **`deploy/schema.sql`**.
3. Montar `DATABASE_URL` (ver [deploy/CONFIGURACAO_BANCO_MYSQL.md](deploy/CONFIGURACAO_BANCO_MYSQL.md)).

---

## 3. Redis externo (obrigatório)

A Hostinger Business **não** oferece Redis local. Use serviço externo:

- [Upstash](https://upstash.com/)
- Redis Cloud / Aiven / etc.

Configure na API:

```env
REDIS_URL=redis://default:SENHA@HOST:PORTA
```

Sem Redis, webhooks Asaas não são processados na fila (eventos ficam gravados aguardando worker).

---

## 4. Node.js Web App — API

1. hPanel → Node.js → conectar GitHub → `LucasNangell/lardosanjos` → branch `main`.
2. Application root: **raiz do repositório**.
3. Build: `pnpm run hostinger:build:api`
4. Start: `pnpm run start:api`
5. Domínio: `api.lardosanjos.online`
6. Variáveis: copiar de `deploy/hostinger-env-api.example`.
7. Deploy → testar health:

   ```bash
   curl https://api.lardosanjos.online/api/v1/health/ready
   ```

8. Seed (uma vez):

   ```bash
   pnpm run db:seed
   ```

---

## 5. Node.js Web App — Web

1. Nova Node.js Web App (ou site separado).
2. Build: `pnpm run hostinger:build:web`
3. Start: `pnpm run start:web`
4. Domínio: `lardosanjos.online`
5. **Antes do build**, definir:

   ```env
   NEXT_PUBLIC_API_URL=https://api.lardosanjos.online/api/v1
   NEXT_PUBLIC_APP_URL=https://lardosanjos.online
   NEXT_PUBLIC_SITE_NAME=Lar dos Anjos Pet
   ```

---

## 6. Node.js Web App — Admin

1. Build: `pnpm run hostinger:build:admin`
2. Start: `pnpm run start:admin`
3. Domínio: `admin.lardosanjos.online`
4. Variáveis antes do build:

   ```env
   NEXT_PUBLIC_API_URL=https://api.lardosanjos.online/api/v1
   NEXT_PUBLIC_ADMIN_URL=https://admin.lardosanjos.online
   ```

---

## 7. SSL

Ative SSL gratuito (Let's Encrypt) para:

- `lardosanjos.online`
- `admin.lardosanjos.online`
- `api.lardosanjos.online`

---

## 8. Cloudflare R2

Configure na API (uploads, comprovantes Pix):

```env
CLOUDFLARE_R2_ACCOUNT_ID=
CLOUDFLARE_R2_ACCESS_KEY_ID=
CLOUDFLARE_R2_SECRET_ACCESS_KEY=
CLOUDFLARE_R2_BUCKET=
CLOUDFLARE_R2_PUBLIC_URL=
```

Comprovantes Pix devem permanecer **privados** (sem URL pública).

---

## 9. Asaas

Produção:

```env
ASAAS_API_URL=https://api.asaas.com/v3
ASAAS_ENVIRONMENT=production
```

Webhook no painel Asaas:

```txt
https://api.lardosanjos.online/api/v1/integrations/asaas/webhook
```

**Pix avulso não usa Asaas** — apenas cartão, boleto e assinaturas.

---

## 10. Resend (e-mail)

```env
RESEND_API_KEY=
EMAIL_FROM=noreply@lardosanjos.online
```

---

## 11. Testes finais

Siga [deploy/CHECKLIST_POS_DEPLOY.md](deploy/CHECKLIST_POS_DEPLOY.md):

- Home, admin, health, login
- Pix avulso + comprovante + confirmação manual
- Transparência (somente Pix confirmado)
- Asaas sandbox/produção + webhook
- PWA e sitemap

---

## 12. CI GitHub (opcional)

`.github/workflows/ci.yml` roda lint, test e build em PRs — **não substitui** o deploy do hPanel.

---

## Limitações Hostinger Business

1. **Não é VPS** — sem Docker, root ou Nginx manual.
2. **Redis externo** obrigatório para filas.
3. **3 apps Node** consomem limite do plano — verifique quota.
4. **`NEXT_PUBLIC_*`** exige rebuild ao mudar URLs.
5. **Uploads** devem ir para R2, não disco local permanente.
6. **Jobs longos** podem ser limitados — webhooks usam fila Redis.
7. **Backup MySQL** via hPanel/phpMyAdmin (não cron mysqldump no shared).

---

## Suporte rápido

| Problema | Ação |
|----------|------|
| Build falha no monorepo | Application root = raiz; usar `hostinger:build:*` |
| API 503 ready | Verificar `DATABASE_URL` e `REDIS_URL` |
| Front não acha API | Conferir `NEXT_PUBLIC_API_URL` + rebuild |
| CORS error | `CORS_ORIGINS` com URLs HTTPS corretas |
| Webhook Asaas | URL pública HTTPS + `REDIS_URL` + secret |
