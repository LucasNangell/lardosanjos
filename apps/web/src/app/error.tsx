'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { PublicHeader, PublicFooter, Button } from '@lardosanjos/ui';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <>
      <PublicHeader />
      <main className="mx-auto flex max-w-lg flex-1 flex-col items-center justify-center px-4 py-16 text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-accent">Erro</p>
        <h1 className="font-heading mt-2 text-3xl font-bold text-brand-brown">
          Algo deu errado
        </h1>
        <p className="mt-3 text-brand-text/70">
          Não foi possível carregar esta página. Tente novamente ou volte ao início.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button type="button" onClick={() => reset()}>
            Tentar novamente
          </Button>
          <Link href="/">
            <Button variant="outline">Ir para o início</Button>
          </Link>
        </div>
      </main>
      <PublicFooter />
    </>
  );
}
