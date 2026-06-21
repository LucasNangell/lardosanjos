'use client';

import * as React from 'react';
import Link from 'next/link';
import { StatCard, EmptyState, LoadingState, Alert, Badge } from '@lardosanjos/ui';
import {
  billingTypeLabel,
  DonationItem,
  DonorImpact,
  fetchDonorDonations,
  fetchDonorImpact,
  formatBRL,
} from '@/lib/donor-api';
import { DonorApiError } from '@/lib/donor-auth';

export default function DashboardPage() {
  const [impact, setImpact] = React.useState<DonorImpact | null>(null);
  const [donations, setDonations] = React.useState<DonationItem[]>([]);
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    Promise.all([fetchDonorImpact(), fetchDonorDonations()])
      .then(([impactData, donationsData]) => {
        setImpact(impactData);
        setDonations(donationsData.items.slice(0, 5));
      })
      .catch((err) =>
        setError(err instanceof DonorApiError ? err.message : 'Erro ao carregar'),
      )
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState message="Carregando seu impacto..." />;

  if (error) {
    return <Alert variant="destructive">{error}</Alert>;
  }

  if (!impact) return null;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-heading text-2xl font-bold text-brand-brown">Olá!</h1>
        <p className="mt-1 text-sm text-brand-text/70">
          Obrigado por apoiar o Lar dos Anjos Pet. Aqui está um resumo do seu impacto confirmado.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total confirmado" value={formatBRL(impact.total_confirmed)} />
        <StatCard
          label="Meses de apoio"
          value={String(impact.support_months)}
          hint="Com base em assinaturas e recorrências confirmadas"
        />
        <StatCard
          label="Plano atual"
          value={impact.current_plan?.name ?? 'Nenhum'}
          hint={
            impact.current_plan
              ? formatBRL(impact.current_plan.value) + '/mês'
              : 'Sem assinatura ativa'
          }
        />
        <StatCard
          label="Próxima cobrança"
          value={impact.next_billing_date ?? '—'}
          hint="Somente assinaturas ativas"
        />
      </div>

      {impact.badges.length > 0 && (
        <section>
          <h2 className="font-heading text-lg font-semibold text-brand-brown">Selos</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {impact.badges.map((badge) => (
              <Badge key={badge.id} variant="accent">
                {badge.name}
              </Badge>
            ))}
          </div>
        </section>
      )}

      <Alert>{impact.pending_note}</Alert>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-heading text-lg font-semibold text-brand-brown">
            Doações recentes confirmadas
          </h2>
          <Link href="/dashboard/doacoes" className="text-sm text-brand-primary underline">
            Ver todas
          </Link>
        </div>

        {donations.length === 0 ? (
          <EmptyState
            title="Nenhuma doação confirmada ainda"
            description="Quando suas doações forem confirmadas (Pix manual ou pagamentos Asaas), elas aparecerão aqui."
          />
        ) : (
          <ul className="divide-y divide-brand-primary-light rounded-xl border border-brand-primary-light bg-white">
            {donations.map((item) => (
              <li
                key={`${item.source}-${item.id}`}
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
              >
                <div>
                  <p className="font-medium text-brand-brown">
                    {formatBRL(item.value)} · {billingTypeLabel(item.billing_type)}
                  </p>
                  <p className="text-xs text-brand-text/60">
                    {item.source === 'pix' ? 'Pix confirmado' : 'Asaas'} ·{' '}
                    {new Date(item.paid_at ?? item.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <Badge variant="success">Confirmado</Badge>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
