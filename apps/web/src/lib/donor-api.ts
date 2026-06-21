import { donorApiFetch } from './donor-auth';

export interface DonorProfile {
  id: string;
  full_name: string;
  public_name: string | null;
  email: string;
  phone: string | null;
  cpf_cnpj: string | null;
  birth_date: string | null;
  zip_code: string | null;
  address: string | null;
  address_number: string | null;
  address_complement: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  wants_public_profile: boolean;
  public_display_type: string;
  communication_email: boolean;
  communication_whatsapp: boolean;
}

export interface DonationItem {
  id: string;
  source: 'asaas' | 'pix';
  type: string;
  billing_type: string;
  value: number;
  status: string;
  paid_at: string | null;
  created_at: string;
}

export interface DonorImpact {
  total_confirmed: number;
  support_months: number;
  current_plan: {
    id: string;
    name: string;
    slug: string;
    value: number;
  } | null;
  next_billing_date: string | null;
  badges: {
    id: string;
    name: string;
    description: string | null;
    icon: string | null;
    awarded_at: string;
  }[];
  pending_note: string;
}

export function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function fetchDonorProfile() {
  return donorApiFetch<DonorProfile>('/donor/profile');
}

export function updateDonorProfile(input: Partial<DonorProfile>) {
  return donorApiFetch<DonorProfile>('/donor/profile', {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

export function fetchDonorDonations() {
  return donorApiFetch<{ items: DonationItem[]; total: number }>('/donor/donations');
}

export function fetchDonorImpact() {
  return donorApiFetch<DonorImpact>('/donor/impact');
}

export function updateDonorPrivacy(input: {
  wants_public_profile?: boolean;
  public_display_type?: string;
  communication_email?: boolean;
  communication_whatsapp?: boolean;
}) {
  return donorApiFetch<{
    wants_public_profile: boolean;
    public_display_type: string;
    communication_email: boolean;
    communication_whatsapp: boolean;
    message: string;
  }>('/donor/privacy-preferences', {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

export function billingTypeLabel(type: string): string {
  const map: Record<string, string> = {
    PIX: 'Pix',
    CREDIT_CARD: 'Cartão',
    BOLETO: 'Boleto',
  };
  return map[type] ?? type;
}

export interface DonorSubscription {
  id: string;
  status: string;
  billing_type: string;
  value: number;
  next_due_date: string | null;
  started_at: string | null;
  plan: {
    id: string;
    name: string;
    slug: string;
    value: number;
    description?: string | null;
  };
  consequences?: {
    future_charges: string;
    card_status: string;
  };
}

export interface DonationPlanOption {
  id: string;
  name: string;
  slug: string;
  value: number | string;
  description: string | null;
  impactText: string | null;
  isFeatured: boolean;
}

export function fetchDonorSubscription() {
  return donorApiFetch<{ subscription: DonorSubscription | null; message?: string }>(
    '/donor/subscription',
  );
}

export function fetchPublicPlans() {
  return donorApiFetch<DonationPlanOption[]>('/public/plans');
}

export function changeSubscriptionPlan(planId: string, password: string) {
  return donorApiFetch<{
    change_type: 'upgrade' | 'downgrade';
    message: string;
    plan: { id: string; name: string; value: number };
  }>('/donor/subscription/change-plan', {
    method: 'POST',
    body: JSON.stringify({ plan_id: planId, password }),
  });
}

export function updateSubscriptionPayment(input: {
  password: string;
  credit_card: {
    holder_name: string;
    number: string;
    expiry_month: string;
    expiry_year: string;
    ccv: string;
  };
  credit_card_holder: {
    name: string;
    email: string;
    cpf_cnpj: string;
    postal_code: string;
    address_number: string;
    phone: string;
  };
}) {
  return donorApiFetch<{ message: string }>('/donor/subscription/update-payment', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function cancelSubscription(input: {
  password: string;
  reason_code?: string;
  reason?: string;
}) {
  return donorApiFetch<{ status: string; message: string; canceled_at?: string }>(
    '/donor/subscription/cancel',
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
  );
}

export { maskCardNumber, onlyDigits } from '@/lib/onetime-donation';

export interface DonorCardBadge {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  awarded_at: string;
}

export interface DonorCardData {
  id: string;
  card_number: string;
  status: string;
  valid: boolean;
  status_label: string;
  display_name: string;
  plan_name: string | null;
  plan_slug: string | null;
  subscription_status: string | null;
  issued_at: string;
  started_at: string | null;
  validation_url: string;
  qr_code_data_url: string;
  badges: DonorCardBadge[];
}

export interface PublicCardValidation {
  valid: boolean;
  message?: string;
  card_number?: string;
  display_name?: string;
  plan_name?: string | null;
  member_since?: string;
  status_label?: string;
  badges?: { name: string; icon: string | null }[];
}

export function fetchDonorCard() {
  return donorApiFetch<{ card: DonorCardData | null; message?: string }>('/donor/card');
}

export function generateDonorCard() {
  return donorApiFetch<{ card: DonorCardData }>('/donor/card/generate', {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export async function validatePublicCard(cardNumber: string, token?: string) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
  const params = new URLSearchParams();
  if (token) params.set('t', token);
  const query = params.toString();
  const encoded = encodeURIComponent(cardNumber);
  const response = await fetch(
    `${API_URL}/public/cards/${encoded}${query ? `?${query}` : ''}`,
    { cache: 'no-store' },
  );
  return response.json() as Promise<PublicCardValidation>;
}
