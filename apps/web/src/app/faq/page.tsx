import { InstitutionalLayout } from '@/components/institutional/InstitutionalLayout';
import { FaqAccordion } from '@/components/institutional/FaqAccordion';
import { FAQ_ITEMS } from '@/lib/faq';
import { buildPageMetadata, faqJsonLd, getSiteUrl } from '@/lib/seo';

export const metadata = buildPageMetadata({
  title: 'Perguntas frequentes',
  description: 'Tire dúvidas sobre doações, Pix, assinaturas, privacidade e adoção no Lar dos Anjos Pet.',
  path: '/faq',
});

export default function FaqPage() {
  const jsonLd = faqJsonLd(
    FAQ_ITEMS.map((item) => ({ question: item.question, answer: item.answer })),
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <InstitutionalLayout
        title="Perguntas frequentes"
        description="Respostas claras sobre doações, privacidade e como apoiar o abrigo."
      >
        <FaqAccordion items={FAQ_ITEMS} />
        <p className="text-sm text-brand-text/60">
          Não encontrou sua resposta?{' '}
          <a href={`${getSiteUrl()}/contato`} className="text-brand-primary underline">
            Fale conosco
          </a>
          .
        </p>
      </InstitutionalLayout>
    </>
  );
}
