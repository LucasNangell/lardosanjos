'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Alert,
  Button,
  EmptyState,
  LoadingState,
  buttonVariants,
} from '@lardosanjos/ui';
import { DonorMembershipCard } from '@/components/donor/DonorMembershipCard';
import {
  copyToClipboard,
  exportCardAsPdf,
  exportCardAsPng,
  shareWhatsApp,
} from '@/lib/card-export';
import {
  DonorCardData,
  fetchDonorCard,
  generateDonorCard,
} from '@/lib/donor-api';
import { DonorApiError } from '@/lib/donor-auth';

export default function CarteirinhaPage() {
  const cardRef = React.useRef<HTMLDivElement>(null);
  const [card, setCard] = React.useState<DonorCardData | null>(null);
  const [message, setMessage] = React.useState('');
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [generating, setGenerating] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const [exporting, setExporting] = React.useState<'png' | 'pdf' | null>(null);

  const load = React.useCallback(() => {
    setLoading(true);
    setError('');
    fetchDonorCard()
      .then((result) => {
        setCard(result.card);
        setMessage(result.message ?? '');
      })
      .catch((err) =>
        setError(err instanceof DonorApiError ? err.message : 'Erro ao carregar carteirinha'),
      )
      .finally(() => setLoading(false));
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  async function handleGenerate() {
    setGenerating(true);
    setError('');
    try {
      const result = await generateDonorCard();
      setCard(result.card);
      setMessage('');
    } catch (err) {
      setError(err instanceof DonorApiError ? err.message : 'Não foi possível gerar a carteirinha');
    } finally {
      setGenerating(false);
    }
  }

  async function handleExportPng() {
    if (!cardRef.current || !card) return;
    setExporting('png');
    try {
      await exportCardAsPng(cardRef.current, `carteirinha-${card.card_number}.png`);
    } finally {
      setExporting(null);
    }
  }

  async function handleExportPdf() {
    if (!cardRef.current || !card) return;
    setExporting('pdf');
    try {
      await exportCardAsPdf(cardRef.current, `carteirinha-${card.card_number}.pdf`);
    } finally {
      setExporting(null);
    }
  }

  async function handleCopyLink() {
    if (!card) return;
    await copyToClipboard(card.validation_url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  function handleShareWhatsApp() {
    if (!card) return;
    shareWhatsApp(
      `Sou anjo do Lar dos Anjos Pet! Valide minha carteirinha:`,
      card.validation_url,
    );
  }

  if (loading) {
    return <LoadingState message="Carregando carteirinha..." />;
  }

  if (error && !card) {
    return <Alert variant="destructive">{error}</Alert>;
  }

  if (!card) {
    return (
      <div className="space-y-4">
        <header>
          <h1 className="font-heading text-2xl font-bold text-brand-brown">Carteirinha digital</h1>
          <p className="mt-1 text-sm text-brand-text/70">
            Identificação exclusiva para assinantes mensais com assinatura ativa confirmada.
          </p>
        </header>
        <EmptyState
          title="Carteirinha indisponível"
          description={
            message ||
            'Assine um plano mensal e aguarde a confirmação do pagamento para emitir sua carteirinha.'
          }
        />
        <div className="flex flex-wrap gap-3">
          <Link href="/seja-um-anjo" className={buttonVariants()}>
            Conhecer planos
          </Link>
          <Button type="button" variant="outline" onClick={handleGenerate} disabled={generating}>
            {generating ? 'Verificando...' : 'Tentar gerar'}
          </Button>
        </div>
        {error && <Alert variant="destructive">{error}</Alert>}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-bold text-brand-brown">Carteirinha digital</h1>
        <p className="mt-1 text-sm text-brand-text/70">
          Apresente seu QR Code para validação pública. Pix avulso não substitui assinatura mensal
          ativa.
        </p>
      </header>

      {!card.valid && (
        <Alert>
          Sua carteirinha está {card.status_label.toLowerCase()}. Benefícios de assinante dependem de
          pagamento mensal confirmado.
        </Alert>
      )}

      {error && <Alert variant="destructive">{error}</Alert>}

      <div className="flex flex-col items-center gap-6 lg:flex-row lg:items-start">
        <DonorMembershipCard ref={cardRef} card={card} />

        <div className="w-full max-w-md space-y-3">
          <h2 className="font-heading text-lg font-semibold text-brand-brown">Ações</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            <Button
              type="button"
              onClick={handleExportPng}
              disabled={exporting !== null}
            >
              {exporting === 'png' ? 'Gerando PNG...' : 'Baixar PNG'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleExportPdf}
              disabled={exporting !== null}
            >
              {exporting === 'pdf' ? 'Gerando PDF...' : 'Baixar PDF'}
            </Button>
            <Button type="button" variant="outline" onClick={handleShareWhatsApp}>
              Compartilhar WhatsApp
            </Button>
            <Button type="button" variant="outline" onClick={handleCopyLink}>
              {copied ? 'Link copiado!' : 'Copiar link'}
            </Button>
          </div>
          {!card.valid && (
            <Button type="button" onClick={handleGenerate} disabled={generating}>
              {generating ? 'Atualizando...' : 'Reemitir carteirinha'}
            </Button>
          )}
          <p className="text-xs text-brand-text/60">
            O link público valida sua filiação sem expor CPF, e-mail, telefone ou endereço.
          </p>
        </div>
      </div>
    </div>
  );
}
