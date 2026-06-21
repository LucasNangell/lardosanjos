import { InstitutionalLayout } from '@/components/institutional/InstitutionalLayout';
import { buildPageMetadata } from '@/lib/seo';

export const metadata = buildPageMetadata({
  title: 'Voluntariado',
  description: 'Seja voluntário no Lar dos Anjos Pet. Ajude no abrigo, eventos e campanhas em Brasília.',
  path: '/voluntariado',
});

export default function VoluntariadoPage() {
  return (
    <InstitutionalLayout
      title="Voluntariado"
      description="Sua presença também salva vidas. Veja como participar."
    >
      <section>
        <h2 className="font-heading text-xl font-semibold text-brand-brown">Áreas de apoio</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>Cuidados diários no abrigo (alimentação, limpeza, passeios)</li>
          <li>Apoio em feiras de adoção e eventos de arrecadação</li>
          <li>Divulgação de campanhas e histórias de animais</li>
          <li>Habilidades profissionais (design, fotografia, jurídico, TI)</li>
        </ul>
      </section>

      <section>
        <h2 className="font-heading text-xl font-semibold text-brand-brown">Como se inscrever</h2>
        <p>
          Envie um e-mail para{' '}
          <a href="mailto:voluntarios@lardosanjos.online" className="text-brand-primary underline">
            voluntarios@lardosanjos.online
          </a>{' '}
          com seu nome, disponibilidade (dias/horários) e área de interesse. Nossa equipe
          retorna conforme a demanda do abrigo.
        </p>
      </section>

      <section>
        <h2 className="font-heading text-xl font-semibold text-brand-brown">Requisitos</h2>
        <p>
          Maiores de 18 anos (ou acompanhados por responsável), comprometimento mínimo acordado
          com a coordenação e respeito aos protocolos de biossegurança e bem-estar animal.
        </p>
      </section>
    </InstitutionalLayout>
  );
}
