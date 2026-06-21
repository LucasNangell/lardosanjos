'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardTitle,
  EmptyState,
  StatCard,
} from '@lardosanjos/ui';

export interface TransparencyPayload {
  reference_month: { year: number; month: number };
  data_state: 'empty' | 'partial' | 'complete';
  month_income: number;
  monthly_goal: number;
  goal_progress_percent: number;
  daily_cost_estimate: number;
  active_donors: number;
  month_expense: number;
  month_balance: number;
  total_income: number;
  total_expense: number;
  net_balance: number;
  income_by_source: { asaas: number; pix_manual: number };
  month_income_by_source: { asaas: number; pix_manual: number };
  expenses_by_category: Array<{
    category_id: string;
    name: string;
    color: string | null;
    total: number;
  }>;
  monthly_evolution: Array<{
    year: number;
    month: number;
    label: string;
    income: number;
    expense: number;
    balance: number;
  }>;
  public_expenses: Array<{
    id: string;
    title: string;
    public_description: string;
    amount: number;
    date: string;
    category: { name: string; color: string | null };
  }>;
  reports: Array<{
    id: string;
    month: number;
    year: number;
    summary: string | null;
    total_income: number;
    total_expense: number;
    net_balance: number;
  }>;
  pending_note: string;
}

function formatBRL(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function BarChart({
  items,
  valueKey,
  labelKey,
  colorKey,
}: {
  items: Array<Record<string, string | number | null>>;
  valueKey: string;
  labelKey: string;
  colorKey?: string;
}) {
  const max = Math.max(...items.map((item) => Number(item[valueKey]) || 0), 1);

  if (items.length === 0) {
    return <EmptyState title="Sem dados para gráfico" description="Nenhuma despesa pública neste período." />;
  }

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const value = Number(item[valueKey]) || 0;
        const width = `${Math.max(4, (value / max) * 100)}%`;
        const color = (colorKey ? item[colorKey] : '#2AA98C') as string;
        return (
          <div key={String(item[labelKey])}>
            <div className="mb-1 flex justify-between text-sm">
              <span className="text-brand-brown">{String(item[labelKey])}</span>
              <span className="font-medium text-brand-primary">{formatBRL(value)}</span>
            </div>
            <div className="h-3 rounded-full bg-brand-primary-light/40">
              <div
                className="h-3 rounded-full transition-all"
                style={{ width, backgroundColor: color || '#2AA98C' }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function EvolutionChart({
  points,
}: {
  points: TransparencyPayload['monthly_evolution'];
}) {
  if (points.length === 0) {
    return <EmptyState title="Sem histórico" description="A evolução mensal aparecerá com o tempo." />;
  }

  const max = Math.max(
    ...points.flatMap((p) => [p.income, p.expense]),
    1,
  );

  return (
    <div className="overflow-x-auto">
      <div className="flex min-w-[640px] items-end gap-3 px-1 pb-2">
        {points.map((point) => (
          <div key={point.label} className="flex flex-1 flex-col items-center gap-1">
            <div className="flex h-36 w-full items-end justify-center gap-1">
              <div
                className="w-4 rounded-t bg-brand-primary"
                style={{ height: `${Math.max(4, (point.income / max) * 100)}%` }}
                title={`Entradas ${formatBRL(point.income)}`}
              />
              <div
                className="w-4 rounded-t bg-brand-brown/70"
                style={{ height: `${Math.max(4, (point.expense / max) * 100)}%` }}
                title={`Saídas ${formatBRL(point.expense)}`}
              />
            </div>
            <span className="text-[10px] text-brand-text/60">{point.label}</span>
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-4 text-xs text-brand-text/70">
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-brand-primary" /> Entradas confirmadas
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-brand-brown/70" /> Despesas públicas
        </span>
      </div>
    </div>
  );
}

export function TransparencyPortal({ data }: { data: TransparencyPayload }) {
  const monthLabel = `${String(data.reference_month.month).padStart(2, '0')}/${data.reference_month.year}`;

  return (
    <div className="space-y-8">
      {data.data_state === 'partial' && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Dados parciais: algumas receitas ou despesas ainda não foram registradas para exibição completa.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={`Arrecadado em ${monthLabel}`} value={formatBRL(data.month_income)} />
        <StatCard label="Meta mensal" value={formatBRL(data.monthly_goal)} />
        <StatCard label="Custo diário estimado" value={formatBRL(data.daily_cost_estimate)} />
        <StatCard label="Doadores ativos" value={String(data.active_donors)} />
      </div>

      <Card>
        <CardTitle>Progresso da meta — {monthLabel}</CardTitle>
        <CardContent className="mt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span>{formatBRL(data.month_income)} arrecadados</span>
            <span>{data.goal_progress_percent.toFixed(0)}%</span>
          </div>
          <div className="h-4 overflow-hidden rounded-full bg-brand-primary-light/50">
            <div
              className="h-4 rounded-full bg-brand-primary transition-all"
              style={{ width: `${Math.min(100, data.goal_progress_percent)}%` }}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Despesas do mês" value={formatBRL(data.month_expense)} />
        <StatCard label="Saldo do mês" value={formatBRL(data.month_balance)} />
        <StatCard label="Saldo acumulado" value={formatBRL(data.net_balance)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle>Entradas confirmadas (total)</CardTitle>
          <CardContent className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-brand-text/60">Asaas (cartão/boleto/assinatura)</p>
              <p className="text-xl font-bold text-brand-primary">
                {formatBRL(data.income_by_source.asaas)}
              </p>
            </div>
            <div>
              <p className="text-sm text-brand-text/60">Pix avulso confirmado</p>
              <p className="text-xl font-bold text-brand-primary">
                {formatBRL(data.income_by_source.pix_manual)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardTitle>Saídas públicas (total)</CardTitle>
          <CardContent className="mt-4">
            <p className="text-2xl font-bold text-brand-brown">{formatBRL(data.total_expense)}</p>
            <p className="mt-1 text-sm text-brand-text/60">
              Apenas despesas marcadas como públicas. Comprovantes internos não são exibidos.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle>Despesas por categoria — {monthLabel}</CardTitle>
          <CardContent className="mt-4">
            <BarChart
              items={data.expenses_by_category.map((item) => ({
                label: item.name,
                value: item.total,
                color: item.color,
              }))}
              labelKey="label"
              valueKey="value"
              colorKey="color"
            />
          </CardContent>
        </Card>

        <Card>
          <CardTitle>Evolução mensal</CardTitle>
          <CardContent className="mt-4">
            <EvolutionChart points={data.monthly_evolution} />
          </CardContent>
        </Card>
      </div>

      <section>
        <h2 className="font-heading text-xl font-bold text-brand-brown">Despesas públicas</h2>
        {data.public_expenses.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              title="Nenhuma despesa pública cadastrada"
              description="Quando despesas forem registradas pela administração, elas aparecerão aqui."
            />
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {data.public_expenses.map((exp) => (
              <li
                key={exp.id}
                className="rounded-xl border border-brand-primary-light bg-white p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-brand-brown">{exp.title}</p>
                    <p className="text-sm text-brand-text/70">{exp.public_description}</p>
                    <span className="mt-1 inline-block text-xs text-brand-text/50">
                      {exp.category.name} · {new Date(exp.date).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <p className="font-bold text-brand-primary">{formatBRL(exp.amount)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {data.reports.length > 0 && (
        <section>
          <h2 className="font-heading text-xl font-bold text-brand-brown">Relatórios publicados</h2>
          <ul className="mt-4 space-y-3">
            {data.reports.map((report) => (
              <li
                key={report.id}
                className="rounded-xl border border-brand-primary-light bg-white p-4 text-sm"
              >
                <p className="font-medium text-brand-brown">
                  {String(report.month).padStart(2, '0')}/{report.year}
                </p>
                {report.summary && <p className="mt-1 text-brand-text/70">{report.summary}</p>}
                <p className="mt-2 text-brand-text/60">
                  Entradas {formatBRL(report.total_income)} · Saídas {formatBRL(report.total_expense)} ·
                  Saldo {formatBRL(report.net_balance)}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="text-sm text-brand-text/60">{data.pending_note}</p>
    </div>
  );
}
