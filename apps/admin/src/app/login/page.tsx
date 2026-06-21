'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@lardosanjos/ui';
import { ApiError, completeMfaLogin, getAccessToken, loginAdmin } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [mfaCode, setMfaCode] = React.useState('');
  const [mfaSession, setMfaSession] = React.useState<string | null>(null);
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (getAccessToken()) {
      router.replace('/dashboard');
    }
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mfaSession) {
        await completeMfaLogin(mfaSession, mfaCode);
        router.replace('/dashboard');
        return;
      }

      const result = await loginAdmin(email, password);
      if (result.requiresMfa) {
        setMfaSession(result.mfaSessionToken);
        return;
      }
      router.replace('/dashboard');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Falha no login');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: '100%',
          maxWidth: 420,
          background: '#fff',
          padding: '2rem',
          borderRadius: 8,
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
        }}
      >
        <h1 style={{ color: '#6A4F36', marginTop: 0 }}>Painel Administrativo</h1>
        <p style={{ color: '#666', marginBottom: '1.5rem' }}>
          {mfaSession ? 'Digite o código do autenticador' : 'Acesso restrito à equipe Lar dos Anjos Pet'}
        </p>

        {error && (
          <div
            style={{
              background: '#fdecea',
              color: '#b71c1c',
              padding: '0.75rem',
              borderRadius: 4,
              marginBottom: '1rem',
            }}
          >
            {error}
          </div>
        )}

        {!mfaSession && (
          <>
            <label style={{ display: 'block', marginBottom: '1rem' }}>
              <span style={{ display: 'block', marginBottom: 4 }}>E-mail</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ width: '100%', padding: '0.5rem', borderRadius: 4, border: '1px solid #ccc' }}
              />
            </label>

            <label style={{ display: 'block', marginBottom: '1rem' }}>
              <span style={{ display: 'block', marginBottom: 4 }}>Senha</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ width: '100%', padding: '0.5rem', borderRadius: 4, border: '1px solid #ccc' }}
              />
            </label>

            <p style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>
              <Link href="/redefinir-senha" style={{ color: '#2AA98C' }}>
                Esqueci minha senha
              </Link>
            </p>
          </>
        )}

        {mfaSession && (
          <label style={{ display: 'block', marginBottom: '1.5rem' }}>
            <span style={{ display: 'block', marginBottom: 4 }}>Código 2FA</span>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={mfaCode}
              onChange={(e) => setMfaCode(e.target.value)}
              required
              style={{ width: '100%', padding: '0.5rem', borderRadius: 4, border: '1px solid #ccc' }}
            />
          </label>
        )}

        <Button type="submit" disabled={loading} style={{ width: '100%' }}>
          {loading ? 'Entrando...' : mfaSession ? 'Confirmar 2FA' : 'Entrar'}
        </Button>
      </form>
    </main>
  );
}
