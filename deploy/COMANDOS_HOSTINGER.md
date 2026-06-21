## Deploy alternativo (Git / Node Web App)

Se preferir deploy automático via Git, veja [COMANDOS_HOSTINGER.md](./COMANDOS_HOSTINGER.md).

**Recomendado:** upload manual com `pnpm run build:public_html` — evita erros de build na Hostinger.

---

## Regras críticas

1. **Gerenciador de pacotes no hPanel = npm** (nunca pnpm — Corepack quebra)
2. **Comando de construção = `node scripts/hostinger-build.mjs web`** (ou `admin` / `api`)
3. **Não use** `pnpm run ...` no comando de construção do hPanel
4. Variável **`HOSTINGER_APP=web`** (ou admin/api) no hPanel + script `start` na raiz

---

## Web (`lardosanjos.online`)

| Campo hPanel | Valor |
|--------------|--------|
| Predefinida | Next.js |
| Comando de construção | `node scripts/hostinger-build.mjs web` |
| Gerenciador de pacotes | **npm** |
| Diretório de saída | `apps/web/.next` |
| Node | 20.x |
| Raiz | `./` |

**Env (antes do build):**
```env
HOSTINGER_APP=web
NEXT_PUBLIC_API_URL=https://api.lardosanjos.online/api/v1
NEXT_PUBLIC_APP_URL=https://lardosanjos.online
NEXT_PUBLIC_SITE_NAME=Lar dos Anjos Pet
```

---

## Admin (`admin.lardosanjos.online`)

| Campo | Valor |
|-------|--------|
| Comando de construção | `node scripts/hostinger-build.mjs admin` |
| Diretório de saída | `apps/admin/.next` |
| HOSTINGER_APP | `admin` |

---

## API (`api.lardosanjos.online`)

| Campo | Valor |
|-------|--------|
| Predefinida | **Outra** |
| Comando de construção | `node scripts/hostinger-build.mjs api` |
| Diretório de saída | `apps/api/dist` |
| Entrada (se pedir) | `apps/api/dist/main.js` |
| HOSTINGER_APP | `api` |

---

## O que o script de build faz

1. `npx pnpm@9 install --frozen-lockfile --prod=false` (instala devDeps para compilar)
2. Build packages workspace (types, validators, ui, database)
3. Build do app (web/admin/api)

Tudo via `npx` — sem depender de `pnpm` no PATH.

---

## Start em runtime

Raiz do `package.json`:
```json
"start": "node scripts/hostinger-start.mjs"
```

Defina `HOSTINGER_APP` no hPanel para cada app.

---

## Alternativa (npm script)

Comando de construção: `npm run hostinger:build:web`

Equivalente a `node scripts/hostinger-build.mjs web`.

---

## Banco

Importar `deploy/schema.sql` no phpMyAdmin antes da API.

---

## Redis

Obrigatório na API (externo — Upstash etc.).
