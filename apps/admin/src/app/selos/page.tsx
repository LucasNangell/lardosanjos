'use client';

import * as React from 'react';
import { Button } from '@lardosanjos/ui';
import { AdminLayout } from '@/components/AdminLayout';
import { hasPermission, useAuthGuard } from '@/lib/auth';
import { apiFetch, ApiError } from '@/lib/api';

type Badge = {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  ruleType: string;
  ruleValue: number | null;
};

export default function AdminSelosPage() {
  const { loading, user } = useAuthGuard();
  const [badges, setBadges] = React.useState<Badge[]>([]);
  const [message, setMessage] = React.useState('');
  const [error, setError] = React.useState('');

  const canWrite = hasPermission(user, 'BADGE_WRITE');
  const canRead = hasPermission(user, 'BADGE_READ');

  React.useEffect(() => {
    if (!user || !canRead) return;
    apiFetch<Badge[]>('/admin/badges')
      .then(setBadges)
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : 'Erro ao carregar'),
      );
  }, [user, canRead]);

  async function syncBadges() {
    if (!canWrite) return;
    setMessage('');
    setError('');
    try {
      const result = await apiFetch<{ donors_processed: number; badges_awarded: number }>(
        '/admin/badges/sync',
        { method: 'POST' },
      );
      setMessage(
        `Sincronização concluída — ${result.donors_processed} doadores, ${result.badges_awarded} selos atribuídos.`,
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro na sincronização');
    }
  }

  if (loading || !user) return <div style={{ padding: '2rem' }}>Carregando...</div>;

  return (
    <AdminLayout user={user}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ color: '#6A4F36', marginTop: 0 }}>Selos dos Anjos</h1>
        {canWrite && <Button onClick={syncBadges}>Sincronizar selos</Button>}
      </div>
      <p style={{ color: '#666' }}>
        Reconhecimento por constância, primeira doação, assinatura ativa e campanhas — sem
        destacar apenas maiores valores.
      </p>
      {message && <p style={{ color: '#2AA98C' }}>{message}</p>}
      {error && <p style={{ color: '#b71c1c' }}>{error}</p>}

      <div style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
        {badges.map((badge) => (
          <div
            key={badge.id}
            style={{
              background: '#fff',
              border: '1px solid #eee',
              borderRadius: 8,
              padding: '1rem',
            }}
          >
            <strong style={{ color: '#6A4F36' }}>{badge.name}</strong>
            <p style={{ margin: '0.35rem 0', color: '#666' }}>{badge.description}</p>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#999' }}>
              Regra: {badge.ruleType}
              {badge.ruleValue != null ? ` (${badge.ruleValue})` : ''}
            </p>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}
