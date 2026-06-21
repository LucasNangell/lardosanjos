'use client';

import * as React from 'react';
import { Button, Input, Alert, LoadingState } from '@lardosanjos/ui';
import { DonorProfile, fetchDonorProfile, updateDonorProfile } from '@/lib/donor-api';
import { DonorApiError } from '@/lib/donor-auth';

export default function MeusDadosPage() {
  const [profile, setProfile] = React.useState<DonorProfile | null>(null);
  const [message, setMessage] = React.useState('');
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    fetchDonorProfile()
      .then(setProfile)
      .catch((err) =>
        setError(err instanceof DonorApiError ? err.message : 'Erro ao carregar'),
      )
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const updated = await updateDonorProfile({
        full_name: profile.full_name,
        public_name: profile.public_name ?? undefined,
        email: profile.email,
        phone: profile.phone ?? undefined,
        birth_date: profile.birth_date ?? undefined,
        zip_code: profile.zip_code ?? undefined,
        address: profile.address ?? undefined,
        address_number: profile.address_number ?? undefined,
        address_complement: profile.address_complement ?? undefined,
        neighborhood: profile.neighborhood ?? undefined,
        city: profile.city ?? undefined,
        state: profile.state ?? undefined,
      });
      setProfile(updated);
      setMessage('Dados atualizados com sucesso.');
    } catch (err) {
      setError(err instanceof DonorApiError ? err.message : 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingState message="Carregando seus dados..." />;

  if (!profile) return null;

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-bold text-brand-brown">Meus dados</h1>
        <p className="mt-1 text-sm text-brand-text/70">
          Mantenha suas informações atualizadas. CPF/CNPJ é exibido parcialmente por segurança.
        </p>
      </header>

      {message && <Alert variant="success">{message}</Alert>}
      {error && <Alert variant="destructive">{error}</Alert>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nome completo"
          value={profile.full_name}
          onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
          required
        />
        <Input
          label="Nome público (mural)"
          value={profile.public_name ?? ''}
          onChange={(e) => setProfile({ ...profile, public_name: e.target.value })}
        />
        <Input
          label="E-mail"
          type="email"
          value={profile.email}
          onChange={(e) => setProfile({ ...profile, email: e.target.value })}
          required
        />
        <Input
          label="WhatsApp"
          value={profile.phone ?? ''}
          onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
        />
        <Input label="CPF/CNPJ" value={profile.cpf_cnpj ?? 'Não informado'} disabled />
        <Input
          label="CEP"
          value={profile.zip_code ?? ''}
          onChange={(e) => setProfile({ ...profile, zip_code: e.target.value })}
        />
        <Input
          label="Endereço"
          value={profile.address ?? ''}
          onChange={(e) => setProfile({ ...profile, address: e.target.value })}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label="Número"
            value={profile.address_number ?? ''}
            onChange={(e) => setProfile({ ...profile, address_number: e.target.value })}
          />
          <Input
            label="UF"
            maxLength={2}
            value={profile.state ?? ''}
            onChange={(e) => setProfile({ ...profile, state: e.target.value.toUpperCase() })}
          />
        </div>
        <Input
          label="Cidade"
          value={profile.city ?? ''}
          onChange={(e) => setProfile({ ...profile, city: e.target.value })}
        />

        <Button type="submit" loading={saving}>
          Salvar alterações
        </Button>
      </form>
    </div>
  );
}
