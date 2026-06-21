'use client';

import * as React from 'react';
import Link from 'next/link';
import { AdminLayout } from '@/components/AdminLayout';
import { hasPermission, useAuthGuard } from '@/lib/auth';
import { apiFetch, ApiError } from '@/lib/api';

interface Campaign {
  id: string;
  title: string;
  slug: string;
  status: string;
  goalAmount: number;
  raisedAmount: number;
  progressPercent: number;
}

export default function AdminCampanhasPage() {
  const { loading, user } = useAuthGuard();
  const [campaigns, setCampaigns] = React.useState<Campaign[]>([]);
  const [error, setError] = React.useState('');

  const canWrite = hasPermission(user, 'CAMPAIGN_WRITE');
  const canRead = hasPermission(user, 'CAMPAIGN_READ');

  React.useEffect(() => {
    if (!user || !canRead) return;
    apiFetch<Campaign[]>('/admin/campaigns')
      .then(setCampaigns)
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : 'Erro ao carregar'),
      );
  }, [user, canRead]);

  if (loading || !user) return <div style={{ padding: '2rem' }}>Carregando...</div>;

  return (
    <AdminLayout user={user}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ color: '#6A4F36', marginTop: 0 }}>Campanhas</h1>
        {canWrite && (
          <Link
            href="/campanhas/nova"
            style={{
              padding: '0.5rem 1rem',
              background: '#2AA98C',
              color: '#fff',
              borderRadius: 6,
              textDecoration: 'none',
              fontWeight: 'bold',
            }}
          >
            + Nova campanha
          </Link>
        )}
      </div>

      {error && <p style={{ color: '#b71c1c' }}>{error}</p>}

      <table style={{ width: '100%', marginTop: '1.5rem', borderCollapse: 'collapse', background: '#fff' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #eee', textAlign: 'left' }}>
            <th style={{ padding: '0.75rem' }}>Título</th>
            <th style={{ padding: '0.75rem' }}>Status</th>
            <th style={{ padding: '0.75rem' }}>Arrecadado</th>
            <th style={{ padding: '0.75rem' }}>Progresso</th>
            <th style={{ padding: '0.75rem' }}></th>
          </tr>
        </thead>
        <tbody>
          {campaigns.map((c) => (
            <tr key={c.id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '0.75rem' }}>{c.title}</td>
              <td style={{ padding: '0.75rem' }}>{c.status}</td>
              <td style={{ padding: '0.75rem' }}>
                R$ {c.raisedAmount.toFixed(2)} / R$ {c.goalAmount.toFixed(2)}
              </td>
              <td style={{ padding: '0.75rem' }}>{c.progressPercent}%</td>
              <td style={{ padding: '0.75rem' }}>
                {canWrite && (
                  <Link href={`/campanhas/${c.id}`} style={{ color: '#2AA98C' }}>
                    Editar
                  </Link>
                )}
                {' · '}
                <a
                  href={`${process.env.NEXT_PUBLIC_WEB_URL || 'http://localhost:3000'}/campanhas/${c.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: '#6A4F36' }}
                >
                  Ver pública
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </AdminLayout>
  );
}
