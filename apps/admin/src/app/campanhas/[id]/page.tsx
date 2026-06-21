'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AdminLayout } from '@/components/AdminLayout';
import { hasPermission, useAuthGuard } from '@/lib/auth';
import { adminFetch, apiUpload, CampaignFormData } from '@/lib/api';

type AnimalOption = { id: string; name: string };

interface Campaign extends CampaignFormData {
  id: string;
  slug: string;
  raisedAmount: number;
  progressPercent: number;
}

const inputStyle = {
  display: 'block' as const,
  width: '100%',
  padding: '0.5rem',
  marginTop: '0.25rem',
};

export default function EditarCampanhaPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { loading, user } = useAuthGuard();
  const canWrite = hasPermission(user, 'CAMPAIGN_WRITE');
  const canRead = hasPermission(user, 'CAMPAIGN_READ');

  const [animals, setAnimals] = React.useState<AnimalOption[]>([]);
  const [form, setForm] = React.useState<CampaignFormData | null>(null);
  const [meta, setMeta] = React.useState<{ raisedAmount: number; progressPercent: number; slug: string } | null>(null);
  const [coverFile, setCoverFile] = React.useState<File | null>(null);
  const [error, setError] = React.useState('');
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!user || !canRead) return;
    Promise.all([
      adminFetch<Campaign>(`/admin/campaigns/${params.id}`),
      adminFetch<AnimalOption[]>('/admin/animals').catch(() => []),
    ])
      .then(([c, animalList]) => {
        setForm({
          title: c.title,
          slug: c.slug,
          description: c.description,
          goalAmount: c.goalAmount,
          status: c.status,
          animalId: c.animalId,
          startsAt: c.startsAt,
          endsAt: c.endsAt,
          coverImageId: c.coverImageId,
        });
        setMeta({
          raisedAmount: c.raisedAmount,
          progressPercent: c.progressPercent,
          slug: c.slug,
        });
        setAnimals(animalList);
      })
      .catch((e: Error) => setError(e.message));
  }, [user, canRead, params.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    setError('');
    try {
      let coverImageId = form.coverImageId;
      if (coverFile) {
        const uploaded = await apiUpload<{ fileId: string }>(
          '/admin/campaigns/images/upload',
          coverFile,
        );
        coverImageId = uploaded.fileId;
      }

      await adminFetch(`/admin/campaigns/${params.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ ...form, coverImageId }),
      });
      router.push('/campanhas');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !user) return <div style={{ padding: '2rem' }}>Carregando...</div>;

  if (!canRead) {
    return (
      <AdminLayout user={user}>
        <p style={{ color: '#b71c1c' }}>Permissão CAMPAIGN_READ necessária.</p>
      </AdminLayout>
    );
  }

  if (!form && !error) {
    return (
      <AdminLayout user={user}>
        <p>Carregando...</p>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout user={user}>
      <Link href="/campanhas" style={{ color: '#2AA98C' }}>
        ← Campanhas
      </Link>
      <h1 style={{ color: '#6A4F36' }}>Editar Campanha</h1>
      {meta && (
        <>
          <p style={{ color: '#555' }}>
            Arrecadado: R$ {meta.raisedAmount.toFixed(2)} ({meta.progressPercent}%)
          </p>
          <p>
            <a
              href={`${process.env.NEXT_PUBLIC_WEB_URL || 'http://localhost:3000'}/campanhas/${meta.slug}`}
              target="_blank"
              rel="noreferrer"
              style={{ color: '#2AA98C' }}
            >
              Ver página pública
            </a>
          </p>
        </>
      )}

      {form && canWrite && (
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem', maxWidth: 640 }}>
          <label>
            Título
            <input
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              style={inputStyle}
            />
          </label>
          <label>
            Descrição
            <textarea
              required
              rows={5}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              style={inputStyle}
            />
          </label>
          <label>
            Meta (R$)
            <input
              required
              type="number"
              min={1}
              value={form.goalAmount}
              onChange={(e) => setForm({ ...form, goalAmount: parseFloat(e.target.value) })}
              style={inputStyle}
            />
          </label>
          <label>
            Animal vinculado (opcional)
            <select
              value={form.animalId ?? ''}
              onChange={(e) =>
                setForm({ ...form, animalId: e.target.value || undefined })
              }
              style={inputStyle}
            >
              <option value="">Nenhum</option>
              {animals.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Data inicial (opcional)
            <input
              type="date"
              value={form.startsAt?.slice(0, 10) ?? ''}
              onChange={(e) =>
                setForm({
                  ...form,
                  startsAt: e.target.value ? `${e.target.value}T00:00:00.000Z` : undefined,
                })
              }
              style={inputStyle}
            />
          </label>
          <label>
            Data final (opcional)
            <input
              type="date"
              value={form.endsAt?.slice(0, 10) ?? ''}
              onChange={(e) =>
                setForm({
                  ...form,
                  endsAt: e.target.value ? `${e.target.value}T23:59:59.000Z` : undefined,
                })
              }
              style={inputStyle}
            />
          </label>
          <label>
            Nova imagem de capa (opcional)
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
              style={inputStyle}
            />
          </label>
          <label>
            Status
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              style={inputStyle}
            >
              <option value="DRAFT">Rascunho</option>
              <option value="ACTIVE">Ativa</option>
              <option value="PAUSED">Pausada</option>
              <option value="COMPLETED">Concluída</option>
              <option value="CANCELED">Cancelada</option>
            </select>
          </label>
          {error && <p style={{ color: 'red' }}>{error}</p>}
          <button
            type="submit"
            disabled={saving}
            style={{
              padding: '0.75rem',
              background: '#2AA98C',
              color: '#fff',
              border: 'none',
              borderRadius: '0.375rem',
              fontWeight: 'bold',
            }}
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </form>
      )}

      {form && !canWrite && (
        <p style={{ color: '#555' }}>Você tem permissão apenas de leitura.</p>
      )}
    </AdminLayout>
  );
}
