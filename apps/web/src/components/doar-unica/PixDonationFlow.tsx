'use client';

import * as React from 'react';
import {
  Button,
  Input,
  Textarea,
  Card,
  CardTitle,
  CardContent,
  Alert,
  LoadingState,
  Badge,
  buttonVariants,
} from '@lardosanjos/ui';
import {
  createPixDonation,
  DonationView,
  fetchPixSettings,
  fetchPixStatus,
  formatBRL,
  mapStatusToView,
  markPixAsPaid,
  PixDonationResponse,
  PixSettings,
  qrCodeSrc,
  uploadPixReceipt,
  validateReceiptFile,
} from '@/lib/pix-donation';

export function PixDonationContent({ campaignId }: { campaignId?: string }) {
  const [view, setView] = React.useState<DonationView>('loading_settings');
  const [settings, setSettings] = React.useState<PixSettings | null>(null);
  const [error, setError] = React.useState('');
  const [donation, setDonation] = React.useState<PixDonationResponse | null>(null);
  const [copied, setCopied] = React.useState(false);

  const [amount, setAmount] = React.useState('');
  const [donorName, setDonorName] = React.useState('');
  const [donorEmail, setDonorEmail] = React.useState('');
  const [donorPhone, setDonorPhone] = React.useState('');
  const [wantsPublicMural, setWantsPublicMural] = React.useState(false);
  const [wantsAnonymous, setWantsAnonymous] = React.useState(true);
  const [donorMessage, setDonorMessage] = React.useState('');
  const [receiptFile, setReceiptFile] = React.useState<File | null>(null);
  const [fileError, setFileError] = React.useState('');

  React.useEffect(() => {
    fetchPixSettings()
      .then((data) => {
        setSettings(data);
        const defaultAmount =
          data.quick_amounts[0] ?? data.min_amount ?? 10;
        setAmount(String(defaultAmount));
        setView('form');
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Erro ao carregar');
        setView('error');
      });
  }, []);

  React.useEffect(() => {
    if (!donation?.id) return;
    if (!['payment', 'receipt', 'waiting', 'thank_you'].includes(view)) return;

    const interval = setInterval(async () => {
      try {
        const status = await fetchPixStatus(donation.id);
        setDonation((prev) =>
          prev ? { ...prev, status: status.status } : prev,
        );
        const next = mapStatusToView(status.status, view);
        if (next !== view) setView(next);
      } catch {
        /* polling silencioso */
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [donation?.id, view]);

  function selectQuickAmount(value: number) {
    setAmount(String(value));
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!settings) return;

    const numericAmount = parseFloat(amount.replace(',', '.'));
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setError('Informe um valor válido.');
      return;
    }

    if (numericAmount < settings.min_amount) {
      setError(`Valor mínimo: ${formatBRL(settings.min_amount)}`);
      return;
    }

    setView('generating');
    setError('');

    try {
      const result = await createPixDonation({
        amount: numericAmount,
        donor_name: donorName || undefined,
        donor_email: donorEmail || undefined,
        donor_phone: donorPhone || undefined,
        wants_public_mural: wantsPublicMural,
        wants_anonymous: wantsAnonymous,
        donor_message: donorMessage || undefined,
        campaign_id: campaignId,
      });
      setDonation(result);
      setView('payment');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado');
      setView('form');
    }
  }

  async function handleCopy() {
    if (!donation?.pix_payload) return;
    await navigator.clipboard.writeText(donation.pix_payload);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  async function handleMarkAsPaid() {
    if (!donation) return;
    setView('generating');
    setError('');
    try {
      const result = await markPixAsPaid(donation.id);
      setDonation({ ...donation, status: result.status });
      setView(settings?.require_receipt_upload ? 'receipt' : 'waiting');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado');
      setView('payment');
    }
  }

  function handleFileChange(file: File | null) {
    setFileError('');
    if (!file) {
      setReceiptFile(null);
      return;
    }
    try {
      validateReceiptFile(file);
      setReceiptFile(file);
    } catch (err) {
      setReceiptFile(null);
      setFileError(err instanceof Error ? err.message : 'Arquivo inválido');
    }
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!donation || !receiptFile) return;
    setView('generating');
    setError('');
    try {
      const result = await uploadPixReceipt(donation.id, receiptFile);
      setDonation({ ...donation, status: result.status });
      setView('thank_you');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado');
      setView('receipt');
    }
  }

  return (
    <>
        {error && view !== 'loading_settings' && (
          <Alert variant="destructive" className="mb-4">
            {error}
          </Alert>
        )}

        {view === 'loading_settings' && <LoadingState message="Carregando opções de doação..." />}

        {view === 'error' && !settings && (
          <Alert variant="destructive">
            Não foi possível carregar o formulário de doação. Tente novamente mais tarde.
          </Alert>
        )}

        {view === 'form' && settings && (
          <Card>
            <CardTitle>Quanto você deseja doar?</CardTitle>
            <CardContent>
              {settings.instructions && (
                <p className="mb-4 text-sm text-brand-text/70">{settings.instructions}</p>
              )}

              {settings.quick_amounts.length > 0 && (
                <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {settings.quick_amounts.map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => selectQuickAmount(value)}
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
              )}

              <form onSubmit={handleGenerate} className="space-y-4">
                {settings.allow_custom_amount && (
                  <Input
                    label="Outro valor (R$)"
                    inputMode="decimal"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                  />
                )}

                <Input
                  label={`Nome${settings.require_donor_data ? ' *' : ' (opcional)'}`}
                  value={donorName}
                  onChange={(e) => setDonorName(e.target.value)}
                  required={settings.require_donor_data}
                />
                <Input
                  label={`E-mail${settings.require_donor_data ? ' *' : ' (opcional)'}`}
                  type="email"
                  value={donorEmail}
                  onChange={(e) => setDonorEmail(e.target.value)}
                  required={settings.require_donor_data}
                />
                <Input
                  label="WhatsApp (opcional)"
                  type="tel"
                  placeholder="(61) 99999-9999"
                  value={donorPhone}
                  onChange={(e) => setDonorPhone(e.target.value)}
                />
                <Textarea
                  label="Mensagem de carinho (opcional)"
                  value={donorMessage}
                  onChange={(e) => setDonorMessage(e.target.value)}
                  maxLength={255}
                />

                <fieldset className="space-y-3 rounded-xl border border-brand-primary-light bg-brand-bg/50 p-4">
                  <legend className="px-1 text-sm font-medium text-brand-brown">
                    Privacidade
                  </legend>
                  <label className="flex cursor-pointer items-start gap-3 text-sm">
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={wantsAnonymous}
                      onChange={(e) => setWantsAnonymous(e.target.checked)}
                    />
                    <span>Prefiro doar de forma anônima no Mural dos Anjos</span>
                  </label>
                  <label className="flex cursor-pointer items-start gap-3 text-sm">
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={wantsPublicMural}
                      onChange={(e) => setWantsPublicMural(e.target.checked)}
                      disabled={wantsAnonymous}
                    />
                    <span>
                      Autorizo aparecer no Mural dos Anjos com meu nome de exibição
                      (somente após confirmação manual da doação)
                    </span>
                  </label>
                </fieldset>

                <Alert>
                  Gerar o Pix não confirma o pagamento. Nossa equipe validará manualmente
                  antes de contabilizar a doação na transparência pública.
                </Alert>

                <Button type="submit" className="w-full" size="lg">
                  Gerar Pix
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {view === 'generating' && <LoadingState message="Processando..." />}

        {view === 'payment' && donation && (
          <Card>
            <CardTitle>Pague com Pix</CardTitle>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-2xl font-bold text-brand-primary">
                  {formatBRL(Number(donation.amount))}
                </p>
                <Badge variant="warning">Aguardando pagamento</Badge>
              </div>

              {donation.receiver_name && (
                <p className="text-sm text-brand-text/70">
                  Beneficiário: <strong>{donation.receiver_name}</strong>
                </p>
              )}

              {donation.instructions && (
                <p className="text-sm text-brand-text/70">{donation.instructions}</p>
              )}

              {donation.pix_qr_code_base64 && (
                <img
                  src={qrCodeSrc(donation.pix_qr_code_base64)}
                  alt="QR Code Pix para doação"
                  className="mx-auto h-52 w-52 max-w-full rounded-xl border border-brand-primary-light bg-white p-2 sm:h-60 sm:w-60"
                />
              )}

              <div className="rounded-xl bg-brand-primary-light/40 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-brown">
                  Pix Copia e Cola
                </p>
                <p className="mt-2 break-all font-mono text-xs leading-relaxed text-brand-text">
                  {donation.pix_payload}
                </p>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <Button type="button" variant="outline" onClick={handleCopy}>
                  {copied ? 'Copiado!' : 'Copiar código Pix'}
                </Button>
                <Button type="button" onClick={handleMarkAsPaid}>
                  Já fiz o Pix
                </Button>
              </div>

              <Alert>
                O QR Code e o botão &quot;Já fiz o Pix&quot; <strong>não confirmam</strong> o
                pagamento. Envie comprovantes verdadeiros — declarações falsas podem ser
                rejeitadas.
              </Alert>
            </CardContent>
          </Card>
        )}

        {view === 'receipt' && donation && (
          <Card>
            <CardTitle>Enviar comprovante</CardTitle>
            <CardContent>
              <p className="mb-4 text-sm text-brand-text/70">
                Anexe o comprovante da transferência. Isso ajuda nossa equipe a validar mais
                rápido — mas a confirmação ainda é manual.
              </p>
              <form onSubmit={handleUpload} className="space-y-4">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                  className="w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-brand-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-white"
                  required
                />
                <p className="text-xs text-brand-text/60">PDF, JPG ou PNG — máximo 5 MB</p>
                {fileError && (
                  <p className="text-xs text-red-600" role="alert">
                    {fileError}
                  </p>
                )}
                <Button type="submit" className="w-full" disabled={!receiptFile}>
                  Enviar comprovante
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {(view === 'waiting' || view === 'thank_you') && donation && (
          <Card>
            <CardTitle>Obrigado pelo seu apoio!</CardTitle>
            <CardContent className="space-y-4">
              <Badge variant="warning">Aguardando confirmação manual</Badge>
              <Alert variant="success">
                Recebemos sua intenção de doação de {formatBRL(Number(donation.amount))}.
                Nossa equipe analisará o comprovante e confirmará manualmente.
              </Alert>
              <p className="text-sm text-brand-text/70">
                Enquanto isso, a doação <strong>não aparece</strong> no portal de
                transparência nem no impacto confirmado. A confirmação pode levar algumas
                horas ou dias úteis.
              </p>
            </CardContent>
          </Card>
        )}

        {view === 'confirmed' && donation && (
          <Card>
            <CardTitle>Doação confirmada!</CardTitle>
            <CardContent className="space-y-4">
              <Badge variant="success">Confirmado pela administração</Badge>
              <Alert variant="success">
                Sua doação de {formatBRL(Number(donation.amount))} foi confirmada. Muito
                obrigado por apoiar o Lar dos Anjos Pet!
              </Alert>
            </CardContent>
          </Card>
        )}

        {view === 'rejected' && (
          <Card>
            <CardTitle>Não foi possível confirmar</CardTitle>
            <CardContent>
              <Alert variant="destructive">
                Esta doação foi rejeitada ou marcada como duplicada. Se acredita que houve
                um engano, entre em contato com o abrigo.
              </Alert>
            </CardContent>
          </Card>
        )}

        {view === 'expired' && (
          <Card>
            <CardTitle>Pix expirado</CardTitle>
            <CardContent className="space-y-4">
              <Alert variant="destructive">
                O prazo deste Pix expirou. Gere uma nova doação para continuar.
              </Alert>
              <Button onClick={() => setView('form')}>Gerar novo Pix</Button>
            </CardContent>
          </Card>
        )}
    </>
  );
}

/** @deprecated Use PixDonationContent inside DoarUnicaCheckout */
export function PixDonationFlow() {
  return <PixDonationContent />;
}
