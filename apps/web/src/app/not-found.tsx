import Link from 'next/link';
import { PublicHeader, PublicFooter, Button } from '@lardosanjos/ui';

export const metadata = {
  title: 'Página não encontrada',
  robots: { index: false, follow: false },
};

export default function NotFoundPage() {
  return (
    <>
      <PublicHeader />
      <main className="mx-auto flex max-w-lg flex-1 flex-col items-center justify-center px-4 py-16 text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-primary">Erro 404</p>
        <h1 className="font-heading mt-2 text-3xl font-bold text-brand-brown">
          Esta página não existe
        </h1>
        <p className="mt-3 text-brand-text/70">
          O endereço pode estar incorreto ou o conteúdo foi movido. Que tal voltar ao início ou
          fazer uma doação?
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/">
            <Button>Ir para o início</Button>
          </Link>
          <Link href="/doar-unica">
            <Button variant="outline">Doar agora</Button>
          </Link>
        </div>
      </main>
      <PublicFooter />
    </>
  );
}
