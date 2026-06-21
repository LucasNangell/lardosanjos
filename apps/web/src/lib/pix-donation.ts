const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export interface PixSettings {
  min_amount: number;
  allow_custom_amount: boolean;
  quick_amounts: number[];
  instructions: string | null;
  require_donor_data: boolean;
  require_receipt_upload: boolean;
  hide_sensitive_details: boolean;
  receiver_name?: string;
  receiver_city?: string;
}

export interface PixDonationResponse {
  id: string;
  amount: number;
  pix_payload: string;
  pix_qr_code_base64: string;
  txid: string;
  status: PixDonationStatus;
  expires_at: string;
  instructions?: string | null;
  receiver_name?: string;
  confirmed: boolean;
  pending: boolean;
}

export type PixDonationStatus =
  | 'PIX_GERADO'
  | 'COMPROVANTE_ENVIADO'
  | 'AGUARDANDO_CONFIRMACAO_MANUAL'
  | 'CONFIRMADO_MANUALMENTE'
  | 'REJEITADO'
  | 'EXPIRADO'
  | 'DUPLICADO';

export interface PixStatusResponse {
  id: string;
  status: PixDonationStatus;
  amount: number;
  marked_as_paid_at: string | null;
  expires_at: string;
  has_receipt: boolean;
}

export type DonationView =
  | 'loading_settings'
  | 'form'
  | 'generating'
  | 'payment'
  | 'receipt'
  | 'waiting'
  | 'thank_you'
  | 'confirmed'
  | 'rejected'
  | 'expired'
  | 'error';

const ALLOWED_RECEIPT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
];

const MAX_RECEIPT_BYTES = 5 * 1024 * 1024;

export async function fetchPixSettings(): Promise<PixSettings> {
  const res = await fetch(`${API_URL}/public/pix/settings`, {
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error('Não foi possível carregar as configurações de Pix.');
  }
  return res.json();
}

export async function createPixDonation(input: {
  amount: number;
  donor_name?: string;
  donor_email?: string;
  donor_phone?: string;
  wants_public_mural: boolean;
  wants_anonymous: boolean;
  donor_message?: string;
  campaign_id?: string;
}): Promise<PixDonationResponse> {
  const res = await fetch(`${API_URL}/public/donations/pix`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const message =
      typeof data.message === 'string'
        ? data.message
        : Array.isArray(data.message)
          ? data.message.join(', ')
          : extractFieldErrors(data);
    throw new Error(message || 'Erro ao gerar Pix');
  }

  return res.json();
}

export async function markPixAsPaid(id: string): Promise<{ status: PixDonationStatus }> {
  const res = await fetch(`${API_URL}/public/donations/pix/${id}/mark-as-paid`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ note: 'Doador confirmou transferência via portal' }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'Erro ao registrar que você fez o Pix');
  }

  return res.json();
}

export async function uploadPixReceipt(
  id: string,
  file: File,
): Promise<{ status: PixDonationStatus }> {
  validateReceiptFile(file);

  const form = new FormData();
  form.append('file', file);

  const res = await fetch(`${API_URL}/public/donations/pix/${id}/upload-receipt`, {
    method: 'POST',
    body: form,
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'Erro ao enviar comprovante');
  }

  return res.json();
}

export async function fetchPixStatus(id: string): Promise<PixStatusResponse> {
  const res = await fetch(`${API_URL}/public/donations/pix/${id}/status`, {
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error('Não foi possível consultar o status da doação');
  }
  return res.json();
}

export function validateReceiptFile(file: File): void {
  if (!ALLOWED_RECEIPT_TYPES.includes(file.type)) {
    throw new Error('Formato inválido. Envie PDF, JPG ou PNG.');
  }
  if (file.size > MAX_RECEIPT_BYTES) {
    throw new Error('Arquivo excede 5 MB.');
  }
}

export function qrCodeSrc(base64OrDataUrl: string): string {
  if (base64OrDataUrl.startsWith('data:')) {
    return base64OrDataUrl;
  }
  return `data:image/png;base64,${base64OrDataUrl}`;
}

export function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function mapStatusToView(
  status: PixDonationStatus,
  step: DonationView,
): DonationView {
  switch (status) {
    case 'PIX_GERADO':
      return step === 'receipt' || step === 'waiting' ? step : 'payment';
    case 'COMPROVANTE_ENVIADO':
    case 'AGUARDANDO_CONFIRMACAO_MANUAL':
      return 'waiting';
    case 'CONFIRMADO_MANUALMENTE':
      return 'confirmed';
    case 'REJEITADO':
    case 'DUPLICADO':
      return 'rejected';
    case 'EXPIRADO':
      return 'expired';
    default:
      return step;
  }
}

function extractFieldErrors(data: Record<string, unknown>): string {
  if (!data || typeof data !== 'object') return '';
  const parts: string[] = [];
  for (const value of Object.values(data)) {
    if (Array.isArray(value)) {
      parts.push(...value.map(String));
    } else if (typeof value === 'string') {
      parts.push(value);
    }
  }
  return parts.join(' ');
}
