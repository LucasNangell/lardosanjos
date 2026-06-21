# Configuração MySQL — Hostinger

Banco: **MySQL 8.0** | ORM: **Prisma** | Charset: **utf8mb4**

---

## 1. Criar banco no hPanel

1. hPanel → **Bancos de dados MySQL**.
2. Crie um banco (ex.: `u123456789_lardosanjos`).
3. Crie usuário com senha forte (**não** use senha de desenvolvimento local).
4. Associe o usuário ao banco com **todas as permissões** (Hostinger compartilhada — usuário dedicado ao app).
5. Anote: **host**, **nome do banco**, **usuário**, **senha**, **porta** (3306).

---

## 2. Montar DATABASE_URL

Formato:

```env
DATABASE_URL=mysql://USUARIO:SENHA@HOST:3306/NOME_DO_BANCO
```

Se a senha contiver `@`, codifique como `%40`.

Exemplo (valores fictícios):

```env
DATABASE_URL=mysql://u123456789_app:MinhaSenh%40Forte@mysql.hostinger.com:3306/u123456789_lardosanjos
```

Configure na **Node.js Web App da API** no hPanel.

---

## Opção A — Importar SQL (recomendada)

Ideal quando **não há terminal** ou migrate deploy é difícil no hPanel.

### Passos

1. phpMyAdmin → selecione o banco vazio.
2. Aba **Importar**.
3. Arquivo: `deploy/schema.sql` (cópia também em `public_html/schema.sql`).
4. Execute e confira ~30 tabelas criadas.

### Conteúdo do schema

Derivado das migrations Prisma:

- `20260621215440_init`
- `20260621180000_phase18_animals`
- `20260621230000_phase21_mfa`

Inclui: usuários/RBAC, doadores, Asaas, Pix manual, webhooks, uploads, transparência, despesas, animais, campanhas, mural, auditoria, MFA, etc.

**Não inclui dados** (sem admin, sem secrets).

### Após importar

1. Configure `DATABASE_URL` na API.
2. Rode seed para criar roles e admin:

   ```bash
   pnpm run db:seed
   ```

   (via terminal hPanel, se disponível)

3. **Não** rode `db:migrate:deploy` depois de importar o SQL — as tabelas já existem.

---

## Opção B — Prisma migrate deploy

Use apenas em banco **completamente vazio**, **sem** importar `schema.sql`.

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm run db:migrate:deploy
pnpm run db:seed
```

Requer `DATABASE_URL` configurada e acesso a terminal na Node.js Web App ou SSH (se o plano permitir).

---

## Seed do administrador

Variáveis (API — somente 1ª implantação):

```env
SEED_ADMIN_NAME=Administrador Master
SEED_ADMIN_EMAIL=admin@lardosanjos.online
SEED_ADMIN_PASSWORD=senha_forte_unica
```

O seed cria roles, permissões e usuário master. **Remova `SEED_ADMIN_PASSWORD` do hPanel após executar.**

---

## Tabela `_prisma_migrations`

A importação via `schema.sql` **não** inclui histórico Prisma. Isso é intencional para phpMyAdmin.

Se precisar usar `migrate deploy` no futuro em ambiente novo, prefira **Opção B** em banco vazio.

---

## Valores monetários

Todas as colunas financeiras usam `DECIMAL(10,2)` — compatível com MySQL, sem `FLOAT`.

---

## Backup

Na Hostinger Business compartilhada:

- Use backups automáticos do hPanel (MySQL).
- Export manual periódico pelo phpMyAdmin.
- **Não** dependa de `mysqldump` via cron no servidor compartilhado.

Para backups off-site, exporte SQL pelo phpMyAdmin e armazene em local seguro (ex.: R2 privado).

---

## Restore de teste

1. Crie banco de homologação separado.
2. Importe `deploy/schema.sql`.
3. Valide:

   ```sql
   SHOW TABLES;
   SELECT COUNT(*) FROM users;
   ```

---

## Regras do projeto (banco)

- MySQL apenas — **não** PostgreSQL.
- Pix avulso: tabelas `pix_donations`, `pix_settings` — confirmação manual.
- Asaas: `payments`, `subscriptions`, `asaas_webhook_events`.
- Comprovantes: `uploaded_files` + R2 (não filesystem permanente na Hostinger).
