'use client';

import * as React from 'react';
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
import { cancelSubscription, fetchDonorSubscription, formatBRL } from '@/lib/donor-api';
import { DonorApiError } from '@/lib/donor-auth';

const REASON_OPTIONS = [
  { value: 'FINANCIAL', label: 'Motivo financeiro' },
  { value: 'TEMPORARY', label: 'Pausa temporária' },
  { value: 'OTHER_CAUSE', label: 'Apoio por outro meio' },
  { value: 'OTHER', label: 'Outro motivo' },
  { value: 'NO_ANSWER', label: 'Prefiro não informar' },
];

export default function CancelarAssinaturaPage() {
  const router = useRouter();
  const [planName, setPlanName] = React.useState('');
  const [planValue, setPlanValue] = React.useState(0);
  const [reasonCode, setReasonCode] = React.useState('NO_ANSWER');
  const [reasonText, setReasonText] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmed, setConfirmed] = React.useState(false);
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    fetchDonorSubscription()
      .then((res) => {
        if (!res.subscription) {
          setError('Nenhuma assinatura ativa para cancelar.');
          return;
        }
        setPlanName(res.subscription.plan.name);
        setPlanValue(res.subscription.value);
      })
      .catch((err) =>
        setError(err instanceof DonorApiError ? err.message : 'Erro ao carregar'),
      )
      .finally(() => setLoading(false));
  }, []);

  async function handleCancel(e: React.FormEvent) {
    e.preventDefault();
    if (!confirmed) {
      setError('Marque que entende as consequências do cancelamento.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const result = await cancelSubscription({
        password,
        reason_code: reasonCode,
        reason: reasonText || undefined,
      });
      router.push(`/dashboard/assinatura?canceled=1&message=${encodeURIComponent(result.message)}`);
    } catch (err) {
      setError(err instanceof DonorApiError ? err.message : 'Erro ao cancelar');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <LoadingState message="Carregando..." />;

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-bold text-brand-brown">Cancelar assinatura</h1>
        <p className="mt-1 text-sm text-brand-text/70">
          Sentiremos sua falta — mas respeitamos sua decisão. Sem ligacao, sem e-mail obrigatório.
        </p>
      </header>

      {error && <Alert variant="destructive">{error}</Alert>}

      {planName && (
        <form onSubmit={handleCancel}>
          <Card>
            <CardTitle>Confirmar cancelamento</CardTitle>
            <CardContent className="space-y-4">
              <Alert>
                Você está cancelando <strong>{planName}</strong> ({formatBRL(planValue)}/mês).
                <ul className="mt-2 list-inside list-disc text-sm">
                  <li>Novas cobranças mensais serão interrompidas.</li>
                  <li>Benefícios de assinante ativa deixarão de valer.</li>
                  <li>Você pode assinar novamente quando quiser.</li>
                </ul>
              </Alert>

              <label className="block text-sm">
                Motivo (opcional)
                <select
                  className="mt-1 w-full rounded-lg border border-brand-primary-light px-3 py-2"
                  value={reasonCode}
                  onChange={(e) => setReasonCode(e.target.value)}
                >
                  {REASON_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>

              {reasonCode === 'OTHER' && (
                <Input
                  label="Conte brevemente (opcional)"
                  value={reasonText}
                  onChange={(e) => setReasonText(e.target.value)}
                />
              )}

              <Input
                label="Senha para confirmar"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <label className="flex cursor-pointer items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                />
                <span>Entendo que o cancelamento encerra cobranças futuras desta assinatura.</span>
              </label>

              <div className="grid gap-2 sm:grid-cols-2">
                <Button type="button" variant="outline" onClick={() => router.push('/dashboard/assinatura')}>
                  Manter assinatura
                </Button>
                <Button type="submit" variant="destructive" loading={submitting}>
                  Confirmar cancelamento
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      )}
    </div>
  );
}
