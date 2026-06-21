const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export type OnetimeBillingType = 'CREDIT_CARD' | 'BOLETO';

export type OnetimeOutcome = 'processing' | 'approved' | 'pending' | 'refused';

export interface OnetimeDonationInput {
  donor_name: string;
  donor_email: string;
  donor_phone?: string;
  cpf_cnpj?: string;
  amount: number;
  billing_type: OnetimeBillingType;
  campaign_id?: string;
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

export interface OnetimeDonationResponse {
  id: string;
  asaas_payment_id: string;
  status: string;
  billing_type: OnetimeBillingType;
  value: number;
  due_date: string;
  invoice_url?: string | null;
  boleto_url?: string | null;
  boleto_digitable_line?: string;
  outcome: OnetimeOutcome;
  pending: boolean;
  confirmed: boolean;
  message: string;
}

export type OnetimeView =
  | 'form'
  | 'processing'
  | 'result'
  | 'error';

const QUICK_AMOUNTS = [25, 50, 100, 200];

export { QUICK_AMOUNTS };

export function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export async function createOnetimeDonation(
  input: OnetimeDonationInput,
): Promise<OnetimeDonationResponse> {
  const res = await fetch(`${API_URL}/public/donations/onetime`, {
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
          : 'Não foi possível processar a doação';
    throw new Error(message);
  }

  return data;
}

export function maskCardNumber(value: string): string {
  const digits = value.replace(/\D/g, '');
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
}

export function onlyDigits(value: string, max?: number): string {
  const digits = value.replace(/\D/g, '');
  return max ? digits.slice(0, max) : digits;
}
