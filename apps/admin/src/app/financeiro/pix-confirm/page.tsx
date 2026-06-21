'use client';

import * as React from 'react';
import { Button } from '@lardosanjos/ui';
import { AdminLayout } from '../../../components/AdminLayout';
import { hasPermission, useAuthGuard } from '../../../lib/auth';
import { apiFetch, ApiError } from '../../../lib/api';

type PixDonation = {
  id: string;
  donor_name: string | null;
  donor_email: string | null;
  donor_phone: string | null;
  donor_message: string | null;
  amount: number;
  txid: string;
  status: string;
  marked_as_paid_at: string | null;
  manually_confirmed_at: string | null;
  manually_confirmed_by: { id: string; name: string } | null;
  rejected_by: { id: string; name: string } | null;
  created_at: string;
  has_receipt: boolean;
  receipt: { id: string; mime_type: string } | null;
};

type PixDonationDetail = PixDonation & {
  confirmations: Array<{
    action: string;
    previous_status: string | null;
    new_status: string;
    note: string | null;
    admin: { name: string } | null;
    created_at: string;
  }>;
  rejection_reason: string | null;
};

const STATUS_LABELS: Record<string, string> = {
  AGUARDANDO_CONFIRMACAO_MANUAL: 'Aguardando confirmação',
  COMPROVANTE_ENVIADO: 'Comprovante enviado',
  PIX_GERADO: 'Pix gerado',
  CONFIRMADO_MANUALMENTE: 'Confirmado',
  REJEITADO: 'Rejeitado',
  DUPLICADO: 'Duplicado',
  EXPIRADO: 'Expirado',
};

export default function PixConfirmPage() {
  const { loading, user } = useAuthGuard();
  const [items, setItems] = React.useState<PixDonation[]>([]);
  const [selected, setSelected] = React.useState<PixDonationDetail | null>(null);
  const [note, setNote] = React.useState('');
  const [rejectionReason, setRejectionReason] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [error, setError] = React.useState('');
  const [receiptPreview, setReceiptPreview] = React.useState<string | null>(null);
  const [filters, setFilters] = React.useState({
    status: 'AGUARDANDO_CONFIRMACAO_MANUAL',
    search: '',
    from: '',
    to: '',
    min_amount: '',
    max_amount: '',
    has_receipt: '',
  });

  const canConfirm = hasPermission(user, 'PIX_CONFIRM_MANUAL');
  const canRead = hasPermission(user, 'FINANCE_READ') || canConfirm;

  const queryString = React.useMemo(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    return params.toString();
  }, [filters]);

  const loadList = React.useCallback(async () => {
    const result = await apiFetch<{ items: PixDonation[] }>(
      `/admin/pix/donations${queryString ? `?${queryString}` : ''}`,
    );
    setItems(result.items);
  }, [queryString]);

  React.useEffect(() => {
    if (!user || !canRead) return;
    loadList().catch((err) =>
      setError(err instanceof ApiError ? err.message : 'Erro ao carregar'),
    );
  }, [user, canRead, loadList]);

  async function loadDetail(id: string) {
    setReceiptPreview(null);
    const detail = await apiFetch<PixDonationDetail>(`/admin/pix/donations/${id}`);
    setSelected(detail);

    if (detail.has_receipt) {
      try {
        const receipt = await apiFetch<{ url: string; mime_type: string }>(
          `/admin/pix/donations/${id}/receipt-url`,
        );
        const response = await fetch(receipt.url);
        if (response.ok) {
          const blob = await response.blob();
          setReceiptPreview(URL.createObjectURL(blob));
        }
      } catch {
        setReceiptPreview(null);
      }
    }
  }

  async function runAction(action: string) {
    if (!selected || !canConfirm) return;
    setMessage('');
    setError('');

    const body =
      action === 'reject'
        ? { rejection_reason: rejectionReason, note }
        : { note };

    try {
      await apiFetch(`/admin/pix/donations/${selected.id}/${action}`, {
        method: 'POST',
        body: JSON.stringify(body),
      });
      setMessage(`Ação "${action}" executada com sucesso`);
      setSelected(null);
      setNote('');
      setRejectionReason('');
      setReceiptPreview(null);
      await loadList();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro na ação');
    }
  }

  if (loading || !user) return <div style={{ padding: '2rem' }}>Carregando...</div>;

  if (!canRead) {
    return (
      <AdminLayout user={user}>
        <p>Sem permissão para visualizar confirmações Pix.</p>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout user={user}>
      <h1 style={{ color: '#6A4F36', marginTop: 0 }}>Confirmar Doações Pix</h1>
      <p style={{ color: '#666', maxWidth: 900 }}>
        Conciliação manual de Pix avulso (sem Asaas). Apenas doações confirmadas entram na
        transparência e no mural (quando consentido).
      </p>

      {message && <p style={{ color: '#2AA98C' }}>{message}</p>}
      {error && <p style={{ color: '#b71c1c' }}>{error}</p>}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '0.75rem',
          marginBottom: '1rem',
        }}
      >
        <label>
          Status
          <select
            value={filters.status}
            onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
            style={{ width: '100%', padding: '0.35rem', marginTop: 4 }}
          >
            <option value="">Todos</option>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Busca
          <input
            value={filters.search}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
            placeholder="Nome, e-mail, telefone, TXID"
            style={{ width: '100%', padding: '0.35rem', marginTop: 4 }}
          />
        </label>
        <label>
          De
          <input
            type="date"
            value={filters.from}
            onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))}
            style={{ width: '100%', padding: '0.35rem', marginTop: 4 }}
          />
        </label>
        <label>
          Até
          <input
            type="date"
            value={filters.to}
            onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))}
            style={{ width: '100%', padding: '0.35rem', marginTop: 4 }}
          />
        </label>
        <label>
          Valor mín.
          <input
            type="number"
            step="0.01"
            value={filters.min_amount}
            onChange={(e) => setFilters((f) => ({ ...f, min_amount: e.target.value }))}
            style={{ width: '100%', padding: '0.35rem', marginTop: 4 }}
          />
        </label>
        <label>
          Comprovante
          <select
            value={filters.has_receipt}
            onChange={(e) => setFilters((f) => ({ ...f, has_receipt: e.target.value }))}
            style={{ width: '100%', padding: '0.35rem', marginTop: 4 }}
          >
            <option value="">Todos</option>
            <option value="true">Com comprovante</option>
            <option value="false">Sem comprovante</option>
          </select>
        </label>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '1.5rem' }}>
        <div style={{ overflowX: 'auto', background: '#fff', borderRadius: 8 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ background: '#f5f5f5', textAlign: 'left' }}>
                <th style={{ padding: 8 }}>Data</th>
                <th style={{ padding: 8 }}>Nome</th>
                <th style={{ padding: 8 }}>E-mail</th>
                <th style={{ padding: 8 }}>WhatsApp</th>
                <th style={{ padding: 8 }}>Valor</th>
                <th style={{ padding: 8 }}>Status</th>
                <th style={{ padding: 8 }}>Comprovante</th>
                <th style={{ padding: 8 }}>Marcou pago</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => loadDetail(item.id)}
                  style={{
                    cursor: 'pointer',
                    background: selected?.id === item.id ? '#e8f5f1' : 'transparent',
                  }}
                >
                  <td style={{ padding: 8, borderTop: '1px solid #eee' }}>
                    {new Date(item.created_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td style={{ padding: 8, borderTop: '1px solid #eee' }}>
                    {item.donor_name || '—'}
                  </td>
                  <td style={{ padding: 8, borderTop: '1px solid #eee' }}>
                    {item.donor_email || '—'}
                  </td>
                  <td style={{ padding: 8, borderTop: '1px solid #eee' }}>
                    {item.donor_phone || '—'}
                  </td>
                  <td style={{ padding: 8, borderTop: '1px solid #eee' }}>
                    R$ {item.amount.toFixed(2)}
                  </td>
                  <td style={{ padding: 8, borderTop: '1px solid #eee' }}>
                    {STATUS_LABELS[item.status] ?? item.status}
                  </td>
                  <td style={{ padding: 8, borderTop: '1px solid #eee' }}>
                    {item.has_receipt ? 'Sim' : 'Não'}
                  </td>
                  <td style={{ padding: 8, borderTop: '1px solid #eee' }}>
                    {item.marked_as_paid_at
                      ? new Date(item.marked_as_paid_at).toLocaleString('pt-BR')
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div
          style={{
            background: '#fff',
            padding: '1rem',
            borderRadius: 8,
            border: '1px solid #e0e0e0',
            alignSelf: 'start',
          }}
        >
          <h3 style={{ marginTop: 0 }}>Detalhes e ações</h3>
          {selected ? (
            <>
              <p style={{ fontSize: '0.85rem', color: '#666' }}>TXID: {selected.txid}</p>
              {selected.donor_message && (
                <p style={{ fontSize: '0.85rem' }}>
                  <strong>Mensagem:</strong> {selected.donor_message}
                </p>
              )}
              {selected.manually_confirmed_by && (
                <p style={{ fontSize: '0.85rem' }}>
                  Confirmado por: {selected.manually_confirmed_by.name}
                </p>
              )}
              {selected.rejected_by && (
                <p style={{ fontSize: '0.85rem' }}>
                  Rejeitado por: {selected.rejected_by.name}
                </p>
              )}

              {receiptPreview && (
                <div style={{ margin: '1rem 0' }}>
                  <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>Comprovante</p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={receiptPreview}
                    alt="Comprovante Pix"
                    style={{ maxWidth: '100%', borderRadius: 8, border: '1px solid #ddd' }}
                  />
                </div>
              )}

              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Observação interna (opcional)"
                rows={2}
                style={{ width: '100%', marginBottom: '0.75rem' }}
              />
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Motivo da rejeição (obrigatório para rejeitar)"
                rows={2}
                style={{ width: '100%', marginBottom: '0.75rem' }}
              />

              {canConfirm ? (
                <div style={{ display: 'grid', gap: 8 }}>
                  <Button onClick={() => runAction('confirm')}>Confirmar pagamento</Button>
                  <Button
                    onClick={() => runAction('reject')}
                    style={{ backgroundColor: '#b71c1c' }}
                  >
                    Rejeitar
                  </Button>
                  <Button
                    onClick={() => runAction('mark-duplicate')}
                    style={{ backgroundColor: '#6A4F36' }}
                  >
                    Marcar duplicado
                  </Button>
                  <Button
                    onClick={() => runAction('request-info')}
                    style={{ backgroundColor: '#263238' }}
                  >
                    Solicitar informações
                  </Button>
                </div>
              ) : (
                <p>Sem permissão PIX_CONFIRM_MANUAL para confirmar.</p>
              )}

              {selected.confirmations?.length > 0 && (
                <div style={{ marginTop: '1rem' }}>
                  <h4 style={{ marginBottom: 8 }}>Histórico</h4>
                  <ul style={{ paddingLeft: 16, fontSize: '0.8rem', color: '#555' }}>
                    {selected.confirmations.map((entry) => (
                      <li key={entry.created_at + entry.action}>
                        {entry.action} · {entry.new_status}
                        {entry.admin ? ` · ${entry.admin.name}` : ''}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : (
            <p style={{ color: '#666' }}>Selecione uma doação na tabela.</p>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
