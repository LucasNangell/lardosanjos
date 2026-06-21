'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AdminLayout } from '@/components/AdminLayout';
import { AnimalForm } from '@/components/AnimalForm';
import { hasPermission, useAuthGuard } from '@/lib/auth';
import { apiFetch, AnimalFormData } from '@/lib/api';

interface AdminAnimal extends AnimalFormData {
  id: string;
  coverImageId?: string;
  coverImageUrl?: string | null;
  images?: Array<{
    id: string;
    uploadedFileId: string;
    displayOrder: number;
    url: string | null;
  }>;
}

export default function EditarAnimalPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { loading, user } = useAuthGuard();
  const [animal, setAnimal] = React.useState<AdminAnimal | null>(null);
  const [error, setError] = React.useState('');
  const canWrite = hasPermission(user, 'ANIMAL_WRITE');
  const canRead = hasPermission(user, 'ANIMAL_READ');

  React.useEffect(() => {
    if (!user || !canRead) return;
    apiFetch<AdminAnimal>(`/admin/animals/${params.id}`)
      .then(setAnimal)
      .catch((err) => setError(err instanceof Error ? err.message : 'Erro ao carregar'));
  }, [user, canRead, params.id]);

  async function handleSubmit(
    data: AnimalFormData & {
      coverImageId?: string;
      images?: { uploadedFileId: string; displayOrder: number }[];
    },
  ) {
    await apiFetch(`/admin/animals/${params.id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    router.push('/animais');
  }

  async function handleDelete() {
    if (!confirm('Excluir este animal?')) return;
    await apiFetch(`/admin/animals/${params.id}`, { method: 'DELETE' });
    router.push('/animais');
  }

  if (loading || !user) return <div style={{ padding: '2rem' }}>Carregando...</div>;

  return (
    <AdminLayout user={user}>
      <Link href="/animais" style={{ color: '#2AA98C' }}>
        ← Animais
      </Link>
      <h1 style={{ color: '#6A4F36' }}>Editar animal</h1>
      {error && <p style={{ color: '#b71c1c' }}>{error}</p>}
      {animal && canWrite && (
        <AnimalForm
          initial={{
            ...animal,
            images: animal.images?.map((img) => ({
              uploadedFileId: img.uploadedFileId,
              displayOrder: img.displayOrder,
              url: img.url,
            })),
          }}
          onSubmit={handleSubmit}
          onDelete={handleDelete}
        />
      )}
      {animal && !canWrite && <p>Sem permissão para editar.</p>}
      {!animal && !error && <p>Carregando animal...</p>}
    </AdminLayout>
  );
}
