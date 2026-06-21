'use client';

import * as React from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { hasPermission, useAuthGuard } from '@/lib/auth';
import { apiFetch, ApiError } from '@/lib/api';

type MuralEntry = {
  id: string;
  displayName: string;
  planName: string | null;
  impactMonths: number | null;
  message: string | null;
  isVisible: boolean;
  createdAt: string;
};

export default function AdminMuralPage() {
  const { loading, user } = useAuthGuard();
  const [entries, setEntries] = React.useState<MuralEntry[]>([]);
  const [error, setError] = React.useState('');
  const [message, setMessage] = React.useState('');

  const canWrite = hasPermission(user, 'MURAL_WRITE');
  const canRead = hasPermission(user, 'MURAL_READ');

  async function load() {
    const data = await apiFetch<MuralEntry[]>('/admin/mural');
    setEntries(data);
  }

  React.useEffect(() => {
    if (!user || !canRead) return;
    load().catch((err) =>
      setError(err instanceof ApiError ? err.message : 'Erro ao carregar'),
    );
  }, [user, canRead]);

  async function toggleVisibility(entry: MuralEntry) {
    if (!canWrite) return;
    setMessage('');
    setError('');
    try {
      await apiFetch(`/admin/mural/${entry.id}/visibility`, {
        method: 'PATCH',
        body: JSON.stringify({ is_visible: !entry.isVisible }),
      });
      setMessage(entry.isVisible ? 'Entrada ocultada' : 'Entrada publicada');
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao atualizar');
    }
  }

  if (loading || !user) return <div style={{ padding: '2rem' }}>Carregando...</div>;

  return (
    <AdminLayout user={user}>
      <h1 style={{ color: '#6A4F36', marginTop: 0 }}>Mural dos Anjos</h1>
      <p style={{ color: '#666' }}>
        Modere entradas do mural. Apenas doadores com consentimento explícito entram aqui.
      </p>
      {message && <p style={{ color: '#2AA98C' }}>{message}</p>}
      {error && <p style={{ color: '#b71c1c' }}>{error}</p>}

      <table style={{ width: '100%', background: '#fff', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#f5f5f5', textAlign: 'left' }}>
            <th style={{ padding: 8 }}>Nome exibido</th>
            <th style={{ padding: 8 }}>Impacto</th>
            <th style={{ padding: 8 }}>Visível</th>
            <th style={{ padding: 8 }}>Data</th>
            {canWrite && <th style={{ padding: 8 }}>Ações</th>}
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.id}>
              <td style={{ padding: 8, borderTop: '1px solid #eee' }}>{entry.displayName}</td>
              <td style={{ padding: 8, borderTop: '1px solid #eee' }}>
                {entry.impactMonths ? `${entry.impactMonths} mês(es)` : '—'}
              </td>
              <td style={{ padding: 8, borderTop: '1px solid #eee' }}>
                {entry.isVisible ? 'Sim' : 'Não'}
              </td>
              <td style={{ padding: 8, borderTop: '1px solid #eee' }}>
                {new Date(entry.createdAt).toLocaleDateString('pt-BR')}
              </td>
              {canWrite && (
                <td style={{ padding: 8, borderTop: '1px solid #eee' }}>
                  <button
                    type="button"
                    onClick={() => toggleVisibility(entry)}
                    style={{ background: 'none', border: 'none', color: '#2AA98C', cursor: 'pointer' }}
                  >
                    {entry.isVisible ? 'Ocultar' : 'Exibir'}
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </AdminLayout>
  );
}
