'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button, Alert, LoadingState } from '@lardosanjos/ui';
import { fetchDonorProfile, updateDonorPrivacy } from '@/lib/donor-api';
import { DonorApiError } from '@/lib/donor-auth';

export default function PrivacidadePage() {
  const [wantsPublicMural, setWantsPublicMural] = React.useState(false);
  const [wantsAnonymous, setWantsAnonymous] = React.useState(true);
  const [communicationEmail, setCommunicationEmail] = React.useState(true);
  const [communicationWhatsapp, setCommunicationWhatsapp] = React.useState(false);
  const [message, setMessage] = React.useState('');
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    fetchDonorProfile()
      .then((profile) => {
        setWantsPublicMural(profile.wants_public_profile);
        setWantsAnonymous(profile.public_display_type === 'ANONYMOUS');
        setCommunicationEmail(profile.communication_email);
        setCommunicationWhatsapp(profile.communication_whatsapp);
      })
      .catch((err) =>
        setError(err instanceof DonorApiError ? err.message : 'Erro ao carregar'),
      )
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const result = await updateDonorPrivacy({
        wants_public_profile: wantsPublicMural,
        public_display_type: wantsAnonymous ? 'ANONYMOUS' : 'FULL_NAME',
        communication_email: communicationEmail,
        communication_whatsapp: communicationWhatsapp,
      });
      setMessage(result.message);
    } catch (err) {
      setError(err instanceof DonorApiError ? err.message : 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingState message="Carregando preferências..." />;

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-bold text-brand-brown">Privacidade</h1>
        <p className="mt-1 text-sm text-brand-text/70">
          Controle como seu nome aparece e como podemos entrar em contato. Leia também nossa{' '}
          <Link href="/privacidade" className="text-brand-primary underline">
            política de privacidade
          </Link>
          .
        </p>
      </header>

      {message && <Alert variant="success">{message}</Alert>}
      {error && <Alert variant="destructive">{error}</Alert>}

      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-brand-primary-light bg-white p-5">
        <label className="flex cursor-pointer items-start gap-3 text-sm">
          <input
            type="checkbox"
            className="mt-1"
            checked={wantsAnonymous}
            onChange={(e) => setWantsAnonymous(e.target.checked)}
          />
          <span>Prefiro permanecer anônimo no Mural dos Anjos</span>
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
            Autorizo exibir meu nome no Mural após confirmação manual da doação (somente doações
            confirmadas)
          </span>
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

        <Alert>
          Você pode solicitar exclusão ou portabilidade de dados entrando em contato com o abrigo.
          A exclusão total automatizada será disponibilizada em fase futura.
        </Alert>

        <Button type="submit" loading={saving}>
          Salvar preferências
        </Button>
      </form>
    </div>
  );
}
