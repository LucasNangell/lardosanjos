# Checklist pós-deploy — Hostinger

Marque após publicar API, Web e Admin.

## Infraestrutura

- [ ] Repositório `LucasNangell/lardosanjos` conectado ao hPanel
- [ ] 3 Node.js Web Apps deployadas (API, Web, Admin)
- [ ] SSL/HTTPS ativo em todos os domínios
- [ ] MySQL importado (`deploy/schema.sql`)
- [ ] `DATABASE_URL` configurada na API
- [ ] `REDIS_URL` externo configurado na API

## Saúde

- [ ] `GET https://api.lardosanjos.online/api/v1/health` → 200
- [ ] `GET https://api.lardosanjos.online/api/v1/health/ready` → 200 (MySQL + Redis)
- [ ] Home abre: `https://lardosanjos.online`
- [ ] Admin abre: `https://admin.lardosanjos.online`

## Autenticação

- [ ] Seed executado (admin master criado)
- [ ] Login admin funciona
- [ ] 2FA configurável (se habilitado)

## Pix avulso (interno — sem Asaas)

- [ ] Gerar Pix único → QR/BR Code exibido
- [ ] Status `PIX_GERADO` — **não** conta como pago
- [ ] Upload de comprovante OK (R2)
- [ ] Confirmação manual no admin
- [ ] Pix confirmado aparece na transparência
- [ ] Pix pendente **não** aparece na transparência

## Asaas

- [ ] Chaves produção/sandbox corretas para o ambiente
- [ ] Webhook URL registrada no Asaas
- [ ] Evento de teste recebido (log/fila Redis)
- [ ] Assinatura/cartão sandbox ou simbólico real

## Integrações

- [ ] R2 — upload de imagens/comprovantes
- [ ] Resend — e-mail de recuperação de senha
- [ ] CORS — apenas domínios web + admin

## PWA / SEO

- [ ] `/manifest.json` e service worker
- [ ] `/sitemap.xml` e `/robots.txt`
- [ ] Páginas institucionais (sobre, FAQ, privacidade)

## Segurança

- [ ] Nenhum secret no repositório GitHub
- [ ] `SEED_ADMIN_PASSWORD` removida do hPanel após seed
- [ ] Comprovantes Pix não acessíveis publicamente
- [ ] Rate limit responde 429 em abuso simulado

## Redeploy

- [ ] Push na `main` dispara redeploy (ou manual confirmado)
- [ ] Alteração de `NEXT_PUBLIC_*` → rebuild web/admin testado
