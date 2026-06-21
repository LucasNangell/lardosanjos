# Upload manual — Hostinger (sem deploy Git / Node Web App)

Gere os arquivos **no seu PC** e envie pelo **Gerenciador de Arquivos** ou **FTP**.

## 1. Gerar pacotes (local)

```bash
pnpm install
pnpm run build:public_html
```

Isso cria:

| Pasta local | Destino na Hostinger |
|-------------|----------------------|
| `public_html/lardosanjos.online/` | `/domains/lardosanjos.online/public_html/` |
| `public_html/admin.lardosanjos.online/` | `/domains/admin.lardosanjos.online/public_html/` |
| `public_html/api.lardosanjos.online/` | `/domains/api.lardosanjos.online/public_html/` |
| `public_html/schema.sql` | Importar no phpMyAdmin |

**Apague** o conteúdo antigo de cada `public_html` na Hostinger (incluindo `.builds/` do deploy Git) antes de enviar.

## 2. Banco MySQL

1. hPanel → Bancos de dados MySQL → banco `u456568047_lardosanjos`
2. phpMyAdmin → Importar → `schema.sql`

## 3. Variáveis de ambiente

Em **cada** pasta enviada, renomeie `.env.example` → `.env` e preencha (ou crie `.env` no Gerenciador de Arquivos).

Use seu `.env` local na raiz do projeto como referência.

## 4. Iniciar Node.js (SSH)

Os sites Next.js e a API **precisam de Node em execução** (não são HTML estático).

Conecte via SSH e, em cada domínio:

```bash
cd ~/domains/api.lardosanjos.online/public_html
chmod +x start.sh
./start.sh
```

Repita para `lardosanjos.online` e `admin.lardosanjos.online`.

Para manter rodando em background, use `screen`, `tmux` ou PM2 se disponível:

```bash
npx pm2 start start.mjs --name lardosanjos-api
npx pm2 save
```

## 5. Ordem recomendada

1. MySQL + `schema.sql`
2. API (`api.lardosanjos.online`) — teste: `/api/v1/health/ready`
3. Web (`lardosanjos.online`)
4. Admin (`admin.lardosanjos.online`)

## 6. Desativar deploy Git (opcional)

hPanel → Websites → Git → desconecte o repositório para evitar sobrescrever seus arquivos.

## Por que não buildar na Hostinger?

O build na Hostinger falha com monorepo + Prisma + pnpm. O script `build-public-html.mjs` compila tudo localmente e envia apenas o resultado pronto.
