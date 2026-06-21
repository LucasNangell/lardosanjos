'use client';

import * as React from 'react';
import Link from 'next/link';
import { AdminLayout } from '../../../components/AdminLayout';
import { hasPermission, useAuthGuard } from '../../../lib/auth';
import { apiFetch, ApiError } from '../../../lib/api';

type ReconciliationItem = {
  id: string;
  asaas_payment_id: string;
  billing_type: string;
  local_status: string;
  local_value: number;
  asaas_status: string | null;
  asaas_mapped_status: string | null;
  mismatch: boolean;
  fetch_error: string | null;
  paid_at: string | null;
  created_at: string;
};

type Reconciliation = {
  items: ReconciliationItem[];
  summary: {
    total: number;
    mismatches: number;
    pix_manual_included: boolean;
    note: string;
  };
};

function money(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function ConciliacaoAsaasPage() {
  const { loading, user } = useAuthGuard();
  const [data, setData] = React.useState<Reconciliation | null>(null);
  const [error, setError] = React.useState('');
  const [filters, setFilters] = React.useState({
    from: '',
    to: '',
    limit: '50',
  });

  const canRead = hasPermission(user, 'FINANCE_READ');

  const loadData = React.useCallback(async () => {
    const params = new URLSearchParams();
    if (filters.from) params.set('from', filters.from);
    if (filters.to) params.set('to', filters.to);
    if (filters.limit) params.set('limit', filters.limit);

    const result = await apiFetch<Reconciliation>(
      `/admin/finance/asaas-reconciliation?${params.toString()}`,
    );
    setData(result);
  }, [filters]);

  React.useEffect(() => {
    if (!user || !canRead) return;
    loadData().catch((err) =>
      setError(err instanceof ApiError ? err.message : 'Erro ao carregar'),
    );
  }, [user, canRead, loadData]);

  if (loading || !user) return <div style={{ padding: '2rem' }}>Carregando...</div>;

  return (
    <AdminLayout user={user}>
      <Link href="/financeiro" style={{ color: '#2AA98C' }}>
        ← Financeiro
      </Link>
      <h1 style={{ color: '#6A4F36', marginTop: 8 }}>Conciliação Asaas</h1>
      <p style={{ color: '#666' }}>
        Compara pagamentos locais (Asaas) com o status na API. Pix avulso manual não entra nesta
        conciliação.
      </p>
      {error && <p style={{ color: '#b71c1c' }}>{error}</p>}

      <div
        style={{
          background: '#fff',
          padding: '1rem',
          borderRadius: 8,
          marginBottom: '1rem',
          display: 'flex',
          gap: '0.75rem',
          flexWrap: 'wrap',
          alignItems: 'flex-end',
        }}
      >
        <label>
          De
          <input
            type="date"
            value={filters.from}
            onChange={(e) => setFilters({ ...filters, from: e.target.value })}
            style={{ display: 'block', marginTop: 4 }}
          />
        </label>
        <label>
          Até
          <input
            type="date"
            value={filters.to}
            onChange={(e) => setFilters({ ...filters, to: e.target.value })}
            style={{ display: 'block', marginTop: 4 }}
          />
        </label>
        <label>
          Limite
          <input
            type="number"
            min={1}
            max={100}
            value={filters.limit}
            onChange={(e) => setFilters({ ...filters, limit: e.target.value })}
            style={{ display: 'block', marginTop: 4, width: 80 }}
          />
        </label>
        <button
          type="button"
          onClick={() => loadData().catch(() => setError('Erro ao atualizar'))}
          style={{
            background: '#6A4F36',
            color: '#fff',
            border: 'none',
            padding: '0.5rem 1rem',
            borderRadius: 6,
            cursor: 'pointer',
          }}
        >
          Atualizar
        </button>
      </div>

      {data && (
        <>
          <div style={{ marginBottom: '1rem', color: '#666', fontSize: '0.9rem' }}>
            {data.summary.total} registros — {data.summary.mismatches} divergências.{' '}
            {data.summary.note}
          </div>
          <table style={{ width: '100%', background: '#fff', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f5f5f5', textAlign: 'left' }}>
                <th style={{ padding: 8 }}>Asaas ID</th>
                <th style={{ padding: 8 }}>Tipo</th>
                <th style={{ padding: 8 }}>Valor</th>
                <th style={{ padding: 8 }}>Status local</th>
                <th style={{ padding: 8 }}>Status Asaas</th>
                <th style={{ padding: 8 }}>Divergência</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item) => (
                <tr
                  key={item.id}
                  style={{
                    background: item.mismatch ? '#fff3e0' : undefined,
                  }}
                >
                  <td style={{ padding: 8, borderTop: '1px solid #eee', fontSize: '0.85rem' }}>
                    {item.asaas_payment_id}
                  </td>
                  <td style={{ padding: 8, borderTop: '1px solid #eee' }}>
                    {item.billing_type}
                  </td>
                  <td style={{ padding: 8, borderTop: '1px solid #eee' }}>
                    {money(item.local_value)}
                  </td>
                  <td style={{ padding: 8, borderTop: '1px solid #eee' }}>
                    {item.local_status}
                  </td>
                  <td style={{ padding: 8, borderTop: '1px solid #eee' }}>
                    {item.fetch_error ||
                      (item.asaas_status
                        ? `${item.asaas_status} → ${item.asaas_mapped_status}`
                        : '—')}
                  </td>
                  <td style={{ padding: 8, borderTop: '1px solid #eee' }}>
                    {item.mismatch ? 'Sim' : 'Não'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </AdminLayout>
  );
}
