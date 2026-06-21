'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button } from '@lardosanjos/ui';
import { AdminLayout } from '../../../components/AdminLayout';
import { hasPermission, useAuthGuard } from '../../../lib/auth';
import { apiFetch, ApiError } from '../../../lib/api';

type Expense = {
  id: string;
  title: string;
  amount: number;
  date: string;
  is_public: boolean;
  has_receipt: boolean;
  supplier: string | null;
  category: { name: string };
};

function money(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function DespesasPage() {
  const { loading, user } = useAuthGuard();
  const [expenses, setExpenses] = React.useState<Expense[]>([]);
  const [error, setError] = React.useState('');
  const [message, setMessage] = React.useState('');

  const canWrite = hasPermission(user, 'FINANCE_WRITE');
  const canRead = hasPermission(user, 'FINANCE_READ');

  async function loadData() {
    const exps = await apiFetch<Expense[]>('/admin/expenses');
    setExpenses(exps);
  }

  React.useEffect(() => {
    if (!user || !canRead) return;
    loadData().catch((err) =>
      setError(err instanceof ApiError ? err.message : 'Erro ao carregar'),
    );
  }, [user, canRead]);

  async function handleDelete(id: string) {
    if (!canWrite || !confirm('Remover esta despesa?')) return;
    setMessage('');
    setError('');
    try {
      await apiFetch(`/admin/expenses/${id}`, { method: 'DELETE' });
      setMessage('Despesa removida');
      await loadData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao remover');
    }
  }

  async function openReceipt(id: string) {
    try {
      const result = await apiFetch<{ url: string }>(`/admin/expenses/${id}/receipt-url`);
      window.open(result.url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Comprovante indisponível');
    }
  }

  if (loading || !user) return <div style={{ padding: '2rem' }}>Carregando...</div>;

  return (
    <AdminLayout user={user}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ color: '#6A4F36', marginTop: 0 }}>Despesas</h1>
        {canWrite && (
          <Link href="/financeiro/despesas/nova">
            <Button>Nova despesa</Button>
          </Link>
        )}
      </div>

      {message && <p style={{ color: '#2AA98C' }}>{message}</p>}
      {error && <p style={{ color: '#b71c1c' }}>{error}</p>}

      <table style={{ width: '100%', background: '#fff', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#f5f5f5', textAlign: 'left' }}>
            <th style={{ padding: 8 }}>Título</th>
            <th style={{ padding: 8 }}>Categoria</th>
            <th style={{ padding: 8 }}>Fornecedor</th>
            <th style={{ padding: 8 }}>Valor</th>
            <th style={{ padding: 8 }}>Data</th>
            <th style={{ padding: 8 }}>Pública</th>
            <th style={{ padding: 8 }}>Comprovante</th>
            {canWrite && <th style={{ padding: 8 }}>Ações</th>}
          </tr>
        </thead>
        <tbody>
          {expenses.map((exp) => (
            <tr key={exp.id}>
              <td style={{ padding: 8, borderTop: '1px solid #eee' }}>{exp.title}</td>
              <td style={{ padding: 8, borderTop: '1px solid #eee' }}>{exp.category.name}</td>
              <td style={{ padding: 8, borderTop: '1px solid #eee' }}>
                {exp.supplier || '—'}
              </td>
              <td style={{ padding: 8, borderTop: '1px solid #eee' }}>{money(exp.amount)}</td>
              <td style={{ padding: 8, borderTop: '1px solid #eee' }}>
                {new Date(exp.date).toLocaleDateString('pt-BR')}
              </td>
              <td style={{ padding: 8, borderTop: '1px solid #eee' }}>
                {exp.is_public ? 'Sim' : 'Não'}
              </td>
              <td style={{ padding: 8, borderTop: '1px solid #eee' }}>
                {exp.has_receipt ? (
                  <button
                    type="button"
                    onClick={() => openReceipt(exp.id)}
                    style={{ background: 'none', border: 'none', color: '#2AA98C', cursor: 'pointer' }}
                  >
                    Ver
                  </button>
                ) : (
                  '—'
                )}
              </td>
              {canWrite && (
                <td style={{ padding: 8, borderTop: '1px solid #eee' }}>
                  <button
                    type="button"
                    onClick={() => handleDelete(exp.id)}
                    style={{ background: 'none', border: 'none', color: '#b71c1c', cursor: 'pointer' }}
                  >
                    Excluir
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
