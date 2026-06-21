# Checklist de Homologação — Lar dos Anjos Pet (Fase 21)

Use este checklist antes de publicar em produção. Marque cada item após validação manual ou automatizada.

## Autenticação e 2FA

- [ ] Admin consegue fazer login com e-mail/senha
- [ ] Admin com 2FA ativo recebe `requiresMfa` e completa via `/auth/mfa/complete-login`
- [ ] Configuração 2FA: setup → QR code → enable com código TOTP
- [ ] Códigos de backup funcionam uma única vez
- [ ] SUPER_ADMIN consegue resetar 2FA de outro usuário (`POST /admin/users/:id/reset-mfa`)
- [ ] Recuperação de senha: forgot → e-mail → `/redefinir-senha?token=`

## Ações financeiras sensíveis (exigem 2FA step-up)

- [ ] Confirmar Pix manual (`POST .../confirm` + header `X-Mfa-Step-Up`)
- [ ] Alterar chave Pix (`PUT /admin/pix/settings`)
- [ ] Criar/editar/excluir despesa
- [ ] Criar/editar usuário admin

## Rate limiting

- [ ] 6+ tentativas de login/min → HTTP 429
- [ ] 11+ gerações Pix/min → HTTP 429
- [ ] 4+ forgot-password/min → HTTP 429
- [ ] Webhook Asaas **não** é bloqueado (`@SkipThrottle`)

## Pix e transparência

- [ ] Pix avulso gera BR Code interno (sem Asaas)
- [ ] Pix pendente **não** aparece na transparência
- [ ] Pix confirmado manualmente incrementa totais
- [ ] Pix rejeitado não altera totais
- [ ] Pagamento Asaas confirmado (sandbox) incrementa totais

## Mural e LGPD

- [ ] Doador sem consentimento não aparece no mural
- [ ] Doador anônimo aparece como "Anjo Anônimo"
- [ ] Valores não são exibidos no mural público

## Auditoria

- [ ] Login/logout registrados em `audit_logs`
- [ ] Confirmação Pix registrada
- [ ] Alteração Pix settings registrada
- [ ] `GET /admin/audit-logs` retorna paginação (permissão `AUDIT_READ`)

## Segurança

- [ ] Rotas admin retornam 401 sem JWT
- [ ] Usuário sem permissão retorna 403
- [ ] Upload de comprovante `.sh` rejeitado (400)
- [ ] Service worker não cacheia `/dashboard/*` nem `/entrar`
- [ ] Secrets não aparecem em logs de teste

## Testes automatizados

```bash
pnpm --filter api test
pnpm --filter web test
pnpm --filter @lardosanjos/testing-e2e test
pnpm --filter api build && pnpm --filter admin build && pnpm --filter web build
```

## Comandos E2E (stack local)

```bash
# Terminal 1: API + DB
pnpm --filter api dev

# Terminal 2: Web
pnpm --filter web dev

# Terminal 3: E2E
cd packages/testing-e2e && pnpm install-browsers && E2E_SKIP_SERVERS=1 pnpm test
```

## Pendências conhecidas antes de produção

- Configurar `MFA_ENCRYPTION_KEY` e `JWT_SECRET` fortes em produção
- Habilitar 2FA para todos os usuários FINANCEIRO/SUPER_ADMIN
- Configurar Redis para fila de webhooks Asaas
- Deploy e backup MySQL (Fase 22)
