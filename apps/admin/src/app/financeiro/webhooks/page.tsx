'use client';

import * as React from 'react';
import { Button } from '@lardosanjos/ui';
import { AdminLayout } from '../../../components/AdminLayout';
import { hasPermission, useAuthGuard } from '../../../lib/auth';
import { apiFetch, ApiError } from '../../../lib/api';

type WebhookItem = {
  id: string;
  event_id: string;
  event_type: string;
  processed: boolean;
  processed_at: string | null;
  error_message: string | null;
  created_at: string;
};

type WebhookDetail = WebhookItem & {
  payload: Record<string, unknown>;
};

export default function AsaasWebhooksPage() {
  const { loading, user } = useAuthGuard();
  const [items, setItems] = React.useState<WebhookItem[]>([]);
  const [selected, setSelected] = React.useState<WebhookDetail | null>(null);
  const [processedFilter, setProcessedFilter] = React.useState<string>('false');
  const [message, setMessage] = React.useState('');
  const [error, setError] = React.useState('');

  const canReprocess = hasPermission(user, 'FINANCE_WRITE');

  async function loadList() {
    const query =
      processedFilter === 'all'
        ? ''
        : `?processed=${processedFilter === 'true'}`;
    const result = await apiFetch<{ items: WebhookItem[] }>(
      `/admin/webhooks/asaas${query}`,
    );
    setItems(result.items);
  }

  React.useEffect(() => {
    if (!user) return;
    loadList().catch((err) =>
      setError(err instanceof ApiError ? err.message : 'Erro ao carregar'),
    );
  }, [user, processedFilter]);

  async function openDetail(id: string) {
    setError('');
    try {
      const detail = await apiFetch<WebhookDetail>(`/admin/webhooks/asaas/${id}`);
      setSelected(detail);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao carregar detalhe');
    }
  }

  async function reprocess(id: string) {
    if (!canReprocess) return;
    setMessage('');
    setError('');
    try {
      await apiFetch(`/admin/webhooks/asaas/${id}/reprocess`, { method: 'POST' });
      setMessage('Evento reenfileirado para reprocessamento');
      await loadList();
      if (selected?.id === id) {
        await openDetail(id);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao reprocessar');
    }
  }

  if (loading || !user) return <div style={{ padding: '2rem' }}>Carregando...</div>;

  return (
    <AdminLayout user={user}>
      <h1 style={{ color: '#6A4F36', marginTop: 0 }}>Webhooks Asaas</h1>
      <p style={{ color: '#666', maxWidth: 720 }}>
        Eventos recebidos do Asaas. Falhas podem ser reprocessadas manualmente.
        Pix avulso interno não passa por estes webhooks.
      </p>

      {message && <p style={{ color: '#2AA98C' }}>{message}</p>}
      {error && <p style={{ color: '#b71c1c' }}>{error}</p>}

      <label style={{ display: 'block', marginBottom: '1rem' }}>
        Filtrar
        <select
          value={processedFilter}
          onChange={(e) => setProcessedFilter(e.target.value)}
          style={{ marginLeft: 8, padding: '0.35rem' }}
        >
          <option value="all">Todos</option>
          <option value="false">Pendentes / com erro</option>
          <option value="true">Processados</option>
        </select>
      </label>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                <th style={{ textAlign: 'left', padding: 8 }}>Evento</th>
                <th style={{ textAlign: 'left', padding: 8 }}>Status</th>
                <th style={{ padding: 8 }}></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: 8 }}>
                    <div>{item.event_type}</div>
                    <div style={{ fontSize: '0.75rem', color: '#888' }}>{item.event_id}</div>
                  </td>
                  <td style={{ padding: 8 }}>
                    {item.processed ? (
                      <span style={{ color: '#2AA98C' }}>OK</span>
                    ) : (
                      <span style={{ color: item.error_message ? '#b71c1c' : '#f57c00' }}>
                        {item.error_message ? 'Erro' : 'Pendente'}
                      </span>
                    )}
                  </td>
                  <td style={{ padding: 8 }}>
                    <Button size="sm" variant="outline" onClick={() => openDetail(item.id)}>
                      Ver
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div>
          {selected ? (
            <div
              style={{
                border: '1px solid #e0e0e0',
                borderRadius: 8,
                padding: '1rem',
                background: '#fafafa',
              }}
            >
              <h3 style={{ marginTop: 0 }}>{selected.event_type}</h3>
              <p style={{ fontSize: '0.85rem' }}>
                <strong>ID:</strong> {selected.event_id}
              </p>
              <p style={{ fontSize: '0.85rem' }}>
                <strong>Criado:</strong> {new Date(selected.created_at).toLocaleString('pt-BR')}
              </p>
              {selected.error_message && (
                <p style={{ color: '#b71c1c', fontSize: '0.85rem' }}>
                  <strong>Erro:</strong> {selected.error_message}
                </p>
              )}
              <pre
                style={{
                  background: '#fff',
                  border: '1px solid #ddd',
                  borderRadius: 6,
                  padding: '0.75rem',
                  fontSize: '0.75rem',
                  overflow: 'auto',
                  maxHeight: 280,
                }}
              >
                {JSON.stringify(selected.payload, null, 2)}
              </pre>
              {canReprocess && (
                <Button onClick={() => reprocess(selected.id)} style={{ marginTop: '0.75rem' }}>
                  Reprocessar
                </Button>
              )}
            </div>
          ) : (
            <p style={{ color: '#888' }}>Selecione um evento para ver detalhes.</p>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
