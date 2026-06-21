import { InstitutionalLayout } from '@/components/institutional/InstitutionalLayout';
import { buildPageMetadata } from '@/lib/seo';

export const metadata = buildPageMetadata({
  title: 'Sobre nós',
  description:
    'Conheça o Lar dos Anjos Pet: missão, valores e história do abrigo de animais em Brasília.',
  path: '/sobre',
});

export default function SobrePage() {
  return (
    <InstitutionalLayout
      title="Sobre o Lar dos Anjos Pet"
      description="Resgate, cuidado e transparência desde o coração de Brasília."
    >
      <section>
        <h2 className="font-heading text-xl font-semibold text-brand-brown">Nossa missão</h2>
        <p>
          O Lar dos Anjos Pet acolhe animais abandonados, maltratados ou em situação de risco,
          oferecendo tratamento veterinário, alimentação, socialização e preparo para adoção
          responsável. Acreditamos que cada pet merece um lar cheio de amor.
        </p>
      </section>

      <section>
        <h2 className="font-heading text-xl font-semibold text-brand-brown">Como trabalhamos</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>Resgate humanizado com avaliação veterinária imediata</li>
          <li>Castração, vacinação e acompanhamento de saúde</li>
          <li>Processo de adoção com triagem cuidadosa</li>
          <li>Prestação de contas pública de receitas e despesas confirmadas</li>
        </ul>
      </section>

      <section>
        <h2 className="font-heading text-xl font-semibold text-brand-brown">Transparência</h2>
        <p>
          Publicamos receitas confirmadas (Asaas recebido/confirmado e Pix avulso confirmado
          manualmente) e despesas categorizadas. Doações pendentes nunca entram nos totais
          publicados.
        </p>
      </section>
    </InstitutionalLayout>
  );
}
