'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button } from '@lardosanjos/ui';
import { AdminLayout } from '../../../components/AdminLayout';
import { hasPermission, useAuthGuard } from '../../../lib/auth';
import { apiFetch, ApiError, getAccessToken } from '../../../lib/api';

type Report = {
  id: string;
  month: number;
  year: number;
  summary: string | null;
  total_income: number;
  total_expense: number;
  net_balance: number;
  is_published: boolean;
  published_at: string | null;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

function money(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function RelatoriosPage() {
  const { loading, user } = useAuthGuard();
  const [reports, setReports] = React.useState<Report[]>([]);
  const [message, setMessage] = React.useState('');
  const [error, setError] = React.useState('');
  const [closeForm, setCloseForm] = React.useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    summary: '',
    publish: false,
  });

  const canTransparency = hasPermission(user, 'TRANSPARENCY_WRITE');
  const canRead =
    hasPermission(user, 'FINANCE_READ') || hasPermission(user, 'TRANSPARENCY_READ');

  async function loadReports() {
    const items = await apiFetch<Report[]>('/admin/transparency/reports');
    setReports(items);
  }

  React.useEffect(() => {
    if (!user || !canRead) return;
    loadReports().catch((err) =>
      setError(err instanceof ApiError ? err.message : 'Erro ao carregar'),
    );
  }, [user, canRead]);

  async function handleClose(e: React.FormEvent) {
    e.preventDefault();
    if (!canTransparency) return;
    setMessage('');
    setError('');
    try {
      const result = await apiFetch<Report>('/admin/transparency/reports/close', {
        method: 'POST',
        body: JSON.stringify(closeForm),
      });
      setMessage(
        `Relatório ${String(result.month).padStart(2, '0')}/${result.year} fechado — Saldo: ${money(result.net_balance)}`,
      );
      await loadReports();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao fechar relatório');
    }
  }

  async function togglePublish(report: Report, publish: boolean) {
    if (!canTransparency) return;
    setMessage('');
    setError('');
    try {
      await apiFetch(`/admin/transparency/reports/${report.id}/${publish ? 'publish' : 'unpublish'}`, {
        method: 'PATCH',
      });
      setMessage(publish ? 'Relatório publicado' : 'Relatório despublicado');
      await loadReports();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao atualizar publicação');
    }
  }

  function exportReport(id: string) {
    const token = getAccessToken();
    const url = `${API_URL}/admin/transparency/reports/${id}/export`;
    fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      credentials: 'include',
    })
      .then(async (res) => {
        if (!res.ok) throw new Error('Falha na exportação');
        const blob = await res.blob();
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `relatorio-${id}.txt`;
        link.click();
        URL.revokeObjectURL(link.href);
      })
      .catch(() => setError('Erro ao exportar relatório'));
  }

  if (loading || !user) return <div style={{ padding: '2rem' }}>Carregando...</div>;

  return (
    <AdminLayout user={user}>
      <Link href="/financeiro" style={{ color: '#2AA98C' }}>
        ← Financeiro
      </Link>
      <h1 style={{ color: '#6A4F36', marginTop: 8 }}>Relatórios mensais</h1>
      <p style={{ color: '#666' }}>
        Totais consideram receitas confirmadas (Asaas + Pix manual) e despesas públicas.
      </p>
      {message && <p style={{ color: '#2AA98C' }}>{message}</p>}
      {error && <p style={{ color: '#b71c1c' }}>{error}</p>}

      {canTransparency && (
        <form
          onSubmit={handleClose}
          style={{
            background: '#fff',
            padding: '1rem',
            borderRadius: 8,
            marginBottom: '2rem',
            maxWidth: 420,
            display: 'grid',
            gap: 8,
          }}
        >
          <h3 style={{ margin: 0 }}>Fechar mês</h3>
          <input
            type="number"
            min={1}
            max={12}
            value={closeForm.month}
            onChange={(e) =>
              setCloseForm({ ...closeForm, month: Number(e.target.value) })
            }
          />
          <input
            type="number"
            min={2000}
            value={closeForm.year}
            onChange={(e) =>
              setCloseForm({ ...closeForm, year: Number(e.target.value) })
            }
          />
          <textarea
            placeholder="Resumo do mês"
            value={closeForm.summary}
            onChange={(e) => setCloseForm({ ...closeForm, summary: e.target.value })}
          />
          <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              type="checkbox"
              checked={closeForm.publish}
              onChange={(e) =>
                setCloseForm({ ...closeForm, publish: e.target.checked })
              }
            />
            Publicar imediatamente
          </label>
          <Button type="submit">Fechar relatório</Button>
        </form>
      )}

      <table style={{ width: '100%', background: '#fff', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#f5f5f5', textAlign: 'left' }}>
            <th style={{ padding: 8 }}>Período</th>
            <th style={{ padding: 8 }}>Receita</th>
            <th style={{ padding: 8 }}>Despesa</th>
            <th style={{ padding: 8 }}>Saldo</th>
            <th style={{ padding: 8 }}>Publicado</th>
            <th style={{ padding: 8 }}>Ações</th>
          </tr>
        </thead>
        <tbody>
          {reports.map((report) => (
            <tr key={report.id}>
              <td style={{ padding: 8, borderTop: '1px solid #eee' }}>
                {String(report.month).padStart(2, '0')}/{report.year}
              </td>
              <td style={{ padding: 8, borderTop: '1px solid #eee' }}>
                {money(report.total_income)}
              </td>
              <td style={{ padding: 8, borderTop: '1px solid #eee' }}>
                {money(report.total_expense)}
              </td>
              <td style={{ padding: 8, borderTop: '1px solid #eee' }}>
                {money(report.net_balance)}
              </td>
              <td style={{ padding: 8, borderTop: '1px solid #eee' }}>
                {report.is_published ? 'Sim' : 'Não'}
              </td>
              <td style={{ padding: 8, borderTop: '1px solid #eee' }}>
                <button
                  type="button"
                  onClick={() => exportReport(report.id)}
                  style={{ background: 'none', border: 'none', color: '#2AA98C', cursor: 'pointer', marginRight: 8 }}
                >
                  Exportar
                </button>
                {canTransparency && (
                  <button
                    type="button"
                    onClick={() => togglePublish(report, !report.is_published)}
                    style={{ background: 'none', border: 'none', color: '#6A4F36', cursor: 'pointer' }}
                  >
                    {report.is_published ? 'Despublicar' : 'Publicar'}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </AdminLayout>
  );
}
