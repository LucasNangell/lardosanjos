'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button } from '@lardosanjos/ui';
import { AdminLayout } from '../../../components/AdminLayout';
import { hasPermission, useAuthGuard } from '../../../lib/auth';
import { apiFetch, ApiError } from '../../../lib/api';

type Category = {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  is_active: boolean;
};

export default function CategoriasPage() {
  const { loading, user } = useAuthGuard();
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [message, setMessage] = React.useState('');
  const [error, setError] = React.useState('');
  const [form, setForm] = React.useState({
    name: '',
    icon: '',
    color: '#2AA98C',
  });

  const canWrite = hasPermission(user, 'FINANCE_WRITE');
  const canRead = hasPermission(user, 'FINANCE_READ');

  async function loadData() {
    const cats = await apiFetch<Category[]>('/admin/expense-categories');
    setCategories(cats);
  }

  React.useEffect(() => {
    if (!user || !canRead) return;
    loadData().catch((err) =>
      setError(err instanceof ApiError ? err.message : 'Erro ao carregar'),
    );
  }, [user, canRead]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!canWrite) return;
    setMessage('');
    setError('');
    try {
      await apiFetch('/admin/expense-categories', {
        method: 'POST',
        body: JSON.stringify({
          name: form.name,
          icon: form.icon || undefined,
          color: form.color || undefined,
          is_active: true,
        }),
      });
      setMessage('Categoria criada');
      setForm({ name: '', icon: '', color: '#2AA98C' });
      await loadData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao criar categoria');
    }
  }

  async function toggleActive(cat: Category) {
    if (!canWrite) return;
    setMessage('');
    setError('');
    try {
      await apiFetch(`/admin/expense-categories/${cat.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ is_active: !cat.is_active }),
      });
      await loadData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao atualizar');
    }
  }

  async function handleDelete(id: string) {
    if (!canWrite || !confirm('Remover categoria?')) return;
    setMessage('');
    setError('');
    try {
      await apiFetch(`/admin/expense-categories/${id}`, { method: 'DELETE' });
      setMessage('Categoria removida');
      await loadData();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao remover');
    }
  }

  if (loading || !user) return <div style={{ padding: '2rem' }}>Carregando...</div>;

  return (
    <AdminLayout user={user}>
      <Link href="/financeiro" style={{ color: '#2AA98C' }}>
        ← Financeiro
      </Link>
      <h1 style={{ color: '#6A4F36', marginTop: 8 }}>Categorias de despesa</h1>
      {message && <p style={{ color: '#2AA98C' }}>{message}</p>}
      {error && <p style={{ color: '#b71c1c' }}>{error}</p>}

      {canWrite && (
        <form
          onSubmit={handleCreate}
          style={{
            background: '#fff',
            padding: '1rem',
            borderRadius: 8,
            marginBottom: '2rem',
            display: 'grid',
            gap: '0.75rem',
            maxWidth: 420,
          }}
        >
          <h3 style={{ margin: 0 }}>Nova categoria</h3>
          <input
            placeholder="Nome"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <input
            placeholder="Ícone (opcional)"
            value={form.icon}
            onChange={(e) => setForm({ ...form, icon: e.target.value })}
          />
          <input
            type="color"
            value={form.color}
            onChange={(e) => setForm({ ...form, color: e.target.value })}
          />
          <Button type="submit">Cadastrar</Button>
        </form>
      )}

      <table style={{ width: '100%', background: '#fff', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#f5f5f5', textAlign: 'left' }}>
            <th style={{ padding: 8 }}>Nome</th>
            <th style={{ padding: 8 }}>Cor</th>
            <th style={{ padding: 8 }}>Ativa</th>
            {canWrite && <th style={{ padding: 8 }}>Ações</th>}
          </tr>
        </thead>
        <tbody>
          {categories.map((cat) => (
            <tr key={cat.id}>
              <td style={{ padding: 8, borderTop: '1px solid #eee' }}>{cat.name}</td>
              <td style={{ padding: 8, borderTop: '1px solid #eee' }}>
                <span
                  style={{
                    display: 'inline-block',
                    width: 16,
                    height: 16,
                    borderRadius: 4,
                    background: cat.color || '#ccc',
                    verticalAlign: 'middle',
                    marginRight: 6,
                  }}
                />
                {cat.color || '—'}
              </td>
              <td style={{ padding: 8, borderTop: '1px solid #eee' }}>
                {cat.is_active ? 'Sim' : 'Não'}
              </td>
              {canWrite && (
                <td style={{ padding: 8, borderTop: '1px solid #eee' }}>
                  <button
                    type="button"
                    onClick={() => toggleActive(cat)}
                    style={{ background: 'none', border: 'none', color: '#2AA98C', cursor: 'pointer', marginRight: 8 }}
                  >
                    {cat.is_active ? 'Desativar' : 'Ativar'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(cat.id)}
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
