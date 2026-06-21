'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import { PublicHeader, PublicFooter } from '@lardosanjos/ui';
import { PixDonationContent } from '@/components/doar-unica/PixDonationFlow';
import { OnetimeDonationContent } from '@/components/doar-unica/OnetimeDonationContent';

type PaymentTab = 'pix' | 'card' | 'boleto';

const TABS: { id: PaymentTab; label: string; hint: string }[] = [
  {
    id: 'pix',
    label: 'Pix',
    hint: 'Interno — sem Asaas',
  },
  {
    id: 'card',
    label: 'Cartão',
    hint: 'Via Asaas',
  },
  {
    id: 'boleto',
    label: 'Boleto',
    hint: 'Via Asaas',
  },
];

export function DoarUnicaCheckout() {
  const [tab, setTab] = React.useState<PaymentTab>('pix');
  const searchParams = useSearchParams();
  const campaignId = searchParams.get('campaign') ?? undefined;

  return (
    <>
      <PublicHeader />
      <main className="mx-auto max-w-2xl flex-1 px-4 py-8 sm:py-10">
        <header className="mb-6">
          <h1 className="font-heading text-2xl font-bold text-brand-brown sm:text-3xl">
            Doação única
          </h1>
          <p className="mt-2 text-sm text-brand-text/70 sm:text-base">
            Escolha como deseja apoiar o Lar dos Anjos Pet. Pix avulso é gerado internamente;
            cartão e boleto são processados com segurança pelo Asaas.
          </p>
        </header>

        <div
          role="tablist"
          aria-label="Forma de pagamento"
          className="mb-6 grid grid-cols-3 gap-2 rounded-xl bg-brand-primary-light/30 p-1"
        >
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={tab === item.id}
              onClick={() => setTab(item.id)}
              className={`rounded-lg px-2 py-3 text-center transition focus-ring sm:px-4 ${
                tab === item.id
                  ? 'bg-white shadow-sm'
                  : 'text-brand-text/70 hover:bg-white/60'
              }`}
            >
              <span className="block text-sm font-semibold text-brand-brown">{item.label}</span>
              <span className="mt-0.5 block text-[10px] text-brand-text/60 sm:text-xs">
                {item.hint}
              </span>
            </button>
          ))}
        </div>

        {tab === 'pix' && <PixDonationContent campaignId={campaignId} />}
        {tab === 'card' && (
          <OnetimeDonationContent billingType="CREDIT_CARD" campaignId={campaignId} />
        )}
        {tab === 'boleto' && (
          <OnetimeDonationContent billingType="BOLETO" campaignId={campaignId} />
        )}
      </main>
      <PublicFooter />
    </>
  );
}
