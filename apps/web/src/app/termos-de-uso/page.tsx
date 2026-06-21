import Link from 'next/link';
import { InstitutionalLayout } from '@/components/institutional/InstitutionalLayout';
import { buildPageMetadata } from '@/lib/seo';

export const metadata = buildPageMetadata({
  title: 'Termos de Uso',
  description: 'Termos e condições de uso da plataforma de doações Lar dos Anjos Pet.',
  path: '/termos-de-uso',
});

export default function TermosDeUsoPage() {
  return (
    <InstitutionalLayout title="Termos de Uso">
      <p className="text-sm text-brand-text/60">
        <em>Última atualização: junho de 2026</em>
      </p>

      <section>
        <h2 className="font-heading text-xl font-semibold text-brand-brown">1. Aceitação</h2>
        <p>
          Ao utilizar esta plataforma, você concorda com estes termos. Se não concordar, não
          utilize os serviços de doação online.
        </p>
      </section>

      <section>
        <h2 className="font-heading text-xl font-semibold text-brand-brown">2. Doações</h2>
        <p>
          As doações são voluntárias e destinam-se ao sustento dos animais acolhidos. Doações via
          Pix avulso geram BR Code internamente (sem Asaas) e só são contabilizadas após
          confirmação manual pela equipe financeira. Pagamentos pendentes nunca são tratados como
          confirmados.
        </p>
      </section>

      <section>
        <h2 className="font-heading text-xl font-semibold text-brand-brown">3. Assinaturas recorrentes</h2>
        <p>
          Planos mensais são processados via Asaas (cartão ou boleto). Você pode alterar o plano
          ou cancelar pela área do doador. O cancelamento encerra cobranças futuras; benefícios
          já pagos permanecem até o fim do ciclo.
        </p>
      </section>

      <section>
        <h2 className="font-heading text-xl font-semibold text-brand-brown">4. Mural público</h2>
        <p>
          Ao optar por aparecer no Mural dos Anjos, você autoriza a exibição do nome escolhido
          (ou &ldquo;Anjo Anônimo&rdquo;) conforme suas preferências. Valores nunca são exibidos
          publicamente.
        </p>
      </section>

      <section>
        <h2 className="font-heading text-xl font-semibold text-brand-brown">5. Responsabilidades</h2>
        <p>
          O usuário é responsável pela veracidade dos dados informados. A ONG se compromete a
          utilizar os recursos arrecadados conforme descrito no portal de transparência.
        </p>
      </section>

      <p className="text-sm">
        Consulte a{' '}
        <Link href="/politica-de-privacidade" className="text-brand-primary underline">
          Política de Privacidade
        </Link>
        .
      </p>
    </InstitutionalLayout>
  );
}
