import { PixKeyType } from '@lardosanjos/database';

export function maskPixKey(key: string, type: PixKeyType): string {
  const trimmed = key.trim();
  if (!trimmed) return '••••••••';

  switch (type) {
    case 'CPF':
    case 'CNPJ': {
      const digits = trimmed.replace(/\D/g, '');
      if (digits.length <= 4) return '••••';
      return `${'•'.repeat(Math.max(0, digits.length - 4))}${digits.slice(-4)}`;
    }
    case 'EMAIL': {
      const [local, domain] = trimmed.split('@');
      if (!domain) return '••••@••••';
      const visible = local.slice(0, Math.min(2, local.length));
      return `${visible}${'•'.repeat(Math.max(1, local.length - visible.length))}@${domain}`;
    }
    case 'PHONE': {
      const digits = trimmed.replace(/\D/g, '');
      return `•••••${digits.slice(-4)}`;
    }
    case 'RANDOM_KEY':
      return `${trimmed.slice(0, 4)}${'•'.repeat(20)}${trimmed.slice(-4)}`;
    default:
      return '••••••••';
  }
}

export function sanitizePixSettingsForAudit(settings: Record<string, unknown>) {
  const copy = { ...settings };
  if (typeof copy.pix_key === 'string') {
    copy.pix_key = '[REDACTED]';
  }
  return copy;
}
