'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Button,
  Card,
  CardTitle,
  CardContent,
  Alert,
  LoadingState,
  Badge,
  EmptyState,
  buttonVariants,
} from '@lardosanjos/ui';
import {
  billingTypeLabel,
  DonorSubscription,
  fetchDonorSubscription,
  formatBRL,
} from '@/lib/donor-api';
import { DonorApiError } from '@/lib/donor-auth';

export default function AssinaturaPage() {
  const [data, setData] = React.useState<DonorSubscription | null | undefined>();
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetchDonorSubscription()
      .then((res) => setData(res.subscription))
      .catch((err) =>
        setError(err instanceof DonorApiError ? err.message : 'Erro ao carregar'),
      )
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState message="Carregando assinatura..." />;

  if (error) return <Alert variant="destructive">{error}</Alert>;

  if (!data) {
    return (
      <div className="space-y-4 text-center">
        <EmptyState
          title="Nenhuma assinatura ativa"
          description="Você ainda não possui uma assinatura mensal confirmada."
        />
        <Link href="/seja-um-anjo" className={buttonVariants()}>
          Conhecer planos
        </Link>
      </div>
    );
  }

  const isActive = data.status === 'ACTIVE';

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-bold text-brand-brown">Minha assinatura</h1>
        <p className="mt-1 text-sm text-brand-text/70">
          Gerencie seu apoio mensal de forma transparente — sem burocracia para cancelar.
        </p>
      </header>

      <Card>
        <CardTitle>{data.plan.name}</CardTitle>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-2xl font-bold text-brand-primary">
              {formatBRL(data.value)}
              <span className="text-sm font-normal text-brand-text/60">/mês</span>
            </p>
            <Badge variant={isActive ? 'success' : 'warning'}>
              {isActive ? 'Ativa' : data.status}
            </Badge>
          </div>

          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-brand-text/60">Forma de pagamento</dt>
              <dd className="font-medium">{billingTypeLabel(data.billing_type)}</dd>
            </div>
            <div>
              <dt className="text-brand-text/60">Próxima cobrança</dt>
              <dd className="font-medium">{data.next_due_date ?? '—'}</dd>
            </div>
          </dl>

          {data.consequences && (
            <Alert>
              <p>{data.consequences.future_charges}</p>
              <p className="mt-1">{data.consequences.card_status}</p>
            </Alert>
          )}

          <div className="grid gap-2 sm:grid-cols-2">
            <Link
              href="/dashboard/assinatura/alterar-plano"
              className={buttonVariants({ variant: 'outline', className: 'text-center' })}
            >
              Alterar plano
            </Link>
            {data.billing_type === 'CREDIT_CARD' && (
              <Link
                href="/dashboard/assinatura/pagamento"
                className={buttonVariants({ variant: 'outline', className: 'text-center' })}
              >
                Atualizar cartão
              </Link>
            )}
          </div>

          <div className="border-t border-brand-primary-light pt-4">
            <Link
              href="/dashboard/assinatura/cancelar"
              className="text-sm text-brand-text/70 underline hover:text-brand-brown"
            >
              Cancelar assinatura
            </Link>
            <p className="mt-1 text-xs text-brand-text/50">
              Cancelamento em poucos cliques, sem precisar falar conosco.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
