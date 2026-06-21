'use client';

import * as React from 'react';
import { AdminLayout } from '../../components/AdminLayout';
import { useAuthGuard } from '../../lib/auth';
import { apiFetch } from '../../lib/api';

export default function DashboardPage() {
  const { loading, user } = useAuthGuard();
  const [dashboard, setDashboard] = React.useState<{ message: string } | null>(null);

  React.useEffect(() => {
    if (!user) return;
    apiFetch<{ message: string }>('/admin/dashboard')
      .then(setDashboard)
      .catch(() => setDashboard(null));
  }, [user]);

  if (loading || !user) {
    return <div style={{ padding: '2rem' }}>Carregando...</div>;
  }

  return (
    <AdminLayout user={user}>
      <h1 style={{ color: '#6A4F36', marginTop: 0 }}>Dashboard</h1>
      <p>{dashboard?.message ?? 'Bem-vindo ao painel administrativo.'}</p>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginTop: '2rem',
        }}
      >
        {[
          { title: 'Pix', desc: 'Configurar chave e parâmetros' },
          { title: 'Confirmar Pix', desc: 'Conciliação manual de doações' },
          { title: 'Despesas', desc: 'Gestão financeira e transparência' },
        ].map((card) => (
          <div
            key={card.title}
            style={{
              background: '#fff',
              padding: '1.25rem',
              borderRadius: 8,
              border: '1px solid #e0e0e0',
            }}
          >
            <strong>{card.title}</strong>
            <p style={{ margin: '0.5rem 0 0', color: '#666', fontSize: '0.9rem' }}>
              {card.desc}
            </p>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}
