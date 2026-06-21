'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AdminLayout } from '@/components/AdminLayout';
import { AnimalForm } from '@/components/AnimalForm';
import { hasPermission, useAuthGuard } from '@/lib/auth';
import { apiFetch, AnimalFormData } from '@/lib/api';

export default function NovoAnimalPage() {
  const router = useRouter();
  const { loading, user } = useAuthGuard();
  const canWrite = hasPermission(user, 'ANIMAL_WRITE');

  async function handleSubmit(
    data: AnimalFormData & {
      coverImageId?: string;
      images?: { uploadedFileId: string; displayOrder: number }[];
    },
  ) {
    await apiFetch('/admin/animals', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    router.push('/animais');
  }

  if (loading || !user) return <div style={{ padding: '2rem' }}>Carregando...</div>;

  if (!canWrite) {
    return (
      <AdminLayout user={user}>
        <p style={{ color: '#b71c1c' }}>Permissão ANIMAL_WRITE necessária.</p>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout user={user}>
      <Link href="/animais" style={{ color: '#2AA98C' }}>
        ← Animais
      </Link>
      <h1 style={{ color: '#6A4F36' }}>Novo animal</h1>
      <AnimalForm onSubmit={handleSubmit} submitLabel="Cadastrar animal" />
    </AdminLayout>
  );
}
