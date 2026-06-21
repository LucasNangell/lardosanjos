export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: 'doacoes' | 'privacidade' | 'geral';
}

export const FAQ_ITEMS: FaqItem[] = [
  {
    id: 'pix-confirmacao',
    category: 'doacoes',
    question: 'Quando minha doação Pix avulsa aparece no site?',
    answer:
      'Doações via Pix avulso são geradas internamente pelo nosso sistema (sem Asaas). Elas só entram na transparência e no progresso de campanhas após confirmação manual da equipe financeira, quando o comprovante é validado.',
  },
  {
    id: 'asaas-recorrente',
    category: 'doacoes',
    question: 'Como funcionam as assinaturas mensais?',
    answer:
      'Assinaturas mensais são processadas via Asaas (cartão ou boleto). Você pode alterar o plano ou cancelar a qualquer momento pela área do doador. Pagamentos pendentes não são contabilizados como confirmados.',
  },
  {
    id: 'cancelamento',
    category: 'doacoes',
    question: 'Posso cancelar minha assinatura?',
    answer:
      'Sim. Acesse sua área do doador, vá em Assinatura e solicite o cancelamento. O acesso aos benefícios permanece até o fim do ciclo já pago.',
  },
  {
    id: 'mural-privacidade',
    category: 'privacidade',
    question: 'Quem aparece no Mural dos Anjos?',
    answer:
      'Somente doadores que deram consentimento explícito. Você pode optar por anonimato (exibido como "Anjo Anônimo"). Valores nunca são exibidos publicamente.',
  },
  {
    id: 'dados-lgpd',
    category: 'privacidade',
    question: 'Como solicito exclusão ou exportação dos meus dados?',
    answer:
      'Entre em contato pelo e-mail privacidade@lardosanjos.online ou use as opções na área do doador em Privacidade. Atendemos solicitações conforme a LGPD.',
  },
  {
    id: 'transparencia',
    category: 'geral',
    question: 'Onde vejo como o dinheiro é usado?',
    answer:
      'No Portal de Transparência publicamos receitas confirmadas (Asaas recebido/confirmado e Pix avulso confirmado manualmente) e despesas categorizadas.',
  },
  {
    id: 'voluntariado',
    category: 'geral',
    question: 'Como posso ser voluntário?',
    answer:
      'Visite a página Voluntariado e preencha o formulário de interesse. Nossa equipe entrará em contato conforme a demanda e disponibilidade.',
  },
  {
    id: 'adoção',
    category: 'geral',
    question: 'Como adotar um animal?',
    answer:
      'Conheça os animais disponíveis em /animais e envie o formulário de interesse na página de cada pet. A equipe fará triagem e retorno.',
  },
];
