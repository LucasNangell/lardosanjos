'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Button,
  Input,
  Card,
  CardTitle,
  CardContent,
  Alert,
  LoadingState,
} from '@lardosanjos/ui';
import {
  changeSubscriptionPlan,
  DonationPlanOption,
  fetchDonorSubscription,
  fetchPublicPlans,
  formatBRL,
} from '@/lib/donor-api';
import { DonorApiError } from '@/lib/donor-auth';

function planValueNum(plan: DonationPlanOption) {
  return Number(plan.value);
}

export default function AlterarPlanoPage() {
  const router = useRouter();
  const [plans, setPlans] = React.useState<DonationPlanOption[]>([]);
  const [currentPlanId, setCurrentPlanId] = React.useState<string | null>(null);
  const [selectedPlanId, setSelectedPlanId] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    Promise.all([fetchPublicPlans(), fetchDonorSubscription()])
      .then(([plansData, subData]) => {
        setPlans(plansData.filter((p) => p.slug !== 'valor-personalizado'));
        setCurrentPlanId(subData.subscription?.plan.id ?? null);
      })
      .catch((err) =>
        setError(err instanceof DonorApiError ? err.message : 'Erro ao carregar'),
      )
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPlanId) return;
    setSubmitting(true);
    setError('');
    setMessage('');
    try {
      const result = await changeSubscriptionPlan(selectedPlanId, password);
      setMessage(result.message);
      setTimeout(() => router.push('/dashboard/assinatura'), 1500);
    } catch (err) {
      setError(err instanceof DonorApiError ? err.message : 'Erro ao alterar plano');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <LoadingState message="Carregando planos..." />;

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-bold text-brand-brown">Alterar plano</h1>
        <p className="mt-1 text-sm text-brand-text/70">
          Upgrade ou downgrade aplicado nas próximas cobranças via Asaas.
        </p>
      </header>

      {error && <Alert variant="destructive">{error}</Alert>}
      {message && <Alert variant="success">{message}</Alert>}

      <form onSubmit={handleSubmit}>
        <Card>
          <CardTitle>Escolha o novo plano</CardTitle>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {plans.map((plan) => (
                <label
                  key={plan.id}
                  className={`flex cursor-pointer items-center justify-between rounded-xl border px-4 py-3 ${
                    selectedPlanId === plan.id
                      ? 'border-brand-primary bg-brand-primary-light/40'
                      : 'border-brand-primary-light'
                  } ${plan.id === currentPlanId ? 'opacity-60' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="plan"
                      value={plan.id}
                      disabled={plan.id === currentPlanId}
                      checked={selectedPlanId === plan.id}
                      onChange={() => setSelectedPlanId(plan.id)}
                    />
                    <div>
                      <p className="font-medium text-brand-brown">{plan.name}</p>
                      {plan.description && (
                        <p className="text-xs text-brand-text/60">{plan.description}</p>
                      )}
                    </div>
                  </div>
                  <span className="font-semibold text-brand-primary">
                    {formatBRL(planValueNum(plan))}
                  </span>
                </label>
              ))}
            </div>

            <Input
              label="Confirme sua senha"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <div className="grid gap-2 sm:grid-cols-2">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Voltar
              </Button>
              <Button type="submit" loading={submitting} disabled={!selectedPlanId}>
                Confirmar alteração
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
