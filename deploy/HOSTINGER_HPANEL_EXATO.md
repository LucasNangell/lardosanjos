# Configuração EXATA do hPanel — Hostinger

Referência oficial: [Hostinger Node.js deploy](https://www.hostinger.com/support/how-to-deploy-a-nodejs-website-in-hostinger/) | [deploy-nextjs](https://github.com/hostinger/deploy-nextjs)

## Problemas conhecidos neste projeto

| Problema | Solução |
|----------|---------|
| `ERR_VM_DYNAMIC_IMPORT_CALLBACK_MISSING` com pnpm/Corepack | **Gerenciador de pacotes = npm** (nunca pnpm no hPanel) |
| `pnpm: command not found` após `npx pnpm install` | Build via `node scripts/hostinger-build.mjs` (só usa npx) |
| `devDependencies: skipped` com NODE_ENV=production | Script força `--prod=false` na instalação |

---

## Tela principal (todas as apps)

| Campo | Valor |
|-------|--------|
| Repositório | `LucasNangell/lardosanjos` |
| Branch | `main` |
| Versão Node | **20.x** |
| Diretório raiz | **`./`** |

---

## Modal “Alterar configurações de compilação e saída”

### App WEB (`lardosanjos.online`)

| Campo | Valor |
|-------|--------|
| **Configuração predefinida** | Next.js |
| **Comando de construção** | `node scripts/hostinger-build.mjs web` |
| **Gerenciador de pacotes** | **npm** |
| **Diretório de saída** | `apps/web/.next` |

### App ADMIN (`admin.lardosanjos.online`)

| Campo | Valor |
|-------|--------|
| **Configuração predefinida** | Next.js |
| **Comando de construção** | `node scripts/hostinger-build.mjs admin` |
| **Gerenciador de pacotes** | **npm** |
| **Diretório de saída** | `apps/admin/.next` |

### App API (`api.lardosanjos.online`)

| Campo | Valor |
|-------|--------|
| **Configuração predefinida** | **Outra** (NestJS) |
| **Comando de construção** | `node scripts/hostinger-build.mjs api` |
| **Gerenciador de pacotes** | **npm** |
| **Diretório de saída** | `apps/api/dist` |
| **Arquivo de entrada** (se pedir) | `apps/api/dist/main.js` |

---

## Variáveis de ambiente (obrigatório)

### Web

```env
HOSTINGER_APP=web
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://api.lardosanjos.online/api/v1
NEXT_PUBLIC_APP_URL=https://lardosanjos.online
NEXT_PUBLIC_SITE_NAME=Lar dos Anjos Pet
```

### Admin

```env
HOSTINGER_APP=admin
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://api.lardosanjos.online/api/v1
NEXT_PUBLIC_ADMIN_URL=https://admin.lardosanjos.online
```

### API

```env
HOSTINGER_APP=api
NODE_ENV=production
DATABASE_URL=mysql://...
REDIS_URL=redis://...
JWT_SECRET=...
JWT_REFRESH_SECRET=...
MFA_ENCRYPTION_KEY=...
CORS_ORIGINS=https://lardosanjos.online,https://admin.lardosanjos.online
```

(`HOSTINGER_APP` também pode ser omitido se o comando de build já passa `web`/`admin`/`api` como argumento.)

---

## Start (runtime)

O `package.json` na raiz define:

```json
"start": "node scripts/hostinger-start.mjs"
```

A Hostinger usa o script `start` do preset Next.js. **`HOSTINGER_APP`** no hPanel define qual app sobe (web, admin ou api).

Start recomendado pela Hostinger para Next.js simples: `npm run start -- -p $PORT` — no monorepo usamos `hostinger-start.mjs` que já lê `$PORT`.

---

## Ordem de deploy

1. MySQL + `deploy/schema.sql`
2. API (+ Redis externo)
3. Web
4. Admin
