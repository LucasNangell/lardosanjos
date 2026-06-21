import { PublicHeader, PublicFooter, EmptyState } from '@lardosanjos/ui';
import { fetchApi } from '@/lib/api';
import {
  TransparencyPayload,
  TransparencyPortal,
} from '@/components/transparency/TransparencyPortal';

async function getTransparency(): Promise<TransparencyPayload | null> {
  try {
    return await fetchApi<TransparencyPayload>('/public/transparency');
  } catch {
    return null;
  }
}

export default async function TransparenciaPage() {
  const data = await getTransparency();

  return (
    <>
      <PublicHeader />
      <main className="mx-auto max-w-6xl flex-1 px-4 py-10">
        <h1 className="font-heading text-3xl font-bold text-brand-brown">Portal de Transparência</h1>
        <p className="mt-2 max-w-3xl text-brand-text/70">
          Prestação de contas com receitas confirmadas (Asaas recebido/confirmado e Pix avulso confirmado
          manualmente). Pix pendente, rejeitado ou duplicado não entra nos totais.
        </p>

        {!data ? (
          <div className="mt-8">
            <EmptyState
              title="Dados indisponíveis"
              description="Não foi possível carregar a transparência financeira. Tente novamente mais tarde."
            />
          </div>
        ) : data.data_state === 'empty' ? (
          <div className="mt-8 space-y-6">
            <EmptyState
              title="Ainda sem movimentação confirmada"
              description="Quando houver doações confirmadas e despesas públicas cadastradas, os gráficos aparecerão aqui."
            />
            <TransparencyPortal data={data} />
          </div>
        ) : (
          <div className="mt-8">
            <TransparencyPortal data={data} />
          </div>
        )}
      </main>
      <PublicFooter />
    </>
  );
}
