import { InstitutionalLayout } from '@/components/institutional/InstitutionalLayout';
import { ContatoForm } from '@/components/institutional/ContatoForm';
import { buildPageMetadata } from '@/lib/seo';

export const metadata = buildPageMetadata({
  title: 'Contato',
  description: 'Entre em contato com o Lar dos Anjos Pet para doações, adoção e parcerias.',
  path: '/contato',
});

export default function ContatoPage() {
  return (
    <InstitutionalLayout
      title="Contato"
      description="Estamos à disposição para dúvidas sobre doações, adoção e parcerias."
    >
      <section>
        <h2 className="font-heading text-xl font-semibold text-brand-brown">Canais</h2>
        <ul className="space-y-2">
          <li>
            E-mail geral:{' '}
            <a href="mailto:contato@lardosanjos.online" className="text-brand-primary underline">
              contato@lardosanjos.online
            </a>
          </li>
          <li>
            Privacidade (LGPD):{' '}
            <a href="mailto:privacidade@lardosanjos.online" className="text-brand-primary underline">
              privacidade@lardosanjos.online
            </a>
          </li>
          <li>
            Voluntariado:{' '}
            <a href="mailto:voluntarios@lardosanjos.online" className="text-brand-primary underline">
              voluntarios@lardosanjos.online
            </a>
          </li>
        </ul>
        <p className="mt-4 text-sm text-brand-text/60">Brasília, Distrito Federal — Brasil</p>
      </section>

      <section>
        <h2 className="font-heading text-xl font-semibold text-brand-brown">Envie uma mensagem</h2>
        <ContatoForm />
      </section>
    </InstitutionalLayout>
  );
}
