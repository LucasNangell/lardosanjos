'use client';

import * as React from 'react';
import { Badge, EmptyState, LoadingState, Alert } from '@lardosanjos/ui';
import {
  billingTypeLabel,
  DonationItem,
  fetchDonorDonations,
  formatBRL,
} from '@/lib/donor-api';
import { DonorApiError } from '@/lib/donor-auth';

export default function DoacoesPage() {
  const [items, setItems] = React.useState<DonationItem[]>([]);
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetchDonorDonations()
      .then((data) => setItems(data.items))
      .catch((err) =>
        setError(err instanceof DonorApiError ? err.message : 'Erro ao carregar'),
      )
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState message="Carregando histórico..." />;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-bold text-brand-brown">Minhas doações</h1>
        <p className="mt-1 text-sm text-brand-text/70">
          Apenas doações confirmadas aparecem aqui. Pix pendente, rejeitado ou pagamentos Asaas
          não confirmados ficam de fora.
        </p>
      </header>

      {error && <Alert variant="destructive">{error}</Alert>}

      {items.length === 0 ? (
        <EmptyState
          title="Nenhuma doação confirmada"
          description="Suas contribuições confirmadas pelo abrigo ou pelo gateway aparecerão nesta lista."
        />
      ) : (
        <ul className="divide-y divide-brand-primary-light rounded-xl border border-brand-primary-light bg-white">
          {items.map((item) => (
            <li key={`${item.source}-${item.id}`} className="px-4 py-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-lg font-semibold text-brand-primary">
                    {formatBRL(item.value)}
                  </p>
                  <p className="text-sm text-brand-text/80">
                    {billingTypeLabel(item.billing_type)} ·{' '}
                    {item.type === 'RECURRING' ? 'Recorrente' : 'Avulsa'}
                  </p>
                  <p className="mt-1 text-xs text-brand-text/60">
                    Origem: {item.source === 'pix' ? 'Pix interno' : 'Asaas'} · Confirmado em{' '}
                    {new Date(item.paid_at ?? item.created_at).toLocaleString('pt-BR')}
                  </p>
                </div>
                <Badge variant="success">Confirmado</Badge>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
