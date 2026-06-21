'use client';

import * as React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { apiFetch } from '@/lib/api';

export default function RedefinirSenhaClient() {
  const params = useSearchParams();
  const token = params.get('token') ?? '';
  const [password, setPassword] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [error, setError] = React.useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await apiFetch('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, password }),
      });
      setMessage('Senha redefinida. Faça login novamente.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao redefinir senha');
    }
  }

  return (
    <main style={{ maxWidth: 420, margin: '4rem auto', padding: '2rem' }}>
      <Link href="/login" style={{ color: '#2AA98C' }}>← Login</Link>
      <h1 style={{ color: '#6A4F36' }}>Redefinir senha</h1>
      {message ? (
        <p style={{ color: '#2AA98C' }}>{message}</p>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1rem' }}>
          <label>
            Nova senha
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ display: 'block', width: '100%', padding: '0.5rem', marginTop: 4 }}
            />
          </label>
          {error && <p style={{ color: '#b71c1c' }}>{error}</p>}
          <button type="submit" style={{ padding: '0.75rem', background: '#2AA98C', color: '#fff', border: 'none', borderRadius: 6 }}>
            Salvar nova senha
          </button>
        </form>
      )}
    </main>
  );
}
