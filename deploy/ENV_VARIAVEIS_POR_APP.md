# Variáveis de ambiente por app — Hostinger

Conta: prefixo **`u456568047_`**

| MySQL | Valor |
|-------|--------|
| Banco | `u456568047_lardosanjos` |
| Usuário | `u456568047_lardosanjos` |
| Host (mesma conta) | `localhost` |
| SQL | importar `deploy/schema.sql` |

---

## hPanel — compilação (cada app)

| App | Comando de construção | Gerenciador | Diretório de saída |
|-----|------------------------|-------------|---------------------|
| Web | `node scripts/hostinger-build.mjs web` | **npm** | `apps/web/.next` |
| Admin | `node scripts/hostinger-build.mjs admin` | **npm** | `apps/admin/.next` |
| API | `node scripts/hostinger-build.mjs api` | **npm** | `apps/api/dist` |

Raiz do repositório: **`./`** | Node: **20.x** | Branch: **main**

---

## Arquivos de referência

| Arquivo | Uso |
|---------|-----|
| `.env.hostinger.example` | Modelo completo na raiz (commitado) |
| `deploy/hostinger-env-api.example` | Copiar para API |
| `deploy/hostinger-env-web.example` | Copiar para Web |
| `deploy/hostinger-env-admin.example` | Copiar para Admin |
| `.env` (local) | Sua cópia de trabalho — **não vai pro GitHub** |

Preencha `TROQUE_*` com valores reais no hPanel. **Nunca** commite senhas ou chaves Asaas.

---

## Ordem de deploy

1. MySQL + `schema.sql`
2. API (+ `REDIS_URL` externo)
3. Web
4. Admin
