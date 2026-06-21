const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export type SubscriptionBillingType = 'CREDIT_CARD' | 'BOLETO';

export const CUSTOM_PLAN_SLUG = 'valor-personalizado';
export const MIN_CUSTOM_AMOUNT = 10;

export interface DonationPlan {
  id: string;
  name: string;
  slug: string;
  value: number | string;
  description: string | null;
  impactText: string | null;
  isFeatured: boolean;
}

export interface SubscriptionDonationInput {
  plan_id: string;
  donor_name: string;
  donor_email: string;
  donor_phone?: string;
  cpf_cnpj?: string;
  postal_code?: string;
  address?: string;
  address_number?: string;
  address_complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  billing_type: SubscriptionBillingType;
  custom_amount?: number;
  accepts_terms: boolean;
  accepts_privacy: boolean;
  wants_public_mural?: boolean;
  wants_anonymous?: boolean;
  communication_email?: boolean;
  communication_whatsapp?: boolean;
  credit_card?: {
    holder_name: string;
    number: string;
    expiry_month: string;
    expiry_year: string;
    ccv: string;
  };
  credit_card_holder?: {
    name: string;
    email: string;
    cpf_cnpj: string;
    postal_code: string;
    address_number: string;
    phone: string;
  };
}

export interface SubscriptionDonationResponse {
  id: string;
  asaas_subscription_id: string;
  status: string;
  billing_type: SubscriptionBillingType;
  next_due_date?: string;
  pending: boolean;
  confirmed: boolean;
  message: string;
  plan: {
    id: string;
    name: string;
    slug: string;
    value: number;
  };
}

export type SubscriptionCheckoutStep = 'plans' | 'details' | 'payment' | 'result';

export function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function planValue(plan: DonationPlan): number {
  return Number(plan.value);
}

export async function createSubscriptionDonation(
  input: SubscriptionDonationInput,
): Promise<SubscriptionDonationResponse> {
  const res = await fetch(`${API_URL}/public/donations/subscription`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message =
      typeof data.message === 'string'
        ? data.message
        : Array.isArray(data.message)
          ? data.message.join(', ')
          : 'Não foi possível criar a assinatura';
    throw new Error(message);
  }

  return data;
}

export { maskCardNumber, onlyDigits } from '@/lib/onetime-donation';
