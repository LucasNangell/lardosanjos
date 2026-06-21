import Link from 'next/link';
import { PublicHeader, PublicFooter, Button } from '@lardosanjos/ui';
import { buildPageMetadata } from '@/lib/seo';

export const metadata = buildPageMetadata({
  title: 'Pagamento pendente',
  description: 'Seu pagamento está aguardando confirmação.',
  path: '/doacao/pendente',
  noIndex: true,
});

export default function DoacaoPendentePage() {
  return (
    <>
      <PublicHeader />
      <main className="mx-auto flex max-w-lg flex-1 flex-col items-center px-4 py-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-3xl text-amber-700">
          ⏳
        </div>
        <h1 className="font-heading mt-6 text-3xl font-bold text-brand-brown">
          Pagamento pendente
        </h1>
        <p className="mt-3 text-brand-text/70">
          Seu pagamento ainda não foi confirmado. Pix avulsos aguardam validação manual;
          boletos e cartões podem levar alguns minutos ou dias úteis. Pagamentos pendentes não
          entram na transparência até confirmação.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/dashboard/doacoes">
            <Button>Acompanhar doações</Button>
          </Link>
          <Link href="/faq">
            <Button variant="outline">Ver FAQ</Button>
          </Link>
        </div>
      </main>
      <PublicFooter />
    </>
  );
}
