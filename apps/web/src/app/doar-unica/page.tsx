import { Suspense } from 'react';
import { DoarUnicaCheckout } from '@/components/doar-unica/DoarUnicaCheckout';

export const metadata = {
  title: 'Doar — Lar dos Anjos Pet',
  description:
    'Doação única via Pix interno, cartão de crédito ou boleto. Apoie o abrigo com transparência.',
};

export default function DoarUnicaPage() {
  return (
    <Suspense fallback={<div style={{ padding: '2rem' }}>Carregando...</div>}>
      <DoarUnicaCheckout />
    </Suspense>
  );
}
