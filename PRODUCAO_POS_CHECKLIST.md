# Checklist Pós-Produção — Lar dos Anjos Pet (Fase 22)

Execute nas primeiras 24–72h após o go-live.

## Saúde da plataforma

- [ ] `curl -fsS https://api.lardosanjos.online/api/v1/health`
- [ ] `curl -fsS https://api.lardosanjos.online/api/v1/health/ready`
- [ ] Site web carrega em `https://lardosanjos.online`
- [ ] Admin acessível em `https://admin.lardosanjos.online`
- [ ] Login admin + 2FA funcionando

## Fluxos financeiros reais

- [ ] Pix avulso gera QR/BR Code (sem Asaas)
- [ ] Upload de comprovante Pix OK
- [ ] Confirmação manual admin reflete transparência
- [ ] Pix pendente **não** aparece na transparência
- [ ] Doação recorrente/cartão via Asaas produção (valor simbólico)
- [ ] Webhook Asaas recebido e processado (fila Redis)

## Dados e backup

- [ ] Primeiro backup automático visível no R2 (`mysql-backups/`)
- [ ] Restore de teste em ambiente isolado concluído
- [ ] Retenção 30 dias confirmada (script ou lifecycle R2)

## Monitoramento

- [ ] Erro de teste aparece no Sentry (opcional: evento controlado)
- [ ] Alertas configurados (Sentry/e-mail/uptime)
- [ ] Logs da API sem dados sensíveis (tokens, senhas, PAN)

## SEO e PWA

- [ ] `/sitemap.xml` e `/robots.txt` acessíveis
- [ ] Service worker registrado (DevTools → Application)
- [ ] Lighthouse básico > 80 performance/SEO (amostra)

## Segurança pós-deploy

- [ ] Remover `SEED_ADMIN_PASSWORD` do ambiente após seed
- [ ] Rotacionar qualquer secret exposto acidentalmente
- [ ] Verificar headers HSTS nos três domínios
- [ ] Rate limit respondendo 429 em abuso simulado

## Comunicação

- [ ] Equipe informada dos links de operação e contatos de incidente
- [ ] Procedimento de rollback testado (redeploy versão anterior)
- [ ] Documentação `OPERACOES_PRODUCAO.md` entregue ao responsável
