'use client';

import * as React from 'react';
import { StatCard, Badge, LoadingState, Alert, EmptyState } from '@lardosanjos/ui';
import { DonorImpact, fetchDonorImpact, formatBRL } from '@/lib/donor-api';
import { DonorApiError } from '@/lib/donor-auth';

export default function MeuImpactoPage() {
  const [impact, setImpact] = React.useState<DonorImpact | null>(null);
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetchDonorImpact()
      .then(setImpact)
      .catch((err) =>
        setError(err instanceof DonorApiError ? err.message : 'Erro ao carregar'),
      )
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState message="Calculando seu impacto..." />;

  if (error) return <Alert variant="destructive">{error}</Alert>;

  if (!impact) return null;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-heading text-2xl font-bold text-brand-brown">Meu impacto</h1>
        <p className="mt-1 text-sm text-brand-text/70">
          Seu impacto reflete apenas doações confirmadas — nunca valores pendentes ou rejeitados.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard
          label="Total doado (confirmado)"
          value={formatBRL(impact.total_confirmed)}
        />
        <StatCard
          label="Meses de apoio"
          value={String(impact.support_months)}
          hint="Estimativa com base em recorrências confirmadas"
        />
      </div>

      {impact.current_plan ? (
        <div className="rounded-xl border border-brand-primary-light bg-white p-5">
          <h2 className="font-heading font-semibold text-brand-brown">Plano mensal ativo</h2>
          <p className="mt-2 text-brand-primary text-xl font-bold">
            {impact.current_plan.name} · {formatBRL(impact.current_plan.value)}/mês
          </p>
          {impact.next_billing_date && (
            <p className="mt-1 text-sm text-brand-text/70">
              Próxima cobrança: {impact.next_billing_date}
            </p>
          )}
        </div>
      ) : (
        <EmptyState
          title="Sem assinatura ativa"
          description="Assinaturas pendentes de confirmação não aparecem como plano ativo."
        />
      )}

      {impact.badges.length > 0 ? (
        <section>
          <h2 className="font-heading text-lg font-semibold text-brand-brown">Selos conquistados</h2>
          <ul className="mt-3 space-y-2">
            {impact.badges.map((badge) => (
              <li
                key={badge.id}
                className="flex items-center justify-between rounded-lg border border-brand-primary-light px-4 py-3"
              >
                <div>
                  <p className="font-medium text-brand-brown">{badge.name}</p>
                  {badge.description && (
                    <p className="text-sm text-brand-text/70">{badge.description}</p>
                  )}
                </div>
                <Badge variant="accent">
                  {new Date(badge.awarded_at).toLocaleDateString('pt-BR')}
                </Badge>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <EmptyState
          title="Nenhum selo ainda"
          description="Continue apoiando o abrigo para desbloquear reconhecimentos especiais."
        />
      )}

      <Alert>{impact.pending_note}</Alert>
    </div>
  );
}
