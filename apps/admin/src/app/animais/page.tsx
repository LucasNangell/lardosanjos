'use client';

import * as React from 'react';
import Link from 'next/link';
import { AdminLayout } from '@/components/AdminLayout';
import { hasPermission, useAuthGuard } from '@/lib/auth';
import { apiFetch, ApiError } from '@/lib/api';

interface Animal {
  id: string;
  name: string;
  species: string;
  status: string;
  isPublic: boolean;
  coverImageUrl?: string | null;
}

const SPECIES_LABELS: Record<string, string> = {
  DOG: 'Cachorro',
  CAT: 'Gato',
  OTHER: 'Outro',
};

export default function AdminAnimaisPage() {
  const { loading, user } = useAuthGuard();
  const [animals, setAnimals] = React.useState<Animal[]>([]);
  const [error, setError] = React.useState('');

  const canWrite = hasPermission(user, 'ANIMAL_WRITE');
  const canRead = hasPermission(user, 'ANIMAL_READ');

  React.useEffect(() => {
    if (!user || !canRead) return;
    apiFetch<Animal[]>('/admin/animals')
      .then(setAnimals)
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : 'Erro ao carregar'),
      );
  }, [user, canRead]);

  if (loading || !user) return <div style={{ padding: '2rem' }}>Carregando...</div>;

  return (
    <AdminLayout user={user}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ color: '#6A4F36', marginTop: 0 }}>Animais</h1>
        {canWrite && (
          <Link
            href="/animais/novo"
            style={{
              padding: '0.5rem 1rem',
              background: '#2AA98C',
              color: '#fff',
              borderRadius: 6,
              textDecoration: 'none',
              fontWeight: 'bold',
            }}
          >
            + Novo animal
          </Link>
        )}
      </div>

      {error && <p style={{ color: '#b71c1c' }}>{error}</p>}

      {!error && animals.length === 0 && <p>Nenhum animal cadastrado.</p>}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '1rem',
          marginTop: '1.5rem',
        }}
      >
        {animals.map((animal) => (
          <div
            key={animal.id}
            style={{
              background: '#fff',
              borderRadius: 8,
              overflow: 'hidden',
              border: '1px solid #eee',
            }}
          >
            <div
              style={{
                height: 140,
                background: animal.coverImageUrl
                  ? `url(${animal.coverImageUrl}) center/cover`
                  : '#DEB88F',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#6A4F36',
              }}
            >
              {!animal.coverImageUrl && '🐾'}
            </div>
            <div style={{ padding: '1rem' }}>
              <strong style={{ color: '#6A4F36' }}>{animal.name}</strong>
              <p style={{ margin: '0.25rem 0', fontSize: '0.85rem', color: '#666' }}>
                {SPECIES_LABELS[animal.species] ?? animal.species} · {animal.status}
              </p>
              <p style={{ margin: '0.25rem 0', fontSize: '0.85rem' }}>
                {animal.isPublic ? 'Público' : 'Interno'}
              </p>
              {canWrite && (
                <Link href={`/animais/${animal.id}`} style={{ color: '#2AA98C' }}>
                  Editar
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}
