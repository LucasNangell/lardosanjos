'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button } from '@lardosanjos/ui';
import { AdminLayout } from '../../../../components/AdminLayout';
import { hasPermission, useAuthGuard } from '../../../../lib/auth';
import { apiFetch, apiUpload, ApiError } from '../../../../lib/api';

type Category = { id: string; name: string; is_active: boolean };

export default function NovaDespesaPage() {
  const { loading, user } = useAuthGuard();
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [message, setMessage] = React.useState('');
  const [error, setError] = React.useState('');
  const [receiptFile, setReceiptFile] = React.useState<File | null>(null);
  const [form, setForm] = React.useState({
    category_id: '',
    title: '',
    description: '',
    public_description: '',
    amount: '',
    date: new Date().toISOString().slice(0, 10),
    supplier: '',
    is_public: true,
  });

  const canWrite = hasPermission(user, 'FINANCE_WRITE');

  React.useEffect(() => {
    if (!user || !canWrite) return;
    apiFetch<Category[]>('/admin/expense-categories')
      .then((cats) => {
        setCategories(cats);
        if (cats[0]) {
          setForm((prev) => ({ ...prev, category_id: cats[0].id }));
        }
      })
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : 'Erro ao carregar categorias'),
      );
  }, [user, canWrite]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canWrite) return;
    setMessage('');
    setError('');

    try {
      let receipt_file_id: string | undefined;
      if (receiptFile) {
        const upload = await apiUpload<{ file_id: string }>(
          '/admin/expenses/receipts/upload',
          receiptFile,
        );
        receipt_file_id = upload.file_id;
      }

      await apiFetch('/admin/expenses', {
        method: 'POST',
        body: JSON.stringify({
          category_id: form.category_id,
          title: form.title,
          description: form.description || undefined,
          public_description: form.public_description,
          amount: Number(form.amount),
          date: form.date,
          supplier: form.supplier || undefined,
          receipt_file_id,
          is_public: form.is_public,
        }),
      });

      setMessage(
        form.is_public
          ? 'Despesa pública criada — visível no portal de transparência.'
          : 'Despesa interna criada.',
      );
      setReceiptFile(null);
      setForm((prev) => ({
        ...prev,
        title: '',
        description: '',
        public_description: '',
        amount: '',
        supplier: '',
      }));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao criar despesa');
    }
  }

  if (loading || !user) return <div style={{ padding: '2rem' }}>Carregando...</div>;

  if (!canWrite) {
    return (
      <AdminLayout user={user}>
        <p style={{ color: '#b71c1c' }}>Permissão FINANCE_WRITE necessária.</p>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout user={user}>
      <Link href="/financeiro/despesas" style={{ color: '#2AA98C' }}>
        ← Voltar
      </Link>
      <h1 style={{ color: '#6A4F36' }}>Nova despesa</h1>
      {message && <p style={{ color: '#2AA98C' }}>{message}</p>}
      {error && <p style={{ color: '#b71c1c' }}>{error}</p>}

      <form
        onSubmit={handleSubmit}
        style={{
          background: '#fff',
          padding: '1.25rem',
          borderRadius: 8,
          display: 'grid',
          gap: '0.75rem',
          maxWidth: 640,
        }}
      >
        <select
          value={form.category_id}
          onChange={(e) => setForm({ ...form, category_id: e.target.value })}
          required
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <input
          placeholder="Título"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          required
        />
        <input
          placeholder="Fornecedor (opcional)"
          value={form.supplier}
          onChange={(e) => setForm({ ...form, supplier: e.target.value })}
        />
        <textarea
          placeholder="Descrição interna (opcional)"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <textarea
          placeholder="Descrição pública (transparência)"
          value={form.public_description}
          onChange={(e) => setForm({ ...form, public_description: e.target.value })}
          required
        />
        <input
          type="number"
          step="0.01"
          min="0.01"
          placeholder="Valor (R$)"
          value={form.amount}
          onChange={(e) => setForm({ ...form, amount: e.target.value })}
          required
        />
        <input
          type="date"
          value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
          required
        />
        <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            type="checkbox"
            checked={form.is_public}
            onChange={(e) => setForm({ ...form, is_public: e.target.checked })}
          />
          Despesa pública (visível na transparência)
        </label>
        <div>
          <label style={{ display: 'block', marginBottom: 4, fontSize: '0.9rem' }}>
            Comprovante (PDF, JPG, PNG ou WebP — máx. 5MB)
          </label>
          <input
            type="file"
            accept=".pdf,image/jpeg,image/png,image/webp"
            onChange={(e) => setReceiptFile(e.target.files?.[0] ?? null)}
          />
        </div>
        <Button type="submit">Cadastrar despesa</Button>
      </form>
    </AdminLayout>
  );
}
