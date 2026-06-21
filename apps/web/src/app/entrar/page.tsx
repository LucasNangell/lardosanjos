'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PublicHeader, PublicFooter, Button, Input, Alert, Card, CardTitle, CardContent } from '@lardosanjos/ui';
import { donorLogin, DonorApiError } from '@/lib/donor-auth';

export default function EntrarPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await donorLogin(email, password);
      router.replace('/dashboard');
    } catch (err) {
      setError(
        err instanceof DonorApiError
          ? err.message
          : 'Não foi possível entrar. Verifique e-mail e senha.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <PublicHeader />
      <main className="mx-auto max-w-md flex-1 px-4 py-12">
        <Card>
          <CardTitle>Área do doador</CardTitle>
          <CardContent>
            <p className="mb-4 text-sm text-brand-text/70">
              Acesse seu histórico de doações confirmadas, impacto e preferências de privacidade.
            </p>
            {error && (
              <Alert variant="destructive" className="mb-4">
                {error}
              </Alert>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="E-mail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Input
                label="Senha"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Button type="submit" className="w-full" loading={loading}>
                Entrar
              </Button>
            </form>
            <p className="mt-4 text-center text-sm text-brand-text/60">
              Ainda não doou?{' '}
              <Link href="/doar-unica" className="text-brand-primary underline">
                Faça uma doação
              </Link>
            </p>
          </CardContent>
        </Card>
      </main>
      <PublicFooter />
    </>
  );
}
