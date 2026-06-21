import { PublicHeader, PublicFooter } from '@lardosanjos/ui';
import { fetchApi } from '@/lib/api';
import { SejaUmAnjoCheckout } from '@/components/seja-um-anjo/SejaUmAnjoCheckout';
import type { DonationPlan } from '@/lib/subscription-donation';

async function getPlans(): Promise<DonationPlan[]> {
  try {
    const plans = await fetchApi<DonationPlan[]>('/public/plans');
    return plans.map((plan) => ({
      ...plan,
      value: Number(plan.value),
    }));
  } catch {
    return [];
  }
}

export const metadata = {
  title: 'Seja um Anjo — Assinatura mensal',
  description:
    'Torne-se um anjo mensal do Lar dos Anjos Pet. Assinaturas via cartão ou boleto processadas com segurança.',
};

export default async function SejaUmAnjoPage() {
  const plans = await getPlans();

  return (
    <>
      <PublicHeader />
      <main className="mx-auto max-w-6xl flex-1 px-4 py-10">
        <h1 className="font-heading text-3xl font-bold text-brand-brown">Seja um Anjo</h1>
        <p className="mt-2 max-w-2xl text-brand-text/70">
          Assinaturas mensais processadas via Asaas (cartão ou boleto). Escolha um plano,
          preencha seus dados e apoie o abrigo todo mês — cancele quando quiser.
        </p>

        <SejaUmAnjoCheckout plans={plans} />
      </main>
      <PublicFooter />
    </>
  );
}
