'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  DonationPlanCard,
  Button,
  Input,
  Card,
  CardTitle,
  CardContent,
  Alert,
  LoadingState,
  Badge,
  EmptyState,
} from '@lardosanjos/ui';
import {
  createSubscriptionDonation,
  CUSTOM_PLAN_SLUG,
  DonationPlan,
  formatBRL,
  maskCardNumber,
  MIN_CUSTOM_AMOUNT,
  onlyDigits,
  planValue,
  SubscriptionBillingType,
  SubscriptionCheckoutStep,
  SubscriptionDonationResponse,
} from '@/lib/subscription-donation';

interface Props {
  plans: DonationPlan[];
}

export function SejaUmAnjoCheckout({ plans }: Props) {
  const [step, setStep] = React.useState<SubscriptionCheckoutStep>('plans');
  const [selectedPlan, setSelectedPlan] = React.useState<DonationPlan | null>(null);
  const [billingType, setBillingType] = React.useState<SubscriptionBillingType>('CREDIT_CARD');
  const [error, setError] = React.useState('');
  const [result, setResult] = React.useState<SubscriptionDonationResponse | null>(null);

  const [customAmount, setCustomAmount] = React.useState(String(MIN_CUSTOM_AMOUNT));
  const [donorName, setDonorName] = React.useState('');
  const [donorEmail, setDonorEmail] = React.useState('');
  const [donorPhone, setDonorPhone] = React.useState('');
  const [cpfCnpj, setCpfCnpj] = React.useState('');
  const [postalCode, setPostalCode] = React.useState('');
  const [address, setAddress] = React.useState('');
  const [addressNumber, setAddressNumber] = React.useState('');
  const [city, setCity] = React.useState('');
  const [stateUf, setStateUf] = React.useState('');

  const [acceptsTerms, setAcceptsTerms] = React.useState(false);
  const [acceptsPrivacy, setAcceptsPrivacy] = React.useState(false);
  const [wantsPublicMural, setWantsPublicMural] = React.useState(false);
  const [wantsAnonymous, setWantsAnonymous] = React.useState(true);
  const [communicationEmail, setCommunicationEmail] = React.useState(true);
  const [communicationWhatsapp, setCommunicationWhatsapp] = React.useState(false);

  const [cardHolder, setCardHolder] = React.useState('');
  const [cardNumber, setCardNumber] = React.useState('');
  const [expiryMonth, setExpiryMonth] = React.useState('');
  const [expiryYear, setExpiryYear] = React.useState('');
  const [ccv, setCcv] = React.useState('');

  const isCustomPlan = selectedPlan?.slug === CUSTOM_PLAN_SLUG;
  const monthlyValue = selectedPlan
    ? isCustomPlan
      ? parseFloat(customAmount.replace(',', '.')) || 0
      : planValue(selectedPlan)
    : 0;

  function selectPlan(plan: DonationPlan) {
    setSelectedPlan(plan);
    setStep('details');
    setError('');
  }

  function goToPayment(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!acceptsTerms || !acceptsPrivacy) {
      setError('Aceite os termos e a política de privacidade para continuar.');
      return;
    }

    if (isCustomPlan && monthlyValue < MIN_CUSTOM_AMOUNT) {
      setError(`Valor personalizado mínimo: ${formatBRL(MIN_CUSTOM_AMOUNT)}`);
      return;
    }

    if (billingType === 'BOLETO' && !cpfCnpj.trim()) {
      setError('CPF/CNPJ é obrigatório para boleto.');
      return;
    }

    if (billingType === 'CREDIT_CARD') {
      setStep('payment');
      return;
    }

    void submitSubscription();
  }

  async function submitSubscription() {
    if (!selectedPlan) return;

    setStep('result');
    setError('');

    try {
      const response = await createSubscriptionDonation({
        plan_id: selectedPlan.id,
        donor_name: donorName,
        donor_email: donorEmail,
        donor_phone: donorPhone || undefined,
        cpf_cnpj: cpfCnpj || undefined,
        postal_code: postalCode || undefined,
        address: address || undefined,
        address_number: addressNumber || undefined,
        city: city || undefined,
        state: stateUf || undefined,
        billing_type: billingType,
        custom_amount: isCustomPlan ? monthlyValue : undefined,
        accepts_terms: acceptsTerms,
        accepts_privacy: acceptsPrivacy,
        wants_public_mural: wantsPublicMural,
        wants_anonymous: wantsAnonymous,
        communication_email: communicationEmail,
        communication_whatsapp: communicationWhatsapp,
        ...(billingType === 'CREDIT_CARD' && {
          credit_card: {
            holder_name: cardHolder,
            number: onlyDigits(cardNumber),
            expiry_month: expiryMonth.padStart(2, '0'),
            expiry_year: expiryYear.length === 2 ? `20${expiryYear}` : expiryYear,
            ccv,
          },
          credit_card_holder: {
            name: donorName,
            email: donorEmail,
            cpf_cnpj: onlyDigits(cpfCnpj),
            postal_code: onlyDigits(postalCode, 8),
            address_number: addressNumber,
            phone: onlyDigits(donorPhone, 11) || onlyDigits(cpfCnpj, 11),
          },
        }),
      });

      setResult(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado');
      setStep(billingType === 'CREDIT_CARD' ? 'payment' : 'details');
    }
  }

  async function handlePaymentSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStep('result');
    setError('');
    await submitSubscription();
  }

  function resetCheckout() {
    setStep('plans');
    setSelectedPlan(null);
    setResult(null);
    setError('');
  }

  if (plans.length === 0) {
    return (
      <EmptyState
        title="Planos em configuração"
        description="Em breve os planos mensais estarão disponíveis."
      />
    );
  }

  return (
    <div className="mt-8">
      {step !== 'plans' && step !== 'result' && selectedPlan && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-brand-primary-light/30 px-4 py-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-brand-text/60">Plano escolhido</p>
            <p className="font-semibold text-brand-brown">{selectedPlan.name}</p>
            <p className="text-sm text-brand-primary">
              {formatBRL(monthlyValue)}
              <span className="text-brand-text/60">/mês</span>
            </p>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={resetCheckout}>
            Trocar plano
          </Button>
        </div>
      )}

      {error && step !== 'result' && (
        <Alert variant="destructive" className="mb-4">
          {error}
          <div className="mt-3">
            <Button type="button" size="sm" variant="outline" onClick={() => setError('')}>
              Tentar novamente
            </Button>
          </div>
        </Alert>
      )}

      {step === 'plans' && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <DonationPlanCard
              key={plan.id}
              name={plan.name}
              value={planValue(plan)}
              description={plan.description || undefined}
              impactText={plan.impactText || undefined}
              featured={plan.isFeatured}
              onSelect={() => selectPlan(plan)}
            />
          ))}
        </div>
      )}

      {step === 'details' && selectedPlan && (
        <Card className="max-w-2xl">
          <CardTitle>Seus dados</CardTitle>
          <CardContent>
            <form onSubmit={goToPayment} className="mt-4 space-y-4">
              {isCustomPlan && (
                <Input
                  label={`Valor mensal (mín. ${formatBRL(MIN_CUSTOM_AMOUNT)})`}
                  inputMode="decimal"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  required
                />
              )}

              <Input
                label="Nome completo *"
                value={donorName}
                onChange={(e) => setDonorName(e.target.value)}
                required
              />
              <Input
                label="E-mail *"
                type="email"
                value={donorEmail}
                onChange={(e) => setDonorEmail(e.target.value)}
                required
              />
              <Input
                label="WhatsApp"
                type="tel"
                value={donorPhone}
                onChange={(e) => setDonorPhone(e.target.value)}
              />
              <Input
                label="CPF/CNPJ *"
                value={cpfCnpj}
                onChange={(e) => setCpfCnpj(e.target.value)}
                required
              />

              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  label="CEP"
                  inputMode="numeric"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                />
                <Input
                  label="Cidade"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="sm:col-span-2">
                  <Input
                    label="Endereço"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>
                <Input
                  label="Nº"
                  value={addressNumber}
                  onChange={(e) => setAddressNumber(e.target.value)}
                />
              </div>
              <Input
                label="UF"
                maxLength={2}
                value={stateUf}
                onChange={(e) => setStateUf(e.target.value.toUpperCase())}
              />

              <fieldset className="space-y-2">
                <legend className="text-sm font-medium text-brand-brown">Forma de pagamento</legend>
                <div className="grid grid-cols-2 gap-2">
                  {(['CREDIT_CARD', 'BOLETO'] as SubscriptionBillingType[]).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setBillingType(type)}
                      className={`rounded-xl border px-3 py-3 text-sm font-medium transition focus-ring ${
                        billingType === type
                          ? 'border-brand-primary bg-brand-primary-light text-brand-brown'
                          : 'border-brand-primary-light hover:bg-brand-primary-light/40'
                      }`}
                    >
                      {type === 'CREDIT_CARD' ? 'Cartão' : 'Boleto'}
                    </button>
                  ))}
                </div>
              </fieldset>

              <fieldset className="space-y-3 rounded-xl border border-brand-primary-light bg-brand-bg/50 p-4">
                <legend className="px-1 text-sm font-medium text-brand-brown">Privacidade</legend>
                <label className="flex cursor-pointer items-start gap-3 text-sm">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={wantsAnonymous}
                    onChange={(e) => setWantsAnonymous(e.target.checked)}
                  />
                  <span>Prefiro aparecer de forma anônima no Mural dos Anjos</span>
                </label>
                <label className="flex cursor-pointer items-start gap-3 text-sm">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={wantsPublicMural}
                    onChange={(e) => setWantsPublicMural(e.target.checked)}
                    disabled={wantsAnonymous}
                  />
                  <span>Autorizo aparecer no Mural após confirmação da assinatura</span>
                </label>
                <label className="flex cursor-pointer items-start gap-3 text-sm">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={communicationEmail}
                    onChange={(e) => setCommunicationEmail(e.target.checked)}
                  />
                  <span>Receber novidades por e-mail</span>
                </label>
                <label className="flex cursor-pointer items-start gap-3 text-sm">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={communicationWhatsapp}
                    onChange={(e) => setCommunicationWhatsapp(e.target.checked)}
                  />
                  <span>Receber novidades por WhatsApp</span>
                </label>
              </fieldset>

              <fieldset className="space-y-3 rounded-xl border border-brand-primary-light p-4">
                <legend className="px-1 text-sm font-medium text-brand-brown">
                  Consentimentos obrigatórios
                </legend>
                <label className="flex cursor-pointer items-start gap-3 text-sm">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={acceptsTerms}
                    onChange={(e) => setAcceptsTerms(e.target.checked)}
                    required
                  />
                  <span>
                    Li e aceito os{' '}
                    <Link href="/termos" className="text-brand-primary underline">
                      termos de uso
                    </Link>
                  </span>
                </label>
                <label className="flex cursor-pointer items-start gap-3 text-sm">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={acceptsPrivacy}
                    onChange={(e) => setAcceptsPrivacy(e.target.checked)}
                    required
                  />
                  <span>
                    Li e aceito a{' '}
                    <Link href="/privacidade" className="text-brand-primary underline">
                      política de privacidade
                    </Link>
                  </span>
                </label>
              </fieldset>

              <Alert>
                A assinatura só será considerada ativa após confirmação do primeiro pagamento.
                Pagamentos pendentes não entram na transparência pública.
              </Alert>

              <Button type="submit" className="w-full" size="lg">
                {billingType === 'CREDIT_CARD' ? 'Continuar para pagamento' : 'Criar assinatura'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {step === 'payment' && selectedPlan && (
        <Card className="max-w-2xl">
          <CardTitle>Dados do cartão</CardTitle>
          <CardContent>
            <form onSubmit={handlePaymentSubmit} className="mt-4 space-y-4">
              <Input
                label="Nome impresso no cartão *"
                value={cardHolder}
                onChange={(e) => setCardHolder(e.target.value)}
                autoComplete="cc-name"
                required
              />
              <Input
                label="Número do cartão *"
                inputMode="numeric"
                value={maskCardNumber(cardNumber)}
                onChange={(e) => setCardNumber(onlyDigits(e.target.value, 19))}
                autoComplete="cc-number"
                required
              />
              <div className="grid grid-cols-3 gap-3">
                <Input
                  label="Mês *"
                  placeholder="MM"
                  inputMode="numeric"
                  value={expiryMonth}
                  onChange={(e) => setExpiryMonth(onlyDigits(e.target.value, 2))}
                  required
                />
                <Input
                  label="Ano *"
                  placeholder="AAAA"
                  inputMode="numeric"
                  value={expiryYear}
                  onChange={(e) => setExpiryYear(onlyDigits(e.target.value, 4))}
                  required
                />
                <Input
                  label="CVV *"
                  inputMode="numeric"
                  value={ccv}
                  onChange={(e) => setCcv(onlyDigits(e.target.value, 4))}
                  autoComplete="cc-csc"
                  required
                />
              </div>

              <Alert>
                Seus dados de cartão são enviados diretamente ao Asaas. Não armazenamos número
                completo nem CVV.
              </Alert>

              <div className="grid gap-2 sm:grid-cols-2">
                <Button type="button" variant="outline" onClick={() => setStep('details')}>
                  Voltar
                </Button>
                <Button type="submit">Confirmar assinatura</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {step === 'result' && !result && !error && (
        <LoadingState message="Criando sua assinatura..." />
      )}

      {step === 'result' && result && (
        <Card className="max-w-2xl">
          <CardTitle>Assinatura registrada</CardTitle>
          <CardContent className="space-y-4">
            <Badge variant="warning">Aguardando confirmação</Badge>
            <Alert variant="success">{result.message}</Alert>
            <div className="rounded-xl bg-brand-primary-light/30 p-4 text-sm">
              <p>
                <strong>Plano:</strong> {result.plan.name}
              </p>
              <p>
                <strong>Valor mensal:</strong> {formatBRL(result.plan.value)}
              </p>
              <p>
                <strong>Forma:</strong>{' '}
                {result.billing_type === 'CREDIT_CARD' ? 'Cartão de crédito' : 'Boleto'}
              </p>
              {result.next_due_date && (
                <p>
                  <strong>Próximo vencimento:</strong> {result.next_due_date}
                </p>
              )}
            </div>
            <p className="text-sm text-brand-text/70">
              Sua assinatura ficará pendente até a confirmação do primeiro pagamento pelo
              gateway. Você receberá comunicações conforme suas preferências de contato.
            </p>
            <Button type="button" className="w-full" onClick={resetCheckout}>
              Escolher outro plano
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
