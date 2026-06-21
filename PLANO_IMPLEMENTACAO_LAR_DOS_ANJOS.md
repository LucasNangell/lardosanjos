# Plano de Implementação — Lar dos Anjos Pet

## Sumário Executivo
Este documento define a arquitetura de software, o modelo de dados, o mapa de rotas, as diretrizes de design e o roadmap completo de implementação para a plataforma **Lar dos Anjos Pet**, sediada em Brasília. O objetivo central é criar uma plataforma robusta e escalável (Web/PWA) capaz de atrair, converter e fidelizar doadores recorrentes ("Anjos") e pontuais, integrando-se nativamente com o gateway **Asaas** e mantendo total conformidade com a LGPD e altos padrões de transparência financeira (prestação de contas pública de despesas/receitas).

### ⚠️ Regra Crítica de Negócio: Pix Avulso Próprio
Para **doações únicas via Pix**, o sistema **não utiliza o Asaas**, evitando custos desnecessários com taxas de intermediação. Nesses casos, o próprio sistema gera o QR Code no padrão **BR Code/EMV (Pix Copia e Cola)** direcionando o pagamento diretamente para a conta bancária do abrigo configurada na área administrativa. O processamento dessas doações avulsas é mantido em fluxo próprio com confirmação e conciliação manuais efetuadas pela administração após upload de comprovante de transferência. O Asaas é mantido exclusivamente para doações mensais recorrentes, assinaturas, pagamentos via cartão de crédito, boletos e Pix recorrente/automático.

---

## Diagnóstico do Projeto Atual
O estado do projeto foi analisado e mapeado da seguinte forma:
1. **Estrutura de Pastas:** O diretório do projeto está em estado *greenfield* (inicial/vazio).
2. **Arquivos Encontrados:**
   - [Logo.png](file:///g:/Meu%20Drive/creative%20studio/lardosanjos.online/Logo.png): O logotipo oficial do abrigo que ditará a paleta de cores.
   - [escopo.md](file:///g:/Meu%20Drive/creative%20studio/lardosanjos.online/escopo.md): O arquivo de escopo contendo os requisitos funcionais e de negócios.
3. **Código-Fonte / Configurações:** Não existem repositórios inicializados, dependências (`package.json`), bancos de dados, arquivos Docker ou código frontend/backend.
4. **Status de Prontidão:** O projeto está pronto para a fase de estruturação e setup de arquitetura inicial do zero.

---

## Decisões Técnicas Recomendadas

### Stack Tecnológica Proposta
* **Monorepo:** Turborepo com gerenciador de pacotes `pnpm` para agrupar as aplicações de forma otimizada.
* **Frontend Web & PWA:** Next.js (App Router), React, TypeScript, Tailwind CSS, shadcn/ui (Radix UI), Framer Motion para animações suaves, React Hook Form + Zod para formulários e validações, e TanStack Query (React Query) para sincronização de estado com o servidor.
* **Backend API:** NestJS utilizando Fastify como motor HTTP subjacente para alta performance, TypeScript, Prisma ORM para mapeamento relacional, e Passport/JWT para autenticação e RBAC (*Role-Based Access Control*).
* **Banco de Dados Relacional:** **MySQL** local (e em produção) com o provedor MySQL configurado no Prisma.
  * **Credenciais de Acesso Local:**
    * **Usuário:** `root`
    * **Senha:** `CreativeStudio@2026`
    * **Database Name:** `lardosanjos`
    * **Porta:** `3306`
    * **Connection String:** `mysql://root:CreativeStudio%402026@localhost:3306/lardosanjos`
* **Cache & Filas:** Redis para controle de filas de processamento e cache.
* **Processamento Assíncrono / Filas:** BullMQ para gerenciamento de webhooks do Asaas, e-mails transacionais e reprocessamento de erros.
* **Storage de Arquivos:** Cloudflare R2 (S3 compatível) para armazenar comprovantes financeiros, notas fiscais, comprovantes de Pix avulso carregados pelos doadores, imagens de animais e carteirinhas digitais com baixo custo de tráfego.
* **E-mails Transacionais:** Resend (integrado via biblioteca `@react-email/components` para templates elegantes).

### Justificativa da API Separada (NestJS + Fastify) vs Next.js Full-Stack
* **Preparação para App Mobile:** Com um backend NestJS independente que fornece endpoints REST estruturados e autenticação via JWT/Refresh Tokens, o desenvolvimento futuro do aplicativo mobile em React Native (Expo) torna-se direto, bastando consumir a API existente sem necessidade de refatorações de regras de negócio.
* **Robustez em Background Jobs:** O NestJS possui integração nativa com o ecossistema do BullMQ e controle de ciclo de vida de microsserviços. Webhooks de pagamento exigem alta disponibilidade e controle estrito de concorrência e idempotência, o que é complexo de garantir com Serverless Functions/Edge do Next.js (devido a timeouts e inicialização a frio).
* **Escalabilidade & Segurança:** Separação clara de responsabilidades, facilitando testes de integração isolados e controle granular de acessos (RBAC) no backend.

---

## Arquitetura Geral Recomendada

O sistema utilizará a seguinte estrutura monorepo baseada em Turborepo:
```txt
lardosanjos-monorepo/
├── apps/
│   ├── web/                 # Next.js - Portal Público, Dashboard do Doador & PWA
│   ├── admin/               # Next.js - Painel Administrativo de Gestão e Auditoria
│   └── api/                 # NestJS - API Gateway Backend principal
├── packages/
│   ├── ui/                  # Componentes de Design System (Tailwind + Radix UI)
│   ├── database/            # Prisma Schema (MySQL Provider), Migrations e Cliente Prisma
│   ├── validators/          # Schemas Zod compartilhados (ex: validação BR Code, CPF)
│   └── types/               # Tipos TypeScript comuns e DTOs de comunicação
├── docker-compose.yml       # Setup local do MySQL e Redis
└── package.json             # Root workspace package.json
```

---

## Diretrizes de UI/UX

### Paleta de Cores (Baseada na Logo)
* **Verde Principal (Marca/Sucesso):** `#2AA98C` (HSL: `167°, 60%, 41%`)
* **Verde Claro (Apoio/Fundo de Destaques):** `#D1EDE5` (HSL: `164°, 47%, 88%`)
* **Verde Secundário (Bordas e Elementos Secundários):** `#7BBAA9` (HSL: `164°, 32%, 61%`)
* **Caramelo/Dourado (Acentuação de Destaque):** `#B9895D` (HSL: `29°, 42%, 55%`)
* **Bege Claro (Card Backgrounds Secundários):** `#DEB88F` (HSL: `31°, 58%, 72%`)
* **Marrom Escuro (Tipografia Emocional/Títulos Quentes):** `#6A4F36` (HSL: `29°, 33%, 31%`)
* **Texto Geral:** `#263238` (Cinza Escuro Slate)
* **Fundo Geral do App:** `#F7FBF9` (Off-white esverdeado muito suave)

### Tipografia
* **Títulos (H1, H2, H3):** *Poppins* (Google Fonts) — Proporciona aspecto moderno, geométrico e amigável.
* **Corpo do Texto:** *Inter* — Foco na legibilidade em telas de todos os tamanhos.
* **Destaques Afetivos:** *Nunito* — Bordas arredondadas que transmitem acolhimento.

### Componentes de UI Padrão
* **Cards:** Cantos arredondados generosos (`border-radius: 1rem` / `rounded-2xl`), bordas finas com tom suave e sombra de elevação extremamente sutil (`shadow-sm`).
* **Estados de Carregamento:** Shimmer/Skeleton personalizados em formatos de cards e linhas. Spinner em formato de pegada de animal girando suavemente para feedbacks de botões.
* **Visual dos Selos:** Medalhas vetorizadas com bordas carameladas e ícone central representativo do marco atingido (ex: patinha dourada para 12 meses de apoio).
* **Carteirinha Digital:** Formato retangular simulando cartão físico com gradiente linear suave (de `#2AA98C` a `#7BBAA9`), cantos `rounded-xl`, QR Code de validação pública integrado no verso ou lateral direita, e efeitos de *glassmorphism* nos contêineres de dados.

---

## Diretrizes de Engajamento Ético

Para garantir que a plataforma incentive doações recorrentes de forma saudável, respeitando a privacidade dos usuários e evitando padrões de design manipulativos (*dark patterns*), adotam-se as seguintes regras:
1. **Consentimento Explícito para Exibição Pública:** Checkboxes separados de opt-in para aparecer no "Mural dos Anjos" ou no ranking. Por padrão, a doação é marcada como **Anônima** se não houver preenchimento.
2. **Nomes de Planos Humanizados:** Conectar a doação com benefícios reais que não induzam à culpa (ex: "Anjo Semente", "Anjo Ração", "Anjo Cuidado").
3. **Cancelamento Simples e Transparente:** A suspensão ou cancelamento da assinatura mensal deve ser realizável em até **3 cliques** na área do doador, sem necessidade de ligações ou e-mails de justificativa obrigatórios. É exibida apenas uma breve pesquisa opcional sobre o motivo do cancelamento para fins de melhoria de retenção.
4. **Reconhecimento por Constância:** Destaque para marcos de tempo de contribuição (ex: "Apoiador há 6 meses") em detrimento de valores absolutos doados, nivelando a importância de quem doa R$ 9,90/mês e quem doa R$ 100/mês.

---

## Modelo de Dados Proposto

### Decisão Técnica: Separação de Tabelas de Pix Avulso e Uso do MySQL
Decidiu-se isolar as configurações e os registros das doações Pix avulsas em tabelas específicas (`pix_settings`, `pix_donations`, `pix_payment_confirmations`) e utilizar o **MySQL** como banco de dados relacional.
* **Justificativa da Separação:** As doações Pix sem intermediários possuem fluxos de dados e lógica de verificação inteiramente manuais (upload de arquivos de comprovantes bancários, análise por administrador, status específicos como `COMPROVANTE_ENVIADO` e auditoria de reversões). Separar estas tabelas impede colunas excessivamente nulas em `payments` e descomplica as buscas no histórico financeiro.
* **Uso do MySQL:** Todas as colunas contendo dados JSON estruturados (como dados de configurações e históricos) farão uso do tipo de dados `JSON` nativo do MySQL. A codificação padrão das tabelas e do banco de dados será definida como `utf8mb4` para aceitar caracteres especiais e emojis.

```mermaid
erDiagram
    users ||--o| donors : "has profile"
    users ||--o| audit_logs : "creates"
    donors ||--o| subscriptions : "subscribes"
    donors ||--o| payments : "pays"
    donors ||--o| donor_badges : "earns"
    donors ||--o| donor_cards : "has"
    donation_plans ||--o| subscriptions : "defines value"
    subscriptions ||--o| payments : "generates"
    expense_categories ||--o| expenses : "categorizes"
    animals ||--o| animal_images : "has"
    animals ||--o| campaigns : "linked to"
    campaigns ||--o| campaign_donations : "receives"
    payments ||--o| campaign_donations : "funds"
    badges ||--o| donor_badges : "defines"
    donors ||--o| pix_donations : "makes manual donation"
    pix_donations ||--o| pix_payment_confirmations : "has auditing history"
    pix_donations ||--o| uploaded_files : "linked to receipt"
    pix_donations ||--o| campaign_donations : "funds campaign"
```

### Detalhamento das Tabelas (MySQL Schema)

1. **`users`**
   * *Finalidade:* Armazenamento de credenciais e contas do sistema.
   * *Campos:* `id` (VARCHAR(36) ou UUID, PK), `name` (VARCHAR(255)), `email` (VARCHAR(255), Unique), `phone` (VARCHAR(50), Nullable), `password_hash` (VARCHAR(255)), `status` (VARCHAR(50) - ex: 'ACTIVE', 'INACTIVE'), `created_at` (TIMESTAMP), `updated_at` (TIMESTAMP).
   * *Relacionamentos:* 1:1 com `donors`, 1:N com `audit_logs`.

2. **`roles` e `permissions`**
   * *Finalidade:* Controle de acesso baseado em papéis (RBAC) para a área administrativa.
   * *Campos `roles`:* `id` (VARCHAR(36), PK), `name` (VARCHAR(100), Unique, ex: 'SUPERADMIN', 'FINANCEIRO'), `description` (TEXT).
   * *Campos `permissions`:* `id` (VARCHAR(36), PK), `name` (VARCHAR(100), Unique, ex: 'TRANSPARENCY_WRITE', 'PIX_CONFIRM_MANUAL'), `description` (TEXT).
   * *Tabela Pivô `role_permissions`:* `role_id` (FK), `permission_id` (FK).
   * *Tabela Pivô `user_roles`:* `user_id` (FK), `role_id` (FK).

3. **`donors`**
   * *Finalidade:* Dados de cadastro do doador vinculados ou não a um usuário.
   * *Campos:* `id` (VARCHAR(36), PK), `user_id` (VARCHAR(36), FK, Nullable), `full_name` (VARCHAR(255)), `public_name` (VARCHAR(255)), `cpf_cnpj` (VARCHAR(20), Index), `email` (VARCHAR(255), Index), `phone` (VARCHAR(50)), `birth_date` (DATE), `zip_code` (VARCHAR(20)), `address` (VARCHAR(255)), `address_number` (VARCHAR(50)), `address_complement` (VARCHAR(255), Nullable), `neighborhood` (VARCHAR(100)), `city` (VARCHAR(100)), `state` (VARCHAR(2)), `wants_public_profile` (BOOLEAN, Default: false), `public_display_type` (VARCHAR(50) - ex: 'FULL_NAME', 'FIRST_NAME_ONLY', 'ANONYMOUS'), `communication_email` (BOOLEAN, Default: true), `communication_whatsapp` (BOOLEAN, Default: false), `asaas_customer_id` (VARCHAR(100), Index, Nullable).

4. **`donation_plans`**
   * *Finalidade:* Planos de assinaturas mensais configuráveis.
   * *Campos:* `id` (VARCHAR(36), PK), `name` (VARCHAR(255)), `slug` (VARCHAR(255), Unique), `value` (DECIMAL(10,2)), `description` (TEXT), `impact_text` (VARCHAR(255)), `badge_name` (VARCHAR(100)), `badge_color` (VARCHAR(50)), `is_active` (BOOLEAN), `is_featured` (BOOLEAN), `display_order` (INTEGER).

5. **`subscriptions`**
   * *Finalidade:* Vínculo de doação recorrente ativa no sistema local e no Asaas.
   * *Campos:* `id` (VARCHAR(36), PK), `donor_id` (VARCHAR(36), FK), `plan_id` (VARCHAR(36), FK), `asaas_subscription_id` (VARCHAR(100), Index, Unique, Nullable), `billing_type` (VARCHAR(50) - ex: 'CREDIT_CARD', 'PIX', 'BOLETO'), `value` (DECIMAL(10,2)), `cycle` (VARCHAR(50) - ex: 'MONTHLY'), `status` (VARCHAR(50) - ex: 'ACTIVE', 'PENDING', 'INACTIVE', 'CANCELED'), `next_due_date` (DATE), `started_at` (TIMESTAMP), `canceled_at` (TIMESTAMP, Nullable), `cancel_reason` (TEXT, Nullable).

6. **`payments`**
   * *Finalidade:* Histórico de transações individuais via Asaas (exclui Pix avulso).
   * *Campos:* `id` (VARCHAR(36), PK), `donor_id` (VARCHAR(36), FK), `subscription_id` (VARCHAR(36), FK, Nullable), `asaas_payment_id` (VARCHAR(100), Index, Unique), `type` (VARCHAR(50) - ex: 'ONETIME', 'RECURRING'), `billing_type` (VARCHAR(50) - ex: 'PIX', 'CREDIT_CARD', 'BOLETO'), `value` (DECIMAL(10,2)), `status` (VARCHAR(50) - ex: 'PENDING', 'RECEIVED', 'CONFIRMED', 'OVERDUE', 'REFUNDED', 'FAILED'), `due_date` (DATE), `paid_at` (TIMESTAMP, Nullable), `received_at` (TIMESTAMP, Nullable), `invoice_url` (VARCHAR(255), Nullable), `pix_qr_code` (TEXT, Nullable), `pix_copy_paste` (TEXT, Nullable), `boleto_url` (VARCHAR(255), Nullable), `created_at` (TIMESTAMP).

7. **`pix_settings`**
   * *Finalidade:* Parâmetros da conta e da chave Pix configuradas pelo abrigo para doações avulsas sem intermediário.
   * *Campos:* `id` (VARCHAR(36), PK), `receiver_name` (VARCHAR(255)), `receiver_city` (VARCHAR(100)), `pix_key` (VARCHAR(255)), `pix_key_type` (VARCHAR(50) - ex: 'CPF', 'CNPJ', 'EMAIL', 'PHONE', 'RANDOM_KEY'), `default_description` (VARCHAR(255)), `default_txid` (VARCHAR(255), Nullable), `min_amount` (DECIMAL(10,2), Default: 1.00), `allow_custom_amount` (BOOLEAN, Default: true), `quick_amounts` (JSON - MySQL native JSON type), `instructions` (TEXT), `require_donor_data` (BOOLEAN, Default: false), `require_receipt_upload` (BOOLEAN, Default: true), `hide_sensitive_details` (BOOLEAN, Default: false), `is_active` (BOOLEAN, Default: true), `environment` (VARCHAR(50) - ex: 'SANDBOX', 'PRODUCTION'), `created_by` (VARCHAR(36), FK), `updated_by` (VARCHAR(36), FK), `created_at` (TIMESTAMP), `updated_at` (TIMESTAMP).

8. **`pix_donations`**
   * *Finalidade:* Registro de intenções e envios de doação via Pix manual interno do sistema (sem Asaas).
   * *Campos:* `id` (VARCHAR(36), PK), `donor_id` (VARCHAR(36), FK, Nullable), `donor_name` (VARCHAR(255), Nullable), `donor_email` (VARCHAR(255), Nullable), `donor_phone` (VARCHAR(50), Nullable), `amount` (DECIMAL(10,2)), `pix_payload` (TEXT), `pix_qr_code_base64` (LONGTEXT), `txid` (VARCHAR(255), Unique), `status` (VARCHAR(50) - ex: 'PIX_GERADO', 'COMPROVANTE_ENVIADO', 'AGUARDANDO_CONFIRMACAO_MANUAL', 'CONFIRMADO_MANUALMENTE', 'REJEITADO', 'EXPIRADO', 'DUPLICADO'), `wants_public_mural` (BOOLEAN, Default: false), `wants_anonymous` (BOOLEAN, Default: true), `donor_message` (TEXT, Nullable), `receipt_file_id` (VARCHAR(36), FK, Nullable), `marked_as_paid_at` (TIMESTAMP, Nullable), `manually_confirmed_at` (TIMESTAMP, Nullable), `manually_confirmed_by` (VARCHAR(36), FK, Nullable), `rejected_at` (TIMESTAMP, Nullable), `rejected_by` (VARCHAR(36), FK, Nullable), `rejection_reason` (TEXT, Nullable), `expires_at` (TIMESTAMP), `created_at` (TIMESTAMP), `updated_at` (TIMESTAMP).

9. **`pix_payment_confirmations`**
   * *Finalidade:* Log detalhado de alteração de status de doação Pix interna para auditoria.
   * *Campos:* `id` (VARCHAR(36), PK), `pix_donation_id` (VARCHAR(36), FK), `action` (VARCHAR(50) - ex: 'GENERATE', 'ATTACH_RECEIPT', 'CONFIRM'), `previous_status` (VARCHAR(50), Nullable), `new_status` (VARCHAR(50)), `admin_user_id` (VARCHAR(36), FK, Nullable), `note` (TEXT, Nullable), `created_at` (TIMESTAMP).

10. **`asaas_webhook_events`**
    * *Finalidade:* Fila de webhooks recebidos do Asaas para processamento assíncrono idempotente.
    * *Campos:* `id` (VARCHAR(36), PK), `event_id` (VARCHAR(255), Unique), `event_type` (VARCHAR(100)), `payload` (JSON - MySQL native JSON type), `processed` (BOOLEAN, Default: false), `processed_at` (TIMESTAMP, Nullable), `error_message` (TEXT, Nullable), `created_at` (TIMESTAMP).

11. **`expenses`**
    * *Finalidade:* Cadastro de despesas e custos do abrigo para portal de transparência.
    * *Campos:* `id` (VARCHAR(36), PK), `category_id` (VARCHAR(36), FK), `title` (VARCHAR(255)), `description` (TEXT, Nullable), `public_description` (TEXT), `amount` (DECIMAL(10,2)), `date` (DATE), `supplier` (VARCHAR(255), Nullable), `receipt_file_id` (VARCHAR(36), FK, Nullable), `is_public` (BOOLEAN, Default: true), `created_by` (VARCHAR(36), FK), `created_at` (TIMESTAMP).

12. **`expense_categories`**
    * *Finalidade:* Categorização de despesas (ex: Ração, Veterinário).
    * *Campos:* `id` (VARCHAR(36), PK), `name` (VARCHAR(150)), `icon` (VARCHAR(100)), `color` (VARCHAR(50)), `is_active` (BOOLEAN).

13. **`transparency_reports`**
    * *Finalidade:* Fechamento de relatórios mensais administrativos consolidados.
    * *Campos:* `id` (VARCHAR(36), PK), `month` (INTEGER), `year` (INTEGER), `summary` (TEXT), `total_income` (DECIMAL(10,2)), `total_expense` (DECIMAL(10,2)), `net_balance` (DECIMAL(10,2)), `is_published` (BOOLEAN), `published_at` (TIMESTAMP, Nullable).

14. **`animals`**
    * *Finalidade:* Cadastro de animais acolhidos pelo abrigo.
    * *Campos:* `id` (VARCHAR(36), PK), `name` (VARCHAR(255)), `species` (VARCHAR(50) - ex: 'DOG', 'CAT'), `gender` (VARCHAR(50) - ex: 'MALE', 'FEMALE'), `age` (VARCHAR(100)), `size` (VARCHAR(50) - ex: 'SMALL', 'MEDIUM', 'LARGE'), `status` (VARCHAR(100)), `story` (TEXT), `needs` (TEXT, Nullable), `cover_image_id` (VARCHAR(36), Nullable), `is_public` (BOOLEAN, Default: true), `created_at` (TIMESTAMP).

15. **`animal_images`**
    * *Finalidade:* Galeria de fotos adicionais dos animais.
    * *Campos:* `id` (VARCHAR(36), PK), `animal_id` (VARCHAR(36), FK), `uploaded_file_id` (VARCHAR(36), FK), `display_order` (INTEGER).

16. **`campaigns`**
    * *Finalidade:* Campanhas específicas (reformas, tratamentos cirúrgicos).
    * *Campos:* `id` (VARCHAR(36), PK), `title` (VARCHAR(255)), `slug` (VARCHAR(255), Unique), `description` (TEXT), `goal_amount` (DECIMAL(10,2)), `raised_amount` (DECIMAL(10,2), Default: 0), `status` (VARCHAR(50)), `starts_at` (TIMESTAMP), `ends_at` (TIMESTAMP), `animal_id` (VARCHAR(36), FK, Nullable), `cover_image_id` (VARCHAR(36), FK, Nullable).

17. **`campaign_donations`**
    * *Finalidade:* Vínculo de um pagamento com uma campanha de doação.
    * *Campos:* `id` (VARCHAR(36), PK), `campaign_id` (VARCHAR(36), FK), `payment_id` (VARCHAR(36), FK, Nullable), `pix_donation_id` (VARCHAR(36), FK, Nullable).

18. **`badges`**
    * *Finalidade:* Conquistas virtuais obtidas por doadores.
    * *Campos:* `id` (VARCHAR(36), PK), `name` (VARCHAR(100)), `description` (TEXT), `icon` (VARCHAR(100)), `rule_type` (VARCHAR(50)), `rule_value` (INTEGER).

19. **`donor_badges`**
    * *Finalidade:* Tabela pivô de selos adquiridos.
    * *Campos:* `id` (VARCHAR(36), PK), `donor_id` (VARCHAR(36), FK), `badge_id` (VARCHAR(36), FK), `awarded_at` (TIMESTAMP).

20. **`donor_cards`**
    * *Finalidade:* Emissão e dados da carteirinha digital.
    * *Campos:* `id` (VARCHAR(36), PK), `donor_id` (VARCHAR(36), FK), `card_number` (VARCHAR(100), Unique), `status` (VARCHAR(50)), `qr_code_secret` (VARCHAR(255)), `created_at` (TIMESTAMP).

21. **`public_mural_entries`**
    * *Finalidade:* Registros que constam na listagem pública do Mural de Doadores.
    * *Campos:* `id` (VARCHAR(36), PK), `donor_id` (VARCHAR(36), FK, Nullable), `pix_donation_id` (VARCHAR(36), FK, Nullable), `display_name` (VARCHAR(255)), `plan_name` (VARCHAR(100), Nullable), `impact_months` (INTEGER), `message` (VARCHAR(255), Nullable), `is_visible` (BOOLEAN, Default: true).

22. **`content_pages`**
    * *Finalidade:* Conteúdos institucionais estáticos gerenciáveis.
    * *Campos:* `id` (VARCHAR(36), PK), `slug` (VARCHAR(255), Unique), `title` (VARCHAR(255)), `content` (LONGTEXT), `is_active` (BOOLEAN).

23. **`faq_items`**
    * *Finalidade:* Gerenciamento de perguntas frequentes.
    * *Campos:* `id` (VARCHAR(36), PK), `question` (VARCHAR(255)), `answer` (TEXT), `display_order` (INTEGER), `is_published` (BOOLEAN).

24. **`audit_logs`**
    * *Finalidade:* Registro de alterações e ações administrativas (LGPD / Segurança).
    * *Campos:* `id` (VARCHAR(36), PK), `user_id` (VARCHAR(36), FK, Nullable), `action` (VARCHAR(100)), `entity` (VARCHAR(100)), `entity_id` (VARCHAR(100)), `old_data` (JSON, Nullable), `new_data` (JSON, Nullable), `ip_address` (VARCHAR(45)), `created_at` (TIMESTAMP).

25. **`system_settings`**
    * *Finalidade:* Parâmetros globais do sistema.
    * *Campos:* `id` (VARCHAR(36), PK), `key` (VARCHAR(255), Unique), `value` (TEXT), `description` (TEXT).

26. **`uploaded_files`**
    * *Finalidade:* Registro de uploads vinculados ao Cloudflare R2.
    * *Campos:* `id` (VARCHAR(36), PK), `file_key` (VARCHAR(255)), `bucket_name` (VARCHAR(255)), `mime_type` (VARCHAR(100)), `file_size` (INTEGER), `uploaded_by` (VARCHAR(36), FK, Nullable), `created_at` (TIMESTAMP).

---

## Mapa de APIs e Rotas

### Rotas Públicas (Sem Autenticação)
* `GET /api/v1/public/home` -> Retorna contadores dinâmicos.
* `GET /api/v1/public/plans` -> Lista planos mensais ativos do Asaas.
* `GET /api/v1/public/pix/settings` -> Obtém configuração pública para Pix manual. Chaves Pix são ocultadas se configurado.
* `POST /api/v1/public/donations/pix` -> Cria intenção de doação Pix interno BR Code/EMV.
  * *Entrada:* `donor_name`, `donor_email`, `donor_phone`, `amount`, `wants_public_mural`, `wants_anonymous`, `donor_message`, `campaign_id` (opcional).
  * *Saída:* `id` (UUID), `pix_payload` (Copia e Cola), `pix_qr_code_base64`, `amount`, `receiver_name`, `instructions`, `status` (PIX_GERADO).
* `GET /api/v1/public/donations/pix/:id/status` -> Consulta o status atualizado da doação Pix manual.
* `POST /api/v1/public/donations/pix/:id/mark-as-paid` -> Doador notifica o sistema de que realizou a transferência.
  * *Entrada:* `payment_name` (nome usado no envio), `payment_date` (data/hora aproximada), `note` (comentário).
  * *Saída:* Status alterado para `AGUARDANDO_CONFIRMACAO_MANUAL` ou `COMPROVANTE_ENVIADO` (dependendo do upload).
* `POST /api/v1/public/donations/pix/:id/upload-receipt` -> Upload de comprovante de doação Pix.
  * *Entrada:* Multipart form com arquivo `file` (limite de 5MB, tipos PDF, JPEG, PNG).
  * *Saída:* `receipt_file_id`, status alterado para `COMPROVANTE_ENVIADO`.
* `POST /api/v1/public/donations/onetime` -> Cria cobrança de doação única via Cartão de Crédito ou Boleto **no Asaas**.
* `POST /api/v1/public/donations/subscription` -> Inicia fluxo de assinatura mensal (Asaas).
* `GET /api/v1/public/transparency` -> Balanço consolidado (filtra transações Asaas confirmadas e Pix manuais confirmados).

### Rotas do Doador (Autenticação JWT)
* `GET /api/v1/donor/profile` -> Cadastro e configurações de privacidade.
* `GET /api/v1/donor/donations` -> Histórico mesclado de doações Asaas confirmadas e doações Pix manuais do doador confirmadas administrativamente.

### Rotas Administrativas (Autenticação JWT + Permissões Específicas RBAC)
* **Gerenciamento de Configuração Pix Avulso (Permissão: `PIX_SETTINGS_WRITE`):**
  * `GET /api/v1/admin/pix/settings` -> Retorna as configurações completas e descriptografadas de Pix manual do abrigo.
  * `PUT /api/v1/admin/pix/settings` -> Atualiza as chaves, beneficiário, limites e mensagens da conta Pix.
  * `POST /api/v1/admin/pix/settings/test` -> Gera um payload EMV de teste baseado nos dados fornecidos para validação física.
* **Confirmação e Auditoria de Pix Avulso (Permissão: `PIX_CONFIRM_MANUAL`):**
  * `GET /api/v1/admin/pix/donations` -> Lista paginada de doações manuais Pix com filtros avançados.
  * `GET /api/v1/admin/pix/donations/:id` -> Detalhamento completo da doação manual, log de auditoria associado e link de download do comprovante.
  * `POST /api/v1/admin/pix/donations/:id/confirm` -> Confirma manualmente a recepção do valor.
  * `POST /api/v1/admin/pix/donations/:id/reject` -> Rejeita o lançamento.
    * *Entrada:* `rejection_reason` (texto explicativo).
  * `POST /api/v1/admin/pix/donations/:id/mark-duplicate` -> Define o lançamento como duplicado.
  * `POST /api/v1/admin/pix/donations/:id/request-info` -> Dispara solicitação de e-mail/notificação de comprovante pendente.

---

## Roadmap de Implementação por Fases

Roadmap com a stack baseada no **MySQL** e o fluxo de doação Pix avulso próprio.

---

### Fase 1 — Diagnóstico, Setup e Padronização do Projeto
* **Objetivo:** Estabelecer a estrutura inicial de pastas com Turborepo e preparar o MySQL e Redis locais via Docker.
* **Por que esta fase vem agora:** É a base estrutural que impede problemas de versionamento e inconsistências de infraestrutura local.
* **Escopo da fase:**
  * Setup de workspace Turborepo com gerenciador `pnpm`.
  * Criação dos apps `apps/web` (Next.js), `apps/api` (NestJS) e pacotes compartilhados em `packages/`.
  * Configuração de TypeScript, ESLint e Prettier padronizados no root.
  * **Arquivo `docker-compose.yml` local configurando os serviços de MySQL (imagem `mysql:8.0`) com usuário `root` e senha `CreativeStudio@2026`, exposto na porta 3306, e Redis.**
  * Criação dos arquivos `.env.example` para cada aplicação contendo a string de conexão:
    `DATABASE_URL="mysql://root:CreativeStudio%402026@localhost:3306/lardosanjos"`
* **O que não entra nesta fase:** Modelagem avançada de banco, lógica de negócios ou layout de telas.
* **Arquivos, pastas e módulos envolvidos:** Root config, `docker-compose.yml`, pasta `/apps` e `/packages`.
* **Banco de dados:** Configuração do MySQL 8.0 local.
* **Backend/API:** Setup básico NestJS com endpoint `/health`.
* **Frontend/UI:** Setup Next.js exibindo página de manutenção básica.
* **Integrações externas:** Nenhuma.
* **Testes obrigatórios:** Teste de inicialização do Turborepo e validação da conexão com o banco MySQL local via Docker.
* **Critérios de aceite:**
  * Executar `pnpm build` compila todo o projeto sem erros.
  * MySQL e Redis respondendo localmente via Docker nas credenciais configuradas.
* **Riscos e cuidados:** Cuidar do caractere especial `@` na senha ao definir a string de conexão (deve ser codificado como `%40` na URL do Prisma).

---

### Fase 2 — Modelagem de Dados, Prisma & Migrations Iniciais
* **Objetivo:** Definir e provisionar a estrutura do banco relacional MySQL com Prisma ORM.
* **Por que esta fase vem agora:** Todos os fluxos de autenticação, pagamentos e administração dependem de uma modelagem de dados consistente já estabelecida.
* **Escopo da fase:**
  * Criação do arquivo `schema.prisma` sob o pacote `@lardosanjos/database` utilizando o provedor `provider = "mysql"`.
  * Definição de todas as tabelas detalhadas na seção de Modelo de Dados, incluindo campos, tipos, índices (`@index`) e relacionamentos de chave estrangeira (incluindo as tabelas de Pix manual `pix_settings`, `pix_donations` e `pix_payment_confirmations`).
  * Geração do cliente Prisma compartilhado.
  * Criação e execução da primeira migration (`prisma migrate dev`).
  * Script de Seed inicial preenchendo as tabelas de `roles`, `permissions` (com permissões para Pix administrativo), `expense_categories`, `badges` e um usuário administrador master padrão.
* **O que não entra nesta fase:** CRUDs expostos em controladores ou telas.
* **Arquivos, pastas e módulos envolvidos:** `packages/database/prisma/schema.prisma`, `packages/database/src/seed.ts`.
* **Banco de dados:** Provisionamento de todas as tabelas listadas acima no MySQL.
* **Backend/API:** Integração do módulo de banco de dados no NestJS via módulo global `PrismaService`.
* **Testes obrigatórios:** Execução de migração e validação das tabelas e tipos MySQL gerados.
* **Critérios de aceite:**
  * Seed de banco de dados executado com sucesso inserindo dados base no MySQL local.
  * Migrations aplicadas sem warnings ou quebras estruturais.

---

### Fase 3 — Autenticação, RBAC e Permissões Administrativas
* **Objetivo:** Implementar o fluxo de autenticação seguro para doadores e administradores.
* **Por que esta fase vem agora:** Permite proteger rotas restritas de cadastro de despesas, visualização de dados sensíveis e administração geral antes da construção das interfaces.
* **Escopo da fase:**
  * Módulo de autenticação com Passport e JWT no NestJS.
  * Fluxo de Login (e-mail/senha) gerando Access Token e Refresh Token (armazenado em cookie seguro `HttpOnly`).
  * Controle de acesso baseado em papéis (RBAC) com guards `@UseGuards(JwtAuthGuard, RolesGuard)` no backend.
  * Rotas administrativas protegidas e logs de login.
  * Rota de recuperação de senha baseada em tokens com expiração de 1 hora.
* **O que não entra nesta fase:** Registro público de doadores (este é feito no fluxo de checkout) ou 2FA (será implementado na fase de segurança avançada).
* **Arquivos, pastas e módulos envolvidos:** `apps/api/src/auth/*`, `apps/api/src/users/*`.
* **Banco de dados:** Consultas e escritas nas tabelas `users`, `roles`, `permissions`, `audit_logs` no MySQL.
* **Backend/API:** Endpoints `/api/v1/auth/login`, `/api/v1/auth/refresh`, `/api/v1/auth/recover-password`.
* **Frontend/UI:** Tela simples de login administrativo no app `apps/admin`.
* **Integrações externas:** Configuração inicial do Resend no backend para disparo do e-mail de recuperação de senha.
* **Segurança e LGPD:** Senhas hasheadas com `bcrypt` (12 rounds). Tokens JWT assinados com chaves robustas.
* **Testes obrigatórios:** Teste unitário de login com senha correta/incorreta.
* **Critérios de aceite:**
  * Login concluído com sucesso gerando tokens válidos.
  * Tentativas de acesso a rotas restritas bloqueadas sem o cabeçalho Bearer adequado.

---

### Fase 4 — Design System Base e Utilitários de UI
* **Objetivo:** Estabelecer a identidade visual e componentes atômicos padronizados no monorepo.
* **Por que esta fase vem agora:** Garante uniformidade visual e acelera o desenvolvimento de todas as páginas públicas e áreas administrativas subsequentes.
* **Escopo da fase:**
  * Configuração do Tailwind CSS no pacote compartilhado `@lardosanjos/ui` importando o arquivo `Logo.png` para harmonização da paleta.
  * Instalação do Radix UI via shadcn/ui.
  * Desenvolvimento de componentes base: `Button`, `Input`, `Card`, `Checkbox`, `Dialog`, `Table`, `DropdownMenu`, `Tabs`, `Skeleton`.
  * Criação do layout principal responsivo (Header e Footer) para o portal público.
* **O que não entra nesta fase:** Páginas completas com consumo de dados de API.
* **Arquivos, pastas e módulos envolvidos:** `packages/ui/*`, `apps/web/styles/globals.css`.
* **Testes obrigatórios:** Testes de responsividade em viewports mobile (320px) até desktop (1920px).
* **Critérios de aceite:**
  * Componentes funcionais e estilizados estritamente de acordo com as cores da marca.
  * Layout responsivo (mobile-friendly) estável.

---

### Fase 5 — Integração Base com API do Asaas (Sandbox)
* **Objetivo:** Desenvolver o cliente SDK/Service central de integração com a API do Asaas no backend.
* **Por que esta fase vem agora:** Permite testar a geração de cobranças e assinaturas de forma simulada antes de construir os fluxos de checkout e área do doador.
* **Escopo da fase:**
  * Criação do `AsaasService` em `apps/api` utilizando variáveis de ambiente seguras (`ASAAS_API_KEY`, `ASAAS_API_URL`).
  * Métodos de comunicação direta com Asaas: Criar Cliente, Criar Cobrança Cartão/Boleto, Criar Assinatura Recorrente, Cancelar Assinatura.
* **O que não entra nesta fase:** Geração de cobranças Pix avulsas via Asaas (proibido pela regra de negócios de Pix manual próprio do sistema).
* **Arquivos, pastas e módulos envolvidos:** `apps/api/src/integrations/asaas/*`.
* **Testes obrigatórios:** Testes unitários com mocks de chamadas HTTP contra a API Asaas Sandbox.
* **Critérios de aceite:**
  * Retorno bem-sucedido de IDs de clientes e cobranças válidos nos testes automatizados em Sandbox.

---

### Fase 6 — Geração de Pix Avulso Manual (BR Code/EMV Próprio)
* **Objetivo:** Implementar o fluxo de geração de QR Code e código Copia e Cola Pix diretamente pelo backend, sem intermediário financeiro.
* **Por que esta fase vem agora:** O banco de dados MySQL e as configurações de chaves do abrigo estão prontos. É o primeiro fluxo financeiro avulso do portal de doação.
* **Escopo da fase:**
  * Algoritmo de geração de payload Pix estático no padrão BR Code/EMV.
  * Biblioteca geradora do QR Code em Base64 a partir do payload gerado.
  * Rota pública `POST /api/v1/public/donations/pix` para processamento e criação de registro na tabela `pix_donations` do MySQL com status inicial `PIX_GERADO`.
  * Rota pública `GET /api/v1/public/pix/settings` para resgate de dados básicos permitidos para o doador.
* **O que não entra nesta fase:** Processamento de cartões, assinaturas Asaas ou uploads de comprovantes.
* **Arquivos, pastas e módulos envolvidos:** `apps/api/src/donations/pix-manual/*`, `packages/validators/src/pix-emv.validator.ts`.
* **Banco de dados:** Leitura de `pix_settings` e inserção em `pix_donations` no MySQL.
* **Segurança e LGPD:** Validação de valor mínimo configurado na chave Pix e rate limiting em rotas de geração de payloads para evitar spam de registros.
* **Testes obrigatórios:** Validação de string EMV gerada em leitores oficiais de QR Code do Banco Central.
* **Critérios de aceite:**
  * A chamada do endpoint retorna uma string EMV válida contendo a chave Pix, o valor e a cidade corretos do abrigo.

---

### Fase 7 — Página de Doação Única e Envio de Comprovante Pix
* **Objetivo:** Construir a interface pública de doação única e a recepção de comprovantes Pix pelo doador.
* **Por que esta fase vem agora:** Segue a criação das APIs da Fase 6, fornecendo a interface visual para o fluxo de doação manual Pix e formulário de dados básicos.
* **Escopo da fase:**
  * Página pública `/doar-unica` redesenhada dividindo o fluxo de pagamento: Pix (fluxo próprio) e Cartão/Boleto (Asaas).
  * Formulário Pix coletando nome, e-mail, telefone (opcionais/obrigatórios por configuração) e opção de consentimento para o Mural dos Anjos.
  * Tela de pagamento exibindo QR Code legível, Pix Copia e Cola e botão **Copiar**.
  * Formulário de conclusão pós-transferência (**Já fiz o Pix**) permitindo o upload do arquivo de comprovante (PDF, JPG, PNG até 5MB) direcionado ao Cloudflare R2.
  * Atualização do status local para `COMPROVANTE_ENVIADO` ou `AGUARDANDO_CONFIRMACAO_MANUAL`.
* **O que não entra nesta fase:** Interface de liberação administrativa ou conciliação (fase seguinte).
* **Arquivos, pastas e módulos envolvidos:** `apps/web/app/doar-unica/*`, `apps/api/src/storage/*`.
* **Banco de dados:** Atualização de `pix_donations` com referência ao `uploaded_files` de comprovante.
* **Segurança e LGPD:** Validação estrita do tipo Mime e tamanho máximo de arquivo no backend para evitar XSS/malwares no upload de imagens.
* **Critérios de aceite:**
  * O doador preenche os dados, realiza o Pix fictício, envia o comprovante de pagamento e o sistema transita o status da doação com sucesso no banco de dados.

---

### Fase 8 — Checkout de Cartão e Boleto Avulsos (Com Asaas)
* **Objetivo:** Concluir as outras formas de pagamento do checkout único integrando com o Asaas para Cartão de Crédito e Boleto Bancário.
* **Por que esta fase vem agora:** Com o fluxo Pix manual concluído na Fase 7, esta fase fecha o leque de doações pontuais da página de checkout de doação única.
* **Escopo da fase:**
  * Endpoint `/api/v1/public/donations/onetime` integrado ao Asaas.
  * Formulário de Cartão de Crédito com validação de número, validade e CVV.
  * Emissão de link de faturamento de Boleto Bancário via Asaas.
  * Salvamento na tabela local `payments` do MySQL com status inicial `PENDING`.
* **O que não entra nesta fase:** Assinaturas recorrentes mensais.
* **Arquivos, pastas e módulos envolvidos:** `apps/api/src/payments/onetime-asaas/*`, frontend correspondente.
* **Banco de dados:** Escrita na tabela relacional `payments` no MySQL.
* **Testes obrigatórios:** Simulação de cartão recusado e boleto gerado.
* **Critérios de aceite:**
  * Doação por cartão é concluída gerando registro de pagamento Asaas pendente ou aprovado localmente.

---

### Fase 9 — Checkout de Doação Mensal (Assinaturas Asaas)
* **Objetivo:** Implementar o checkout recorrente para assinaturas mensais e planos de apoio.
* **Por que esta fase vem agora:** Permite capturar apoiadores contínuos ("Anjos") de forma automática utilizando a infraestrutura recorrente do Asaas.
* **Escopo da fase:**
  * Rota pública `/api/v1/public/donations/subscription` (Asaas).
  * Integração com planos da tabela `donation_plans`.
  * Criação local do registro na tabela `subscriptions` do MySQL com status `PENDING`.
  * UI de Checkout de Assinatura estruturado em etapas claras com animação suave usando Framer Motion.
* **O que não entra nesta fase:** Alteração ou cancelamento de planos pelo doador (fluxo pós-login).
* **Arquivos, pastas e módulos envolvidos:** `apps/api/src/subscriptions/*`, `apps/web/app/seja-um-anjo/*`.
* **Banco de dados:** Alterações e inclusões em `donors`, `subscriptions` e `payments` no MySQL.
* **Testes obrigatórios:** Cenários de cartão aprovado, cartão recusado por falta de limite, e falhas de conexão de rede.
* **Critérios de aceite:**
  * Assinatura criada com sucesso no Asaas e banco de dados local sincronizado com IDs e status iniciais.

---

### Fase 10 — Webhooks Asaas e Idempotência
* **Objetivo:** Processar notificações em tempo real enviadas pelo Asaas para cartões, boletos e assinaturas.
* **Por que esta fase vem agora:** Garante a confirmação automática dos pagamentos iniciados nos checkouts Asaas das Fases 8 e 9.
* **Escopo da fase:**
  * Endpoint de recebimento de webhook `/api/v1/integration/asaas/webhook`.
  * Salvamento bruto do payload na tabela `asaas_webhook_events` do MySQL para auditoria e controle de idempotência (baseado no `event_id`).
  * Processamento assíncrono utilizando filas Redis/BullMQ.
  * Atualização dos status das tabelas `payments` e `subscriptions` locais nos eventos do Asaas.
* **O que não entra nesta fase:** Confirmação de Pix manual (que não passa pelo Asaas).
* **Arquivos, pastas e módulos envolvidos:** `apps/api/src/integrations/webhooks/*`, fila BullMQ correspondente.
* **Banco de dados:** Escrita em `asaas_webhook_events`, `payments`, `subscriptions` no MySQL.
* **Testes obrigatórios:** Simulação de webhooks duplicados e fora de ordem cronológica.
* **Critérios de aceite:**
  * Webhook recebido é registrado na fila, processado uma única vez e atualiza com sucesso os status locais de pagamento.

---

### Fase 11 — Área do Doador: Dashboard, Impacto e Histórico
* **Objetivo:** Disponibilizar a área logada restrita aos apoiadores para visualização do seu histórico de impacto.
* **Por que esta fase vem agora:** O doador já tem condições de ver o histórico mesclado de suas contribuições Asaas e Pix manuais validadas.
* **Escopo da fase:**
  * Login e Dashboard do Doador com resumo financeiro.
  * Listagem paginada de histórico de pagamentos contendo doações Asaas e Pix manuais confirmadas.
  * Área de dados pessoais e formulário de preferências de privacidade LGPD.
* **O que não entra nesta fase:** Carteirinha digital e alteração de planos (fases subsequentes).
* **Arquivos, pastas e módulos envolvidos:** `apps/web/app/dashboard/*`, `apps/api/src/donors/*`.
* **Banco de dados:** Consultas detalhadas em `donors`, `payments`, `pix_donations` do MySQL.
* **Backend/API:** Endpoints `/api/v1/donor/profile` e `/api/v1/donor/donations` (mescla consultas a `payments` e `pix_donations` confirmadas).
* **Testes obrigatórios:** Validação de que Pix manuais com status `PIX_GERADO` ou `REJEITADO` não aparecem na listagem pública ou de impacto do doador.
* **Critérios de aceite:**
  * Doador visualiza apenas seu próprio histórico de contribuições autorizadas.

---

### Fase 12 — Gestão de Assinaturas, Upgrade e Cancelamento
* **Objetivo:** Permitir a autogestão de planos recorrentes (Asaas) pelo doador na sua área privativa.
* **Por que esta fase vem agora:** É o complemento necessário para evitar sobrecarga operacional na administração com solicitações manuais de alteração e cancelamento de assinaturas.
* **Escopo da fase:**
  * Interface para alteração de plano de doação (upgrade/downgrade).
  * Atualização da forma de pagamento (dados do cartão de crédito) sincronizada com o Asaas.
  * Fluxo de cancelamento direto e transparente sem dark patterns, integrado à API de cancelamento do Asaas.
* **O que não entra nesta fase:** Painel administrativo de controle de faturamento em lote.
* **Arquivos, pastas e módulos envolvidos:** `apps/web/app/dashboard/assinatura/*`, rotas de atualização em `apps/api/src/subscriptions/*`.
* **Banco de dados:** Alterações de status nas assinaturas locais do MySQL.
* **Critérios de aceite:**
  * Assinatura cancelada pelo doador interrompe cobranças no Asaas Sandbox e atualiza o banco local para `CANCELED`.

---

### Fase 13 — Carteirinha Digital do Doador
* **Objetivo:** Criar e disponibilizar a carteirinha digital de identificação para os doadores ativos.
* **Por que esta fase vem agora:** Depende dos fluxos de pagamento e perfil do doador estarem consolidados para gerar o QR Code de validação com dados reais.
* **Escopo da fase:**
  * Renderização visual da Carteirinha com design premium (glassmorphism, gradientes da marca, foto de avatar opcional, número de membro e selos do plano).
  * Geração do QR Code único contendo link criptografado.
  * Rota pública de validação: `/anjo/validar/:cardNumber` que consulta a API e exibe o status de membro ativo/inativo para terceiros.
  * Opções de download da carteirinha nos formatos PNG e PDF.
* **O que não entra nesta fase:** Carteira física de plástico ou carteira integrada ao Apple Wallet/Google Wallet.
* **Arquivos, pastas e módulos envolvidos:** `apps/web/app/dashboard/carteirinha/*`, `apps/api/src/cards/*`.
* **Banco de dados:** Gravação e leitura em `donor_cards` no MySQL.
* **Critérios de aceite:**
  * Leitura do QR Code por dispositivo móvel redireciona para a página de validação pública e atesta a validade da filiação.

---

### Fase 14 — Admin: Configurações de Pix Avulso Próprio
* **Objetivo:** Criar o módulo administrativo para configurar a conta, chaves Pix e regras de aceitação de Pix manual do abrigo.
* **Por que esta fase vem agora:** Permite à equipe do abrigo alterar a chave Pix pública e definir parâmetros antes da implantação da tela de homologação manual.
* **Escopo da fase:**
  * Interface administrativa "Configurações de Pix Avulso" sob a permissão `PIX_SETTINGS_WRITE`.
  * Campos para configurar: Beneficiário, Cidade, Chave Pix, Tipo da chave, Limite mínimo, valores rápidos de seleção e mensagens públicas de agradecimento e instruções.
  * Integração de log de auditoria registrando cada modificação destas configurações no MySQL (quem alterou, data e valores antigos/novos).
  * Botão de teste gerando visualização física de QR Code de validação.
* **O que não entra nesta fase:** Análise e confirmação de doações específicas.
* **Arquivos, pastas e módulos envolvidos:** `apps/admin/app/configuracoes/pix/*`, `apps/api/src/admin/pix-settings/*`.
* **Banco de dados:** CRUD e auditoria na tabela `pix_settings` do MySQL.
* **Testes obrigatórios:** Verificação de bloqueio de edição por usuários sem permissão `PIX_SETTINGS_WRITE`.
* **Critérios de aceite:**
  * Alterações salvas refletem no banco de dados local de produção e atualizam instantaneamente o payload Pix gerado no checkout público.

---

### Fase 15 — Admin: Confirmação de Doações Pix (Painel de Auditoria)
* **Objetivo:** Implementar o painel administrativo de aprovação, rejeição e conciliação manual de doações Pix do sistema.
* **Por que esta fase vem agora:** As doações manuais Pix estão sendo registradas pelo checkout público, demandando a tela de liberação operacional e financeira.
* **Escopo da fase:**
  * Interface "Confirmação de Doações Pix" com tabela de lançamentos pendentes, comprovantes carregados para download seguro e dados de pagamento.
  * Filtros de pesquisa por status, período, e-mail/nome, e doações com/sem comprovantes.
  * Ações de administrador: **Confirmar Pagamento** (transita status para `CONFIRMADO_MANUALMENTE` e insere na transparência/mural), **Rejeitar Pagamento** (com campo de motivo da rejeição) e **Marcar como Duplicado**.
  * Vinculação da doação manual a um doador do sistema já cadastrado ou criação de novo doador a partir dos dados fornecidos no Pix.
* **O que não entra nesta fase:** Conciliação automatizada via integração com extratos.
* **Arquivos, pastas e módulos envolvidos:** `apps/admin/app/financeiro/pix-confirm/*`, `apps/api/src/admin/pix-donations/*`.
* **Banco de dados:** Alterações em `pix_donations`, `public_mural_entries`, `pix_payment_confirmations`, `transparency_reports` no MySQL.
* **Segurança e LGPD:** Restrição rígida de confirmação apenas para usuários com permissão `PIX_CONFIRM_MANUAL`.
* **Critérios de aceite:**
  * O administrador clica em Confirmar, a doação Pix transita de status no banco de dados e o valor é contabilizado na transparência do portal público.

---

### Fase 16 — Portal de Transparência Público e Prestação de Contas
* **Objetivo:** Disponibilizar a prestação de contas pública na interface com gráficos e relatórios, unificando receitas reais.
* **Por que esta fase vem agora:** O banco de dados MySQL já possui balanços reais do Asaas (confirmados) e Pix avulsos (confirmados administrativamente), permitindo relatórios íntegros.
* **Escopo da fase:**
  * Página pública `/transparencia` com barra de progresso de meta e gráficos dinâmicos de categoria de gastos.
  * Lista de despesas públicas cadastradas com comprovantes de pagamento legíveis e relatórios mensais fechados exportáveis em PDF.
  * Garantia matemática de que o portal contabiliza apenas receitas confirmadas (Asaas pago + Pix avulso marcado como `CONFIRMADO_MANUALMENTE`).
* **O que não entra nesta fase:** Cadastro de despesas por interface administrativa (feito na fase seguinte).
* **Arquivos, pastas e módulos envolvidos:** `apps/web/app/transparencia/*`, `apps/api/src/transparency/*`.
* **Banco de dados:** Queries otimizadas de soma e agregação filtrando status válidos nas tabelas `payments`, `pix_donations`, `expenses` do MySQL.
* **Testes obrigatórios:** Validação de que doações manuais em análise ou rejeitadas não incrementam de forma alguma os totais do portal.
* **Critérios de aceite:**
  * Balanço financeiro público exibe valores exatos correspondentes à soma dos pagamentos reais validados.

---

### Fase 17 — Painel Admin: Gestão de Despesas e Lançamentos
* **Objetivo:** Implementar o controle administrativo de despesas e categorias de custos do abrigo.
* **Por que esta fase vem agora:** Habilita os gestores a alimentar a transparência com notas fiscais, despesas e fechar os balanços financeiros mensais.
* **Escopo da fase:**
  * Formulário de lançamento de despesa (título, categoria, valor, data, fornecedor, observação interna/pública e upload de comprovante de pagamento).
  * Vinculação de comprovante físico armazenado no Cloudflare R2.
  * Módulo de Conciliação Asaas para comparar registros locais e pagamentos na API do Asaas.
  * Gerador de fechamento de relatórios mensais consolidando totais arrecadados e gastos.
* **O que não entra nesta fase:** Cadastro de animais e campanhas.
* **Arquivos, pastas e módulos envolvidos:** `apps/admin/app/financeiro/*`, `apps/api/src/expenses/*`, `apps/api/src/storage/*`.
* **Banco de dados:** Escrita em `expenses`, `expense_categories`, `transparency_reports`, `uploaded_files` no MySQL.
* **Critérios de aceite:**
  * Administrador cadastrando despesa com nota fiscal atualiza em tempo real o portal público de transparência.

---

### Fase 18 — Gestão de Animais e Histórias de Adoção
* **Objetivo:** Implementar o catálogo público e gerenciador de animais resgatados pelo abrigo.
* **Por que esta fase vem agora:** Completa a seção institucional do site público, conectando os animais acolhidos com as doações e campanhas ativas.
* **Escopo da fase:**
  * Cadastro administrativo de animais (Nome, espécie, porte, gênero, idade aproximada, status de adoção/tratamento, história e galeria de fotos).
  * Upload de múltiplas imagens para galeria com ordenação de exibição.
  * Página pública de lista de animais (/animais) com filtros por espécie e porte.
  * Página interna pública do animal com CTA para apadrinhamento e formulário de contato para adoção.
* **O que não entra nesta fase:** Campanhas em andamento.
* **Arquivos, pastas e módulos envolvidos:** `apps/admin/app/animais/*`, `apps/web/app/animais/*`, `apps/api/src/animals/*`.
* **Banco de dados:** Escrita e leitura em `animals`, `animal_images` no MySQL.
* **Critérios de aceite:**
  * Novo animal cadastrado na área administrativa é exibido instantaneamente com todas as suas fotos no portal público.

---

### Fase 19 — Gestão de Campanhas Específicas e Mural dos Anjos
* **Objetivo:** Implementar as campanhas de arrecadação emergencial (com suporte a doação Asaas ou Pix manual) e o Mural público de apoiadores.
* **Por que esta fase vem agora:** Permite relacionar pagamentos de doação única a metas específicas e recompensar os doadores elegíveis com o Mural dos Anjos e selos de conquistas.
* **Escopo da fase:**
  * CRUD administrativo de Campanhas (meta financeira, data limite, animal vinculado e imagem de capa).
  * Página de campanha pública (/campanhas) com barra de progresso visual de arrecadação conectando doações Asaas e Pix manuais confirmados para a campanha.
  * Página pública `/mural` listando apoiadores que deram consentimento LGPD para aparecer.
  * Cron de auditoria automática de atribuição de selos de constância a doadores logados.
* **O que não entra nesta fase:** Páginas estáticas institucionais.
* **Arquivos, pastas e módulos envolvidos:** `apps/admin/app/campanhas/*`, `apps/web/app/campanhas/*`, `apps/api/src/campaigns/*`.
* **Banco de dados:** Gravação de dados em `campaigns`, `campaign_donations`, `public_mural_entries`, `badges`, `donor_badges` no MySQL.
* **Testes obrigatórios:** Simulação de doações manuais Pix confirmadas e doações automáticas Asaas incrementando juntas a meta da campanha.
* **Critérios de aceite:**
  * A confirmação de pagamentos Asaas ou manual Pix vinculados à campanha atualiza instantaneamente a barra de progresso da campanha correspondente.

---

### Fase 20 — SEO, FAQs e Setup PWA
* **Objetivo:** Otimizar o portal para indexação em buscadores (SEO) e empacotar a aplicação como Progressive Web App (PWA).
* **Por que esta fase vem agora:** Prepara a plataforma para ser descoberta na web e facilita o atalho de acesso mobile para doadores recorrentes.
* **Escopo da fase:**
  * Páginas estáticas geradas via ISR (Incremental Static Regeneration) do Next.js.
  * Metadados SEO OpenGraph e JSON-LD Schema.org estruturado.
  * Manifesto de PWA (`manifest.json`) com cores, ícones e Service Worker cacheando assets de layout críticos para permitir uso standalone.
* **O que não entra nesta fase:** Notificações Push nativas em PWA.
* **Arquivos, pastas e módulos envolvidos:** `apps/web/public/*`, `apps/web/next.config.js`.
* **Testes obrigatórios:** Auditoria completa com Google Lighthouse buscando pontuações acima de 90 em SEO, PWA e Acessibilidade.
* **Critérios de aceite:**
  * O portal exibe o banner de instalação standalone nativo no celular e apresenta velocidade de carregamento ágil.

---

### Fase 21 — Segurança, Auditoria e Homologação E2E
* **Objetivo:** Adicionar mecanismos de segurança robustos (logs de auditoria, rate limits, 2FA financeiro) e homologar o sistema com testes Playwright de ponta a ponta.
* **Por que esta fase vem agora:** Garante a estabilidade e conformidade da plataforma antes de publicá-la em ambiente real de produção.
* **Escopo da fase:**
  * Rate limiting integrado em rotas críticas (geração de QR Code Pix e login administrativo).
  * Autenticação de dois fatores (2FA/MFA via e-mail ou autenticador) para administradores financeiros.
  * Logs de auditoria na tabela `audit_logs` no MySQL para conformidade com a LGPD.
  * Fluxo de testes E2E Playwright cobrindo doações via cartão (Asaas) e Pix manual próprio.
* **O que não entra nesta fase:** Manutenção em ambiente de produção com transações reais de alto valor.
* **Arquivos, pastas e módulos envolvidos:** `packages/testing-e2e/*`, interceptores do backend.
* **Banco de dados:** Registros em `audit_logs` do MySQL.
* **Testes obrigatórios:** Simulação de brute force em logins e testes E2E Playwright completos de transações.
* **Critérios de aceite:**
  * 100% dos testes Playwright executados com sucesso no pipeline de integração contínua.

---

### Fase 22 — Deploy, Monitoramento e Produção
* **Objetivo:** Provisionar e publicar a plataforma no ambiente de produção configurando ferramentas de monitoramento em tempo real.
* **Por que esta fase vem agora:** Fase final de entrega do sistema ao cliente e público real.
* **Escopo da fase:**
  * CI/CD via GitHub Actions implantando o backend em nuvem VPS/Railway com Docker e frontend na Vercel.
  * Migração de chaves do Asaas para o ambiente real de produção.
  * **Backup periódico automático do MySQL utilizando o utilitário `mysqldump` a cada 12 horas, salvando no Cloudflare R2 com retenção de 30 dias.**
  * Setup de monitoramento de erros em produção (Sentry) e logs integrados.
* **O que não entra nesta fase:** Novas funcionalidades no escopo de código.
* **Banco de dados:** Banco de dados MySQL de produção provisionado com todas as migrations aplicadas.
* **Integrações externas:** Asaas em modo produção, Pix em modo real e Envio real de e-mails.
* **Critérios de aceite:**
  * Domínio `lardosanjos.online` configurado e ativo. Plataforma recebendo doações reais e registrando de forma segregada no painel admin.

---

## Estratégia de Testes

### Matriz de Testes para Cenários Críticos

| Cenário Crítico | Tipo de Teste | Ação de Entrada | Comportamento Esperado no Sistema |
| :--- | :--- | :--- | :--- |
| **Geração de Pix Válido**| Integração | Doação única via Pix solicitada com R$ 10. | Payload EMV estático é gerado pelo backend. CRC16 validado. QR Code renderiza. Status `PIX_GERADO`. |
| **Pix Abaixo do Mínimo** | Validação/API | Doação única Pix enviada com valor R$ 0,50. | Backend valida contra `min_amount` (ex: R$ 1,00) de `pix_settings`. Retorna HTTP `400 Bad Request`. |
| **Envio de Comprovante** | Integração | Doador envia comprovante em PDF de 2MB. | Upload direcionado para pasta restrita do Cloudflare R2. Registro em `uploaded_files`. Status da doação atualiza para `COMPROVANTE_ENVIADO`. |
| **Tipo de Arquivo Inválido**| Segurança/API| Upload de comprovante contendo script `.sh`. | Backend recusa o upload baseado na verificação MIME real. Retorna HTTP `400 Bad Request`. |
| **Confirmação Manual** | E2E | Admin clica em Confirmar no painel de Pix. | Status muda para `CONFIRMADO_MANUALMENTE`. Registro em `pix_payment_confirmations`. Valor é computado na transparência e Mural de doadores. |
| **Rejeição com Motivo** | E2E | Admin clica em Rejeitar e preenche motivo. | Status atualizado para `REJEITADO`. Motivo gravado em `rejection_reason`. Total de receitas de transparência não é alterado. |
| **Pix Pendente na Transparência**| Lógica | Consulta à página pública `/transparencia`. | Consulta relatórios. Apenas Pix com status `CONFIRMADO_MANUALMENTE` e pagamentos Asaas confirmados são somados. Pix pendente/rejeitado é desconsiderado. |
| **Rate Limit Pix** | Segurança | Tentativa de gerar 20 payloads Pix em 30 segundos. | Rate limiter de IP bloqueia as requisições subsequentes. Retorna HTTP `429 Too Many Requests`. |
| **Pix Anônimo no Mural** | Lógica | Confirmar doação de doador anônimo opt-in. | Mural exibe entrada pública contendo apenas a string "Anjo Anônimo" e data, ocultando o nome informado. |
| **Visualização de Comprovante**| Segurança/RBAC| Usuário sem permissão financeira tenta ver nota/comprovante. | API barra requisição HTTP com erro `403 Forbidden` e gera log em `audit_logs` registrando a tentativa. |
| **Duplicidade Manual** | Lógica | Admin marca pagamento Pix como duplicado. | Status muda para `DUPLICADO`. Histórico auditado em `pix_payment_confirmations`. Registro é inativado para cálculos financeiros. |

---

## Plano de Produção e Operação

### Ambientes do Sistema
1. **Local:** Ambiente de desenvolvimento rodando no computador dos desenvolvedores com Docker local rodando MySQL 8.0 e Redis.
2. **Desenvolvimento (Staging):** Ambiente em nuvem espelhado com Asaas em modo Sandbox para testes integrados contínuos de cartões/recorrências e chaves Pix de teste, conectado a um banco MySQL de homologação.
3. **Produção:** Servidores escaláveis de alta performance apontando para a conta comercial oficial ativa do Asaas, banco MySQL gerenciado em nuvem com criptografia de disco e chaves Pix ativas do abrigo.

### Variáveis de Ambiente Críticas
* **Backend:**
  * `DATABASE_URL` -> URL de conexão ao MySQL. Exemplo local: `mysql://root:CreativeStudio%402026@localhost:3306/lardosanjos` (nota: caractere `@` da senha codificado como `%40`).
  * `REDIS_URL` -> String de conexão para fila BullMQ.
  * `ASAAS_API_KEY` -> Chave privada para comunicação com Asaas.
  * `ASAAS_API_URL` -> URL da API (https://sandbox.asaas.com ou https://api.asaas.com).
  * `ASAAS_WEBHOOK_SECRET` -> Token de segurança para validação do webhook.
  * `JWT_SECRET` e `JWT_REFRESH_SECRET` -> Chaves de assinatura criptográfica.
  * `CLOUDFLARE_R2_ACCESS_KEY` / `CLOUDFLARE_R2_SECRET_KEY` -> Chaves de acesso ao Storage de notas e comprovantes Pix.
* **Frontend:**
  * `NEXT_PUBLIC_API_URL` -> Domínio público da API backend.
  * `NEXT_PUBLIC_APP_URL` -> Domínio próprio do site/PWA.

---

## Checklist Final de Sistema Pronto para Produção

### 🛡️ Segurança e LGPD
- [ ] HTTPS ativado forçado em todas as rotas com redirecionamento de HTTP.
- [ ] Chave de API do Asaas e secrets de banco de dados MySQL isolados de arquivos do repositório Git.
- [ ] Headers de segurança HTTP ativos (CORS restrito e Helmet no NestJS).
- [ ] Registro de logs de auditoria gravando ações de criação e edição administrativa (incluindo conciliações Pix manuais).
- [ ] Termo de Política de Privacidade e Aceite de Termos de Uso explícitos no fluxo de checkout.
- [ ] Checkboxes de opt-in de mural desmarcados por padrão.
- [ ] Upload de comprovantes Pix restrito a diretórios privados sem acesso público no Cloudflare R2.

### 💰 Financeiro & Integração
- [ ] Chaves de API de Produção do Asaas ativas e configuradas.
- [ ] URL do Webhook do Asaas registrada no painel da conta real.
- [ ] Chave Pix oficial do abrigo devidamente cadastrada e validada em `pix_settings` do MySQL de produção.
- [ ] Dashboard financeiro administrativo exibindo de forma clara e separada as receitas confirmadas Asaas, as doações confirmadas manualmente Pix avulso e as despesas públicas/internas.
- [ ] Fila Redis/BullMQ rodando em modo de fila persistente.

---

## Roadmap Futuro para PWA Avançado e App Mobile Nativo
* **Push Notifications (PWA):** Integração com a Push API para enviar alertas de animais adotados, campanhas ou relatórios financeiros publicados.
* **Offline Completo para Carteirinha:** Cache de Service Worker que garante a renderização offline da carteirinha digital.
* **Integração Open Finance/Extratos Bancários:** Mapeamento futuro de extratos em formato OFX/CNAB ou webhooks de APIs de bancos tradicionais para automatizar a liquidação dos registros de doações Pix avulsas, dispensando a confirmação 100% manual.

---

## Apêndice — Prompts Futuros por Fase

Abaixo constam os prompts estruturados e prontos para serem fornecidos sequencialmente para o Antigravity implementar o sistema fase por fase, utilizando o banco de dados MySQL local.

---

### Prompt da Fase 1
```markdown
Implemente a Fase 1 (Setup e Padronização do Monorepo) conforme o plano de implementação Lar dos Anjos Pet.
Crie a estrutura de pastas Turborepo utilizando pnpm workspaces.
Inicialize 'apps/web' com Next.js (App Router, Tailwind CSS, TypeScript), 'apps/api' com NestJS (usando Fastify e TypeScript) e configure as pastas de pacotes compartilhados em 'packages/' para UI, Database, Validators e Types.
Configure as dependências do ESLint, Prettier e TypeScript de forma unificada no root do projeto.
Crie um docker-compose.yml na raiz configurando o serviço de MySQL (imagem 'mysql:8.0') com usuário root e password 'CreativeStudio@2026' exposto na porta 3306 local, além do Redis para cache e filas.
A API NestJS deve possuir um endpoint público '/health' retornando status do servidor.
Forneça o arquivo .env.example para cada aplicação contendo a conexão de banco: 'DATABASE_URL="mysql://root:CreativeStudio%402026@localhost:3306/lardosanjos"'.
Não quebre o projeto em hipótese alguma. Após finalizar, verifique executando os comandos de build e dev e me forneça a lista de arquivos alterados e instruções de validação manual.
```

---

### Prompt da Fase 2
```markdown
Implemente a Fase 2 (Modelagem de Dados e Prisma com Tabelas de Pix Manual em MySQL) conforme o plano de implementação Lar dos Anjos Pet.
No pacote compartilhado '@lardosanjos/database', crie o arquivo 'schema.prisma' detalhando todas as tabelas requeridas no modelo de dados, respeitando o provedor 'provider = "mysql"'. Utilize os tipos JSON nativos do MySQL para colunas que requerem estruturas dinâmicas.
Certifique-se de incluir as tabelas dedicadas ao fluxo Pix manual interno: 'pix_settings', 'pix_donations' e 'pix_payment_confirmations'.
Gere o Prisma Client compartilhado para o monorepo.
Crie um script de Seed inicial em 'packages/database/src/seed.ts' para inserir perfis administrativos base (roles, permissions, incluindo permissões de Pix manual e configurações), categorias de despesas, selos de gamificação padrão e um usuário admin master inicial com senha hasheada de teste.
Integre o módulo de banco de dados no NestJS via PrismaService global e execute as migrations iniciais contra o banco MySQL local de desenvolvimento (rodando na porta 3306 com usuário root e senha 'CreativeStudio@2026').
```

---

### Prompt da Fase 3
```markdown
Implemente a Fase 3 (Autenticação, RBAC e Segurança Administrativa com MySQL) conforme o plano de implementação Lar dos Anjos Pet.
No backend NestJS ('apps/api'), configure autenticação JWT utilizando Passport.
Implemente rotas de login por e-mail e senha, refresh token seguro utilizando cookies HttpOnly e envio de recuperação de senha baseada em tokens.
As senhas devem ser hasheadas com bcrypt no banco de dados.
Crie guards do NestJS para validação de JWT e papéis administrativos baseados em permissões (RBAC).
No app Next.js administrativo ('apps/admin'), crie uma tela simples e responsiva de login utilizando os componentes base do design system e valide a autenticação salvando a sessão do administrador de forma segura.
Acesso ao MySQL deve ser feito utilizando o cliente Prisma com a conexão 'mysql://root:CreativeStudio%402026@localhost:3306/lardosanjos'.
Qualquer tentativa de acesso sem token válido nas rotas restritas deve retornar HTTP 401 ou 403.
Forneça a lista de rotas autenticadas criadas e o fluxo de testes.
```

---

### Prompt da Fase 4
```markdown
Implemente a Fase 4 (Design System Base e Layouts Públicos) conforme o plano de implementação Lar dos Anjos Pet.
No pacote compartilhado '@lardosanjos/ui', configure o Tailwind CSS e integre o Radix UI via shadcn/ui.
Defina a paleta de cores oficial baseada na logo (#2AA98C para verde principal, #D1EDE5 verde claro, #7BBAA9 verde secundário, #B9895D caramelo, #6A4F36 marrom escuro e #F7FBF9 para fundo).
Desenvolva os componentes de UI atômicos padronizados: Button, Input, Card, Checkbox, Dialog, Table, DropdownMenu, Tabs, Skeleton.
No frontend público ('apps/web'), implemente o layout global responsivo contendo o Header e Footer completos.
O Header deve possuir menu interativo e botão "Quero ajudar agora" destacado, comportando-se como fixo na rolagem.
Ganta acessibilidade de contraste de cores no design. Forneça o link de preview dos componentes criados e testes de responsividade visual realizados.
```

---

### Prompt da Fase 5
```markdown
Implemente a Fase 5 (Módulo de Integração Base Asaas) conforme o plano de implementação Lar dos Anjos Pet.
No backend NestJS ('apps/api'), crie um serviço estruturado 'AsaasService' para comunicação com a API do Asaas.
Utilize variáveis de ambiente seguras (ASAAS_API_KEY, ASAAS_API_URL).
Implemente os métodos para criar cliente no Asaas, criar cobrança de cartão e boleto e criar/cancelar assinaturas recorrentes.
Lembre-se que de acordo com a nova regra de negócios, o Asaas não deve conter nenhum método relacionado a doações únicas via Pix.
Escreva testes unitários cobrindo as chamadas principais do AsaasService mockando respostas da API externa.
Forneça a lista de serviços implementados e o resultado dos testes unitários concluídos.
```

---

### Prompt da Fase 6
```markdown
Implemente a Fase 6 (Geração de Pix Avulso Manual BR Code/EMV com MySQL) conforme o plano de implementação Lar dos Anjos Pet.
No backend ('apps/api'), desenvolva a rota pública 'POST /api/v1/public/donations/pix' e o endpoint 'GET /api/v1/public/pix/settings'.
Implemente o algoritmo próprio de geração de payload Pix estático no padrão BR Code/EMV (cópia e cola) utilizando os dados da conta cadastrada na tabela 'pix_settings' do MySQL local.
Integre a biblioteca de renderização para retornar o QR Code correspondente em formato Base64.
O endpoint de geração de Pix avulso deve criar um registro em 'pix_donations' com status 'PIX_GERADO' e gerar uma chave única TXID para conciliação.
Escreva testes unitários para validar a string EMV gerada garantindo integridade dos campos de valor, chave e cidade do recebedor.
```

---

### Prompt da Fase 7
```markdown
Implemente a Fase 7 (Interface de Doação Única Pix e Upload de Comprovantes) conforme o plano de implementação Lar dos Anjos Pet.
No frontend público ('apps/web'), configure a página '/doar-unica' integrando com as APIs de Pix avulso criadas na Fase 6.
A interface deve guiar o usuário na geração do Pix manual mostrando o QR Code, Pix Copia e Cola, valor, dados do beneficiário e instruções configuradas.
Adicione um fluxo pós-transferência interativo ('Já fiz o Pix') permitindo o envio de comprovante bancário (imagem/PDF até 5MB) para upload direto ao Cloudflare R2 restrito.
Atualize o status local da doação no banco MySQL para 'COMPROVANTE_ENVIADO' ou 'AGUARDANDO_CONFIRMACAO_MANUAL'.
Garante validação rígida de tipos MIME no backend de upload.
Apresente a estrutura de arquivos e mostre os testes manuais de upload concluídos.
```

---

### Prompt da Fase 8
```markdown
Implemente a Fase 8 (Checkout de Cartão e Boleto Avulsos com Asaas) conforme o plano de implementação Lar dos Anjos Pet.
No frontend público ('apps/web') e backend ('apps/api'), conclua as outras abas da página de doação única avulsa.
Para doações únicas via Cartão de Crédito e Boleto, implemente a integração com o AsaasService gerando a cobrança no gateway.
Salve o registro local na tabela 'payments' do MySQL local com status inicial 'PENDING'.
Garanta que os dados do cartão de crédito sejam tokenizados com segurança e nunca persistidos no banco local.
Descreva as APIs afetadas e os testes de erros de cartão de crédito recusado executados no Sandbox do Asaas.
```

---

### Prompt da Fase 9
```markdown
Implemente a Fase 9 (Checkout de Doação Mensal e Assinaturas Asaas em MySQL) conforme o plano de implementação Lar dos Anjos Pet.
No backend ('apps/api'), crie a rota pública '/api/v1/public/donations/subscription'.
Integre com os planos definidos no banco MySQL local na tabela 'donation_plans'.
Conecte com a API Asaas para criar assinaturas recorrentes com suporte a cartão de crédito e Pix recorrente/automático no Sandbox.
Crie os registros locais correlacionados em 'subscriptions' com status PENDING no MySQL.
No frontend ('apps/web'), implemente a interface "/seja-um-anjo" em passos guiados com animação de progresso usando Framer Motion.
Forneça detalhes dos testes de faturamento de assinatura em Sandbox concluídos e os arquivos afetados no repositório.
```

---

### Prompt da Fase 10
```markdown
Implemente a Fase 10 (Processamento de Webhooks Asaas e Idempotência com MySQL) conforme o plano de implementação Lar dos Anjos Pet.
No backend ('apps/api'), implemente a rota pública '/api/v1/integration/asaas/webhook' protegida por token no Header.
Salve o payload cru em 'asaas_webhook_events' do MySQL local utilizando lógica de idempotência baseado na chave de evento única do Asaas e responda HTTP 200 OK imediatamente.
Enfileire o processamento de forma assíncrona utilizando Redis e BullMQ.
O worker de fila deve atualizar os status locais de 'payments' e 'subscriptions' no MySQL nos eventos de pagamento recebido, vencimento, cancelamento e falha de faturamento.
Escreva testes de webhook simulando webhooks repetidos ou fora de ordem cronológica.
```

---

### Prompt da Fase 11
```markdown
Implemente a Fase 11 (Área do Doador: Dashboard, Impacto e Histórico com MySQL) conforme o plano de implementação Lar dos Anjos Pet.
No backend ('apps/api'), crie rotas privadas '/api/v1/donor/profile' e '/api/v1/donor/donations' autenticadas por JWT.
A listagem de doações deve mesclar os registros de pagamentos confirmados do Asaas ('payments') e as doações manuais Pix ('pix_donations') do MySQL local que foram confirmadas manualmente pela administração.
No frontend público ('apps/web'), desenvolva a Área do Doador (/dashboard) com dados estatísticos dinâmicos ("Total doado", "Tempo de apoio", "Seu impacto") e preferências de privacidade LGPD.
Valide o isolamento de tenant. Apresente as telas criadas e os testes de segurança rodados.
```

---

### Prompt da Fase 12
```markdown
Implemente a Fase 12 (Gestão de Assinaturas e Cancelamento Seguro Asaas com MySQL) conforme o plano de implementação Lar dos Anjos Pet.
Na Área do Doador no frontend ('apps/web'), crie a aba 'Minha Assinatura'.
Adicione fluxos simplificados de Upgrade/Downgrade de planos recorrentes do Asaas e atualização dos dados do cartão de faturamento.
Implemente a opção de pausar temporariamente a recorrência por 1 a 3 meses ou cancelar definitivamente a assinatura mensal em no máximo 3 cliques sem o uso de barreiras manipulativas.
Dispare notificações de encerramento por e-mail via Resend.
Mostre a árvore de arquivos criados e os testes de transação de cancelamento efetuados em Sandbox.
```

---

### Prompt da Fase 13
```markdown
Implemente a Fase 13 (Carteirinha Digital do Doador com MySQL) conforme o plano de implementação Lar dos Anjos Pet.
No backend ('apps/api'), crie o módulo de emissão de carteirinhas na tabela 'donor_cards' contendo hash único e número de membro no MySQL.
Crie a rota pública '/api/v1/public/cards/:cardNumber' para validação rápida do status da filiação sem expor dados pessoais sensíveis.
No frontend ('apps/web'), implemente a carteirinha digital no dashboard com visual premium (efeito 3D, cores da logo e QR Code gerado em tempo real).
Crie as páginas públicas de validação de QR Code e implemente botões para exportar a carteirinha como imagem PNG ou baixar em PDF.
Apresente as rotas criadas e os testes de renderização concluídos.
```

---

### Prompt da Fase 14
```markdown
Implemente a Fase 14 (Admin: Configurações de Pix Avulso Próprio em MySQL) conforme o plano de implementação Lar dos Anjos Pet.
No app administrativo ('apps/admin'), sob a permissão 'PIX_SETTINGS_WRITE', implemente a tela de configuração de Pix avulso.
Desenvolva o formulário para cadastro e validação dos dados de chave Pix do abrigo, beneficiário, cidade, limites de valor e instruções públicas, gravando no MySQL local.
As chaves Pix sensíveis devem ser protegidas no banco.
A cada atualização de dados na tabela 'pix_settings', salve logs de auditoria em 'audit_logs' registrando o usuário logado e valores modificados.
Adicione um botão de simulação para gerar e testar a string EMV e o QR Code gerado.
Mostre o funcionamento da interface e a árvore de arquivos alterados.
```

---

### Prompt da Fase 15
```markdown
Implemente a Fase 15 (Admin: Confirmação de Doações Pix e Conciliação com MySQL) conforme o plano de implementação Lar dos Anjos Pet.
No painel administrativo ('apps/admin'), sob a permissão 'PIX_CONFIRM_MANUAL', desenvolva a tela de homologação de Pix.
A interface deve conter tabelas filtráveis de doações Pix com status 'COMPROVANTE_ENVIADO' ou 'AGUARDANDO_CONFIRMACAO_MANUAL' do MySQL local e permitir download seguro do comprovante do R2.
Crie as ações para Confirmar Pagamento (status 'CONFIRMADO_MANUALMENTE'), Rejeitar Pagamento (inserindo justificativa obrigatória) e Marcar como Duplicado.
Garanta que a confirmação registre dados do admin responsável em 'pix_payment_confirmations' e libere a doação na transparência e no Mural de doadores.
Forneça os testes unitários da transição de status do Pix manual.
```

---

### Prompt da Fase 16
```markdown
Implemente a Fase 16 (Portal de Transparência Público e Prestação de Contas com MySQL) conforme o plano de implementação Lar dos Anjos Pet.
No frontend ('apps/web'), crie a página pública '/transparencia'.
Implemente a exibição da meta de arrecadação do mês, custos diários e gráficos dinâmicos.
Desenvolva a listagem pública de despesas com comprovantes e relatórios mensais exportáveis em PDF.
A query de receitas no backend ('apps/api') deve unificar e somar apenas pagamentos Asaas recebidos com sucesso e doações manuais Pix do MySQL local com status 'CONFIRMADO_MANUALMENTE'.
Doações Pix pendentes, geradas ou rejeitadas não devem em hipótese alguma ser computadas.
Mostre o resultado dos testes de integridade financeira realizados.
```

---

### Prompt da Fase 17
```markdown
Implemente a Fase 17 (Painel Admin: Lançamento de Despesas e Relatórios com MySQL) conforme o plano de implementação Lar dos Anjos Pet.
No app administrativo ('apps/admin'), sob a permissão 'FINANCE_WRITE', crie as telas de gestão financeira.
Desenvolva o formulário de cadastro de despesa, incluindo campos de categoria, data, fornecedor, valor, descrição e upload de comprovante de pagamento direcionado ao R2, salvando no MySQL.
Implemente o fechamento administrativo do relatório mensal e o dashboard de receitas dividindo Asaas, Pix manual verificado e despesas.
Descreva as tabelas alteradas e os cenários de testes de segurança RBAC aplicados.
```

---

### Prompt da Fase 18
```markdown
Implemente a Fase 18 (Módulo de Animais e Histórias de Adoção com MySQL) conforme o plano de implementação Lar dos Anjos Pet.
No backend ('apps/api') e frontend ('apps/web'), desenvolva a gestão e exibição pública de animais.
Crie a tela de cadastro administrativo de animais e suas fotos (salvas no R2 em formato WebP) no MySQL.
Desenvolva a página pública de lista de animais (/animais) com filtros de busca e a página interna do pet com formulário seguro de manifestação de interesse em adoção (com Turnstile).
Forneça a lista de rotas criadas e os testes de integração do formulário de adoção executados.
```

---

### Prompt da Fase 19
```markdown
Implemente a Fase 19 (Gestão de Campanhas e Mural dos Anjos em MySQL) conforme o plano de implementação Lar dos Anjos Pet.
Crie o gerenciador de campanhas emergenciais no painel admin e a página pública correspondente no MySQL.
A barra de progresso da campanha deve somar doações Asaas e Pix manuais confirmados vinculados à campanha.
Desenvolva a página pública do Mural dos Anjos (/mural) exibindo de forma elegante os apoiadores e seus selos.
Implemente o cron job no backend para atribuição automática de selos de engajamento baseados no histórico de doações.
Apresente os componentes criados e mostre os testes de regras de gamificação concluídos.
```

---

### Prompt da Fase 20
```markdown
Implemente a Fase 20 (SEO, FAQs e Setup PWA com MySQL) conforme o plano de implementação Lar dos Anjos Pet.
Configure a geração dinâmica com ISR (Incremental Static Regeneration) do Next.js para páginas estáticas de FAQ e Institucionais resgatadas do MySQL.
Estruture metadados SEO e configure a geração automatizada do sitemap.xml.
Configure a transformação do portal público e área do doador em um Progressive Web App (PWA) ativo e instalável offline via Service Worker customizado cacheando assets críticos.
Mostre a pontuação alcançada no Lighthouse do Google e os arquivos alterados.
```

---

### Prompt da Fase 21
```markdown
Implemente a Fase 21 (Segurança Avançada e Homologação E2E com Playwright) conforme o plano de implementação Lar dos Anjos Pet.
No backend ('apps/api'), configure o Rate Limiting para rotas públicas críticas de geração de Pix e login.
Implemente o log de auditoria detalhado na tabela 'audit_logs' do MySQL local e o 2FA obrigatório para administradores financeiros no painel admin ('apps/admin').
Desenvolva a suíte de testes E2E no Playwright simulando doações Asaas e geração/comprovante/confirmação manual do Pix avulso.
Mostre o relatório de testes concluídos no pipeline de CI/CD.
```

---

### Prompt da Fase 22
```markdown
Implemente a Fase 22 (CI/CD, Deploy de Produção e Monitoramento com MySQL) conforme o plano de implementação Lar dos Anjos Pet.
Crie as esteiras de integração e implantação contínuas (CI/CD) usando GitHub Actions.
Configure o deploy do Next.js na Vercel e o NestJS/Redis/MySQL em containers Docker em ambiente de nuvem de produção.
Configure ferramentas de monitoramento de erros (Sentry) e backups automatizados do banco com utilitário mysqldump para o R2 a cada 12 horas.
Migre variáveis de ambiente para a conta real de produção (Asaas e chave Pix oficial) e realize teste de transação simbólica.
Apresente o guia de monitoramento e links de saúde da plataforma ativa.
```
