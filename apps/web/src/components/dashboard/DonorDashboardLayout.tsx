'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { DonorShell, LoadingState } from '@lardosanjos/ui';
import { DonorApiError, donorLogout, getDonorAccessToken } from '@/lib/donor-auth';
import { DonorProfile, fetchDonorProfile } from '@/lib/donor-api';

function useDonorAuth() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(true);
  const [profile, setProfile] = React.useState<DonorProfile | null>(null);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    const token = getDonorAccessToken();
    if (!token) {
      router.replace('/entrar');
      return;
    }

    fetchDonorProfile()
      .then(setProfile)
      .catch((err) => {
        if (err instanceof DonorApiError && err.status === 401) {
          router.replace('/entrar');
          return;
        }
        if (err instanceof DonorApiError && err.status === 403) {
          setError('Sua conta ainda não possui perfil de doador vinculado.');
          return;
        }
        setError(err instanceof Error ? err.message : 'Erro ao carregar');
      })
      .finally(() => setLoading(false));
  }, [router]);

  async function logout() {
    await donorLogout();
    router.replace('/entrar');
  }

  return { loading, profile, error, logout };
}

export function DonorDashboardLayout({ children }: { children: React.ReactNode }) {
  const { loading, profile, error, logout } = useDonorAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-bg p-8">
        <LoadingState message="Carregando sua área..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <DonorShell donorName={profile?.full_name}>
      <div className="mb-4 flex justify-end">
        <button
          type="button"
          onClick={logout}
          className="text-sm text-brand-primary underline focus-ring rounded"
        >
          Sair
        </button>
      </div>
      {children}
    </DonorShell>
  );
}
