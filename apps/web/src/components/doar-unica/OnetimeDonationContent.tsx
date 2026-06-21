'use client';

import * as React from 'react';
import {
  Button,
  Input,
  Card,
  CardTitle,
  CardContent,
  Alert,
  LoadingState,
  Badge,
  buttonVariants,
} from '@lardosanjos/ui';
import {
  createOnetimeDonation,
  formatBRL,
  maskCardNumber,
  OnetimeBillingType,
  OnetimeDonationResponse,
  OnetimeView,
  onlyDigits,
  QUICK_AMOUNTS,
} from '@/lib/onetime-donation';

interface Props {
  billingType: OnetimeBillingType;
  campaignId?: string;
}

export function OnetimeDonationContent({ billingType, campaignId }: Props) {
  const [view, setView] = React.useState<OnetimeView>('form');
  const [error, setError] = React.useState('');
  const [result, setResult] = React.useState<OnetimeDonationResponse | null>(null);
  const [copied, setCopied] = React.useState(false);

  const [amount, setAmount] = React.useState(String(QUICK_AMOUNTS[1]));
  const [donorName, setDonorName] = React.useState('');
  const [donorEmail, setDonorEmail] = React.useState('');
  const [donorPhone, setDonorPhone] = React.useState('');
  const [cpfCnpj, setCpfCnpj] = React.useState('');

  const [cardHolder, setCardHolder] = React.useState('');
  const [cardNumber, setCardNumber] = React.useState('');
  const [expiryMonth, setExpiryMonth] = React.useState('');
  const [expiryYear, setExpiryYear] = React.useState('');
  const [ccv, setCcv] = React.useState('');
  const [postalCode, setPostalCode] = React.useState('');
  const [addressNumber, setAddressNumber] = React.useState('');

  const isCard = billingType === 'CREDIT_CARD';
  const title = isCard ? 'Cartão de crédito' : 'Boleto bancário';
  const subtitle = isCard
    ? 'Pagamento processado com segurança via Asaas. Não armazenamos dados do cartão.'
    : 'Gere um boleto via Asaas. A confirmação ocorre após compensação bancária.';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setView('processing');

    const numericAmount = parseFloat(amount.replace(',', '.'));
    if (!Number.isFinite(numericAmount) || numericAmount < 1) {
      setError('Informe um valor mínimo de R$ 1,00.');
      setView('form');
      return;
    }

    try {
      const response = await createOnetimeDonation({
        donor_name: donorName,
        donor_email: donorEmail,
        donor_phone: donorPhone || undefined,
        cpf_cnpj: cpfCnpj || undefined,
        amount: numericAmount,
        billing_type: billingType,
        campaign_id: campaignId,
        ...(isCard && {
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
      setView('result');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado');
      setView('form');
    }
  }

  async function handleCopyBoleto() {
    if (!result?.boleto_digitable_line) return;
    await navigator.clipboard.writeText(result.boleto_digitable_line);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  function outcomeBadge(outcome: OnetimeDonationResponse['outcome']) {
    switch (outcome) {
      case 'approved':
        return <Badge variant="success">Aprovado</Badge>;
      case 'refused':
        return <Badge variant="destructive">Recusado</Badge>;
      default:
        return <Badge variant="warning">Pendente</Badge>;
    }
  }

  if (view === 'processing') {
    return <LoadingState message="Processando pagamento com segurança..." />;
  }

  if (view === 'result' && result) {
    return (
      <Card>
        <CardTitle>{isCard ? 'Resultado do cartão' : 'Boleto gerado'}</CardTitle>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-2xl font-bold text-brand-primary">
              {formatBRL(result.value)}
            </p>
            {outcomeBadge(result.outcome)}
          </div>

          <Alert variant={result.outcome === 'refused' ? 'destructive' : 'default'}>
            {result.message}
          </Alert>

          {!result.confirmed && result.outcome !== 'refused' && (
            <p className="text-sm text-brand-text/70">
              Pagamentos pendentes não entram na transparência pública até confirmação
              definitiva pelo gateway.
            </p>
          )}

          {result.boleto_url && (
            <a
              href={result.boleto_url}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ className: 'w-full' })}
            >
              Abrir boleto (PDF)
            </a>
          )}

          {result.boleto_digitable_line && (
            <div className="space-y-2">
              <div className="rounded-xl bg-brand-primary-light/40 p-3">
                <p className="text-xs font-semibold uppercase text-brand-brown">
                  Linha digitável
                </p>
                <p className="mt-2 break-all font-mono text-xs">
                  {result.boleto_digitable_line}
                </p>
              </div>
              <Button type="button" variant="outline" className="w-full" onClick={handleCopyBoleto}>
                {copied ? 'Copiado!' : 'Copiar linha digitável'}
              </Button>
            </div>
          )}

          {result.invoice_url && (
            <a
              href={result.invoice_url}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ variant: 'outline', className: 'w-full' })}
            >
              Ver comprovante / fatura
            </a>
          )}

          <Button type="button" variant="ghost" className="w-full" onClick={() => setView('form')}>
            Fazer outra doação
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardTitle>{title}</CardTitle>
      <CardContent>
        <p className="mb-4 text-sm text-brand-text/70">{subtitle}</p>

        {error && (
          <Alert variant="destructive" className="mb-4">
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {QUICK_AMOUNTS.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setAmount(String(value))}
                className={`rounded-xl border px-3 py-3 text-sm font-semibold transition focus-ring ${
                  parseFloat(amount) === value
                    ? 'border-brand-primary bg-brand-primary-light text-brand-brown'
                    : 'border-brand-primary-light bg-white hover:bg-brand-primary-light/40'
                }`}
              >
                {formatBRL(value)}
              </button>
            ))}
          </div>

          <Input
            label="Valor (R$)"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />

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

          {isCard && (
            <fieldset className="space-y-4 rounded-xl border border-brand-primary-light p-4">
              <legend className="px-1 text-sm font-medium text-brand-brown">
                Dados do cartão
              </legend>
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
                  autoComplete="cc-exp-month"
                  required
                />
                <Input
                  label="Ano *"
                  placeholder="AAAA"
                  inputMode="numeric"
                  value={expiryYear}
                  onChange={(e) => setExpiryYear(onlyDigits(e.target.value, 4))}
                  autoComplete="cc-exp-year"
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
              <Input
                label="CEP *"
                inputMode="numeric"
                value={postalCode}
                onChange={(e) => setPostalCode(onlyDigits(e.target.value, 8))}
                autoComplete="postal-code"
                required
              />
              <Input
                label="Número do endereço *"
                value={addressNumber}
                onChange={(e) => setAddressNumber(e.target.value)}
                required
              />
            </fieldset>
          )}

          <Alert>
            {isCard
              ? 'Seu cartão é enviado diretamente ao Asaas. Não salvamos número completo nem CVV.'
              : 'O boleto será emitido pelo Asaas. Pague até a data de vencimento indicada.'}
          </Alert>

          <Button type="submit" className="w-full" size="lg">
            {isCard ? 'Pagar com cartão' : 'Gerar boleto'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
