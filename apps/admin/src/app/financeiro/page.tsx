'use client';

import * as React from 'react';
import Link from 'next/link';
import { AdminLayout } from '../../components/AdminLayout';
import { useAuthGuard } from '../../lib/auth';
import { apiFetch, ApiError } from '../../lib/api';

type Dashboard = {
  current_month: {
    asaas_income: number;
    pix_manual_income: number;
    total_income: number;
    public_expenses: number;
    all_expenses: number;
    balance_public: number;
    balance_all: number;
  };
  totals: {
    expenses_count: number;
    categories_count: number;
    pending_pix_confirmations: number;
  };
};

function money(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function FinanceiroDashboardPage() {
  const { loading, user } = useAuthGuard();
  const [data, setData] = React.useState<Dashboard | null>(null);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    if (!user) return;
    apiFetch<Dashboard>('/admin/finance/dashboard')
      .then(setData)
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : 'Erro ao carregar'),
      );
  }, [user]);

  if (loading || !user) return <div style={{ padding: '2rem' }}>Carregando...</div>;

  return (
    <AdminLayout user={user}>
      <h1 style={{ color: '#6A4F36', marginTop: 0 }}>Financeiro</h1>
      <p style={{ color: '#666', marginTop: 0 }}>
        Resumo do mês atual — receitas confirmadas (Asaas + Pix manual) e despesas.
      </p>
      {error && <p style={{ color: '#b71c1c' }}>{error}</p>}

      {data && (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1rem',
              marginBottom: '2rem',
            }}
          >
            <Card title="Asaas (confirmado)" value={money(data.current_month.asaas_income)} />
            <Card
              title="Pix manual (confirmado)"
              value={money(data.current_month.pix_manual_income)}
            />
            <Card title="Receita total" value={money(data.current_month.total_income)} accent />
            <Card title="Despesas públicas" value={money(data.current_month.public_expenses)} />
            <Card title="Despesas (todas)" value={money(data.current_month.all_expenses)} />
            <Card title="Saldo público" value={money(data.current_month.balance_public)} accent />
          </div>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
            <Stat label="Despesas cadastradas" value={String(data.totals.expenses_count)} />
            <Stat label="Categorias ativas" value={String(data.totals.categories_count)} />
            <Stat
              label="Pix aguardando confirmação"
              value={String(data.totals.pending_pix_confirmations)}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <LinkButton href="/financeiro/despesas/nova">Nova despesa</LinkButton>
            <LinkButton href="/financeiro/despesas">Ver despesas</LinkButton>
            <LinkButton href="/financeiro/relatorios">Relatórios</LinkButton>
            <LinkButton href="/financeiro/conciliacao-asaas">Conciliação Asaas</LinkButton>
            <LinkButton href="/financeiro/pix-confirm">Confirmar Pix</LinkButton>
          </div>
        </>
      )}
    </AdminLayout>
  );
}

function Card({
  title,
  value,
  accent,
}: {
  title: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      style={{
        background: accent ? '#2AA98C' : '#fff',
        color: accent ? '#fff' : '#263238',
        padding: '1rem',
        borderRadius: 8,
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      }}
    >
      <div style={{ fontSize: '0.85rem', opacity: 0.85 }}>{title}</div>
      <div style={{ fontSize: '1.35rem', fontWeight: 700, marginTop: 4 }}>{value}</div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: '#fff', padding: '0.75rem 1rem', borderRadius: 8 }}>
      <div style={{ fontSize: '0.8rem', color: '#666' }}>{label}</div>
      <div style={{ fontWeight: 700 }}>{value}</div>
    </div>
  );
}

function LinkButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      style={{
        background: '#6A4F36',
        color: '#fff',
        padding: '0.6rem 1rem',
        borderRadius: 6,
        textDecoration: 'none',
        fontSize: '0.9rem',
      }}
    >
      {children}
    </Link>
  );
}
