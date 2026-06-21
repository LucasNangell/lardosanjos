import Link from 'next/link';
import { PublicHeader, PublicFooter, Button } from '@lardosanjos/ui';
import { buildPageMetadata } from '@/lib/seo';

export const metadata = buildPageMetadata({
  title: 'Falha no pagamento',
  description: 'Não foi possível concluir seu pagamento.',
  path: '/doacao/falha',
  noIndex: true,
});

export default function DoacaoFalhaPage({
  searchParams,
}: {
  searchParams: { motivo?: string };
}) {
  return (
    <>
      <PublicHeader />
      <main className="mx-auto flex max-w-lg flex-1 flex-col items-center px-4 py-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-3xl text-red-700">
          !
        </div>
        <h1 className="font-heading mt-6 text-3xl font-bold text-brand-brown">
          Não foi possível concluir
        </h1>
        <p className="mt-3 text-brand-text/70">
          {searchParams.motivo ||
            'O pagamento não foi processado. Verifique os dados ou tente outro método.'}
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/doar-unica">
            <Button>Tentar novamente</Button>
          </Link>
          <Link href="/contato">
            <Button variant="outline">Falar conosco</Button>
          </Link>
        </div>
      </main>
      <PublicFooter />
    </>
  );
}
