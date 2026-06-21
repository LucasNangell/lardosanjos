# Checklist Pré-Produção — Lar dos Anjos Pet (Fase 22)

Marque cada item antes do go-live. Complementa `HOMOLOGACAO_CHECKLIST.md`.

## Infraestrutura

- [ ] Domínio `lardosanjos.online` apontando para Vercel (web)
- [ ] Subdomínio `admin.lardosanjos.online` apontando para Vercel (admin)
- [ ] Subdomínio `api.lardosanjos.online` apontando para VPS/reverse proxy
- [ ] HTTPS ativo em todos os domínios (Vercel + Nginx/certbot)
- [ ] MySQL 8.0 provisionado (managed ou container) com usuário app **sem root**
- [ ] Redis persistente com AOF habilitado
- [ ] Bucket R2 de assets configurado (uploads/comprovantes)
- [ ] Bucket R2 **privado** para backups (`BACKUP_R2_BUCKET`)

## Variáveis e secrets

- [ ] `.env.production` preenchido a partir de `.env.production.example`
- [ ] Senha local `CreativeStudio@2026` **não** reutilizada em produção
- [ ] `DATABASE_URL` usa `mysql://` (não PostgreSQL)
- [ ] `JWT_SECRET`, `JWT_REFRESH_SECRET`, `MFA_ENCRYPTION_KEY` gerados com entropia forte
- [ ] Secrets configurados no GitHub/Vercel/Railway — **não** no repositório
- [ ] `node scripts/check-no-secrets.mjs` passa localmente

## CI/CD

- [ ] GitHub Actions CI verde (lint, typecheck, test, build)
- [ ] Imagem Docker da API builda sem erro
- [ ] Workflow `Deploy API` com secrets SSH ou processo manual documentado
- [ ] Migrations Prisma aplicadas: `prisma migrate deploy`

## Integrações financeiras

- [ ] Asaas **produção** (`ASAAS_ENVIRONMENT=production`, URL `api.asaas.com`)
- [ ] Webhook Asaas registrado: `https://api.lardosanjos.online/api/v1/integrations/asaas/webhook`
- [ ] Chave Pix oficial cadastrada em `pix_settings` (BR Code interno, sem Asaas)
- [ ] Pix avulso: confirmação manual antes de transparência/campanha
- [ ] Teste simbólico Asaas sandbox **desligado** em produção

## Segurança

- [ ] CORS restrito a web + admin de produção
- [ ] Helmet + rate limit ativos na API
- [ ] 2FA habilitado para admins financeiros
- [ ] Comprovantes Pix em prefixo privado do R2
- [ ] Backups R2 sem acesso público

## Monitoramento e backup

- [ ] Sentry DSN configurado (`SENTRY_DSN`)
- [ ] Health: `GET /api/v1/health` (liveness)
- [ ] Readiness: `GET /api/v1/health/ready` (MySQL + Redis)
- [ ] Container backup agendado (12h) validado
- [ ] Restore de teste documentado e executado em homologação

## Frontends (Vercel)

- [ ] `NEXT_PUBLIC_API_URL=https://api.lardosanjos.online/api/v1`
- [ ] PWA, sitemap, robots validados
- [ ] Páginas institucionais e LGPD publicadas

## Rollback preparado

- [ ] Tag/git SHA da release anterior anotada
- [ ] Imagem Docker anterior retida no registry ou servidor
- [ ] Procedimento de rollback em `OPERACOES_PRODUCAO.md` revisado
