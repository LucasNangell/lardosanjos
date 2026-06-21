import { BadRequestException } from '@nestjs/common';
import { PixKeyType } from '@lardosanjos/database';

export function validatePixKey(
  key: string,
  type: PixKeyType,
): { valid: true } | { valid: false; message: string } {
  const trimmed = key.trim();
  if (!trimmed) {
    return { valid: false, message: 'Chave Pix não configurada' };
  }

  switch (type) {
    case 'CPF': {
      const digits = trimmed.replace(/\D/g, '');
      if (digits.length !== 11) {
        return { valid: false, message: 'Chave Pix CPF inválida' };
      }
      return { valid: true };
    }
    case 'CNPJ': {
      const digits = trimmed.replace(/\D/g, '');
      if (digits.length !== 14) {
        return { valid: false, message: 'Chave Pix CNPJ inválida' };
      }
      return { valid: true };
    }
    case 'EMAIL': {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
        return { valid: false, message: 'Chave Pix e-mail inválida' };
      }
      return { valid: true };
    }
    case 'PHONE': {
      const digits = trimmed.replace(/\D/g, '');
      if (digits.length < 10 || digits.length > 13) {
        return { valid: false, message: 'Chave Pix telefone inválida' };
      }
      return { valid: true };
    }
    case 'RANDOM_KEY': {
      if (trimmed.length < 32) {
        return { valid: false, message: 'Chave Pix aleatória inválida' };
      }
      return { valid: true };
    }
    default:
      return { valid: false, message: 'Tipo de chave Pix não suportado' };
  }
}

export function assertValidPixKey(key: string, type: PixKeyType): void {
  const result = validatePixKey(key, type);
  if (!result.valid) {
    throw new BadRequestException(result.message);
  }
}

export function parseQuickAmounts(raw: unknown): number[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((v) => (typeof v === 'number' ? v : parseFloat(String(v))))
    .filter((n) => Number.isFinite(n) && n > 0);
}

export function assertAllowedAmount(params: {
  amount: number;
  minAmount: number;
  allowCustomAmount: boolean;
  quickAmounts: number[];
}): void {
  if (params.amount < params.minAmount) {
    throw new BadRequestException(
      `Valor mínimo: R$ ${params.minAmount.toFixed(2)}`,
    );
  }

  if (!params.allowCustomAmount && params.quickAmounts.length > 0) {
    const allowed = params.quickAmounts.some(
      (q) => Math.abs(q - params.amount) < 0.001,
    );
    if (!allowed) {
      throw new BadRequestException(
        'Valor não permitido. Selecione um dos valores rápidos configurados.',
      );
    }
  }
}
