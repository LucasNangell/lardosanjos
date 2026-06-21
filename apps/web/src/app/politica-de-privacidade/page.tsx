import Link from 'next/link';
import { InstitutionalLayout } from '@/components/institutional/InstitutionalLayout';
import { buildPageMetadata } from '@/lib/seo';

export const metadata = buildPageMetadata({
  title: 'Política de Privacidade',
  description: 'Como o Lar dos Anjos Pet trata dados de doadores em conformidade com a LGPD.',
  path: '/politica-de-privacidade',
});

export default function PoliticaPrivacidadePage() {
  return (
    <InstitutionalLayout title="Política de Privacidade">
      <p className="text-sm text-brand-text/60">
        <em>Última atualização: junho de 2026</em>
      </p>

      <section>
        <h2 className="font-heading text-xl font-semibold text-brand-brown">1. Controlador dos dados</h2>
        <p>
          O Lar dos Anjos Pet, ONG dedicada ao resgate e cuidado de animais em Brasília, é o
          controlador dos dados pessoais coletados nesta plataforma.
        </p>
      </section>

      <section>
        <h2 className="font-heading text-xl font-semibold text-brand-brown">2. Dados de doadores</h2>
        <p>
          Coletamos nome, e-mail, telefone, CPF/CNPJ (quando necessário para pagamento) e
          histórico de doações confirmadas. Esses dados são usados para processar contribuições,
          emitir comprovantes, cumprir obrigações legais de prestação de contas e, com seu
          consentimento, comunicação institucional ou exibição no Mural dos Anjos.
        </p>
      </section>

      <section>
        <h2 className="font-heading text-xl font-semibold text-brand-brown">3. Cookies e analytics</h2>
        <p>
          Cookies essenciais mantêm o funcionamento do site e da área logada. Cookies analíticos
          só são ativados após consentimento explícito no banner de cookies.
        </p>
      </section>

      <section>
        <h2 className="font-heading text-xl font-semibold text-brand-brown">4. Seus direitos (LGPD)</h2>
        <p>
          Você pode solicitar acesso, correção, portabilidade ou exclusão dos seus dados pelo
          e-mail{' '}
          <a href="mailto:privacidade@lardosanjos.online" className="text-brand-primary underline">
            privacidade@lardosanjos.online
          </a>{' '}
          ou pela área do doador em Privacidade.
        </p>
      </section>

      <section>
        <h2 className="font-heading text-xl font-semibold text-brand-brown">5. Compartilhamento</h2>
        <p>
          Compartilhamos dados apenas com processadores de pagamento (Asaas) para assinaturas,
          cartão e boleto. Doações Pix avulsas são processadas internamente; chaves e tokens
          sensíveis nunca são expostos no frontend.
        </p>
      </section>

      <section>
        <h2 className="font-heading text-xl font-semibold text-brand-brown">6. Retenção</h2>
        <p>
          Dados financeiros são mantidos pelo prazo legal de 5 anos. Você pode solicitar exclusão
          antecipada quando não houver obrigação legal de retenção.
        </p>
      </section>

      <p className="text-sm">
        Veja também os{' '}
        <Link href="/termos-de-uso" className="text-brand-primary underline">
          Termos de Uso
        </Link>
        .
      </p>
    </InstitutionalLayout>
  );
}
