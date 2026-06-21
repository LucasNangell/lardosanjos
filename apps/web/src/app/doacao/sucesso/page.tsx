import Link from 'next/link';
import { PublicHeader, PublicFooter, Button } from '@lardosanjos/ui';
import { buildPageMetadata } from '@/lib/seo';

export const metadata = buildPageMetadata({
  title: 'Doação recebida',
  description: 'Obrigado por apoiar o Lar dos Anjos Pet.',
  path: '/doacao/sucesso',
  noIndex: true,
});

export default function DoacaoSucessoPage({
  searchParams,
}: {
  searchParams: { tipo?: string };
}) {
  const tipo = searchParams.tipo === 'pix' ? 'Pix' : searchParams.tipo === 'assinatura' ? 'assinatura' : 'doação';

  return (
    <>
      <PublicHeader />
      <main className="mx-auto flex max-w-lg flex-1 flex-col items-center px-4 py-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-primary-light text-3xl text-brand-primary">
          ✓
        </div>
        <h1 className="font-heading mt-6 text-3xl font-bold text-brand-brown">
          Obrigado pela sua {tipo}!
        </h1>
        <p className="mt-3 text-brand-text/70">
          {searchParams.tipo === 'pix'
            ? 'Seu Pix foi registrado. A confirmação manual pode levar algumas horas úteis antes de aparecer na transparência.'
            : 'Sua contribuição faz diferença na vida dos nossos anjos de quatro patas.'}
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/dashboard">
            <Button>Minha área</Button>
          </Link>
          <Link href="/transparencia">
            <Button variant="outline">Ver transparência</Button>
          </Link>
        </div>
      </main>
      <PublicFooter />
    </>
  );
}
