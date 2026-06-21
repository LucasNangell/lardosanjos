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
import {
  fetchDonorProfile,
  fetchDonorSubscription,
  maskCardNumber,
  onlyDigits,
  updateSubscriptionPayment,
} from '@/lib/donor-api';
import { DonorApiError } from '@/lib/donor-auth';

export default function PagamentoAssinaturaPage() {
  const router = useRouter();
  const [password, setPassword] = React.useState('');
  const [cardHolder, setCardHolder] = React.useState('');
  const [cardNumber, setCardNumber] = React.useState('');
  const [expiryMonth, setExpiryMonth] = React.useState('');
  const [expiryYear, setExpiryYear] = React.useState('');
  const [ccv, setCcv] = React.useState('');
  const [postalCode, setPostalCode] = React.useState('');
  const [addressNumber, setAddressNumber] = React.useState('');
  const [holderName, setHolderName] = React.useState('');
  const [holderEmail, setHolderEmail] = React.useState('');
  const [holderCpf, setHolderCpf] = React.useState('');
  const [holderPhone, setHolderPhone] = React.useState('');
  const [error, setError] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    Promise.all([fetchDonorSubscription(), fetchDonorProfile()])
      .then(([sub, profile]) => {
        if (sub.subscription?.billing_type !== 'CREDIT_CARD') {
          setError('Sua assinatura não utiliza cartão de crédito.');
        }
        setHolderName(profile.full_name);
        setHolderEmail(profile.email);
        setHolderPhone(profile.phone ?? '');
      })
      .catch((err) =>
        setError(err instanceof DonorApiError ? err.message : 'Erro ao carregar'),
      )
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setMessage('');
    try {
      const result = await updateSubscriptionPayment({
        password,
        credit_card: {
          holder_name: cardHolder,
          number: onlyDigits(cardNumber),
          expiry_month: expiryMonth.padStart(2, '0'),
          expiry_year: expiryYear.length === 2 ? `20${expiryYear}` : expiryYear,
          ccv,
        },
        credit_card_holder: {
          name: holderName,
          email: holderEmail,
          cpf_cnpj: onlyDigits(holderCpf),
          postal_code: onlyDigits(postalCode, 8),
          address_number: addressNumber,
          phone: onlyDigits(holderPhone, 11),
        },
      });
      setMessage(result.message);
      setTimeout(() => router.push('/dashboard/assinatura'), 1500);
    } catch (err) {
      setError(err instanceof DonorApiError ? err.message : 'Erro ao atualizar cartão');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <LoadingState message="Carregando..." />;

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-bold text-brand-brown">Atualizar pagamento</h1>
        <p className="mt-1 text-sm text-brand-text/70">
          Novo cartão enviado diretamente ao Asaas — não armazenamos número nem CVV.
        </p>
      </header>

      {error && <Alert variant="destructive">{error}</Alert>}
      {message && <Alert variant="success">{message}</Alert>}

      {!error && (
        <form onSubmit={handleSubmit}>
          <Card>
            <CardTitle>Novo cartão</CardTitle>
            <CardContent className="space-y-4">
              <Input
                label="Nome no cartão"
                value={cardHolder}
                onChange={(e) => setCardHolder(e.target.value)}
                required
              />
              <Input
                label="Número"
                inputMode="numeric"
                value={maskCardNumber(cardNumber)}
                onChange={(e) => setCardNumber(onlyDigits(e.target.value, 19))}
                required
              />
              <div className="grid grid-cols-3 gap-3">
                <Input label="Mês" value={expiryMonth} onChange={(e) => setExpiryMonth(onlyDigits(e.target.value, 2))} required />
                <Input label="Ano" value={expiryYear} onChange={(e) => setExpiryYear(onlyDigits(e.target.value, 4))} required />
                <Input label="CVV" value={ccv} onChange={(e) => setCcv(onlyDigits(e.target.value, 4))} required />
              </div>
              <Input label="CEP" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} required />
              <Input label="Número" value={addressNumber} onChange={(e) => setAddressNumber(e.target.value)} required />
              <Input
                label="Confirme sua senha"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Alert>
                Dados sensíveis trafegam apenas para o gateway de pagamento.
              </Alert>
              <div className="grid gap-2 sm:grid-cols-2">
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  Voltar
                </Button>
                <Button type="submit" loading={submitting}>
                  Salvar cartão
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      )}
    </div>
  );
}
