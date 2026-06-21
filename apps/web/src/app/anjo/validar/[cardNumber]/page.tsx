'use client';

import * as React from 'react';
import Link from 'next/link';
import { Alert, LoadingState, buttonVariants } from '@lardosanjos/ui';
import { PublicValidationCard } from '@/components/donor/DonorMembershipCard';
import { PublicCardValidation, validatePublicCard } from '@/lib/donor-api';

export default function ValidarCarteirinhaPage({
  params,
  searchParams,
}: {
  params: { cardNumber: string };
  searchParams: { t?: string };
}) {
  const [result, setResult] = React.useState<PublicCardValidation | null>(null);
  const [loading, setLoading] = React.useState(true);

  const cardNumber = decodeURIComponent(params.cardNumber);
  const token = searchParams.t;

  React.useEffect(() => {
    validatePublicCard(cardNumber, token)
      .then(setResult)
      .finally(() => setLoading(false));
  }, [cardNumber, token]);

  if (loading) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <LoadingState message="Validando carteirinha..." />
      </div>
    );
  }

  if (!result?.valid) {
    return (
      <div className="mx-auto max-w-lg space-y-6 px-4 py-16">
        <Alert variant="destructive">
          {result?.message ?? 'Carteirinha não encontrada ou inativa.'}
        </Alert>
        <p className="text-center text-sm text-brand-text/70">
          Escaneie o QR Code original ou solicite um novo link ao doador.
        </p>
        <div className="text-center">
          <Link href="/" className={buttonVariants({ variant: 'outline' })}>
            Voltar ao site
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 px-4 py-10">
      <PublicValidationCard
        displayName={result.display_name ?? 'Anjo'}
        planName={result.plan_name ?? null}
        memberSince={result.member_since ?? ''}
        statusLabel={result.status_label ?? 'Membro ativo'}
        cardNumber={result.card_number ?? cardNumber}
        badges={result.badges ?? []}
      />
      <p className="text-center text-xs text-brand-text/60">
        Validação pública — nenhum dado sensível é exibido nesta página.
      </p>
      <div className="text-center">
        <Link href="/seja-um-anjo" className={buttonVariants()}>
          Quero ser um anjo também
        </Link>
      </div>
    </div>
  );
}
