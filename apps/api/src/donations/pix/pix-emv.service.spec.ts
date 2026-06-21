import { PixEmvService } from './pix-emv.service';
import {
  assertAllowedAmount,
  assertValidPixKey,
  validatePixKey,
} from './pix-key.validator';
import { BadRequestException } from '@nestjs/common';

describe('PixEmvService', () => {
  const service = new PixEmvService();

  const baseInput = {
    pixKey: '12345678901',
    pixKeyType: 'CPF' as const,
    receiverName: 'Lar dos Anjos Pet',
    receiverCity: 'Brasilia',
    amount: 50,
    txid: 'LDABC123456789',
  };

  it('generates BR Code starting with EMV header 000201', () => {
    const payload = service.generatePayload(baseInput);
    expect(payload.startsWith('000201')).toBe(true);
    expect(payload).toContain('br.gov.bcb.pix');
    expect(payload).toContain('6304');
  });

  it('validates CRC16 integrity of generated payload', () => {
    const payload = service.generatePayload(baseInput);
    expect(service.validatePayloadIntegrity(payload)).toBe(true);
  });

  it('computes CRC16 for known reference string', () => {
    const reference = '00020101021226580014br.gov.bcb.pix013612345678901234520400005303986540510.005802BR5913Fulano de Tal6008Brasilia62070503***6304';
    const crc = service.computeCrc16(reference);
    expect(crc).toMatch(/^[0-9A-F]{4}$/);
  });

  it('includes transaction amount in field 54', () => {
    const payload = service.generatePayload({ ...baseInput, amount: 25.5 });
    expect(payload).toContain('5405');
    expect(payload).toContain('25.50');
  });

  it('sanitizes receiver name and city for EMV', () => {
    const payload = service.generatePayload({
      ...baseInput,
      receiverName: 'Lar dos Anjos — Pet!',
      receiverCity: 'Brasilia',
    });
    expect(service.validatePayloadIntegrity(payload)).toBe(true);
    expect(payload).toContain('LAR DOS ANJOS');
    expect(payload).toContain('BRASILIA');
  });

  it('formats phone pix key with +55', () => {
    const payload = service.generatePayload({
      ...baseInput,
      pixKey: '61999998888',
      pixKeyType: 'PHONE',
    });
    expect(payload).toContain('+5561999998888');
  });

  it('rejects empty receiver name', () => {
    expect(() =>
      service.generatePayload({ ...baseInput, receiverName: '!!!' }),
    ).toThrow();
  });
});

describe('pix-key.validator', () => {
  it('validates CPF key', () => {
    expect(validatePixKey('12345678901', 'CPF').valid).toBe(true);
    expect(validatePixKey('123', 'CPF').valid).toBe(false);
  });

  it('validates email key', () => {
    expect(validatePixKey('pix@abrigo.org', 'EMAIL').valid).toBe(true);
    expect(validatePixKey('invalid', 'EMAIL').valid).toBe(false);
  });

  it('assertValidPixKey throws BadRequestException', () => {
    expect(() => assertValidPixKey('', 'CPF')).toThrow(BadRequestException);
  });

  it('assertAllowedAmount rejects below minimum', () => {
    expect(() =>
      assertAllowedAmount({
        amount: 0.5,
        minAmount: 1,
        allowCustomAmount: true,
        quickAmounts: [],
      }),
    ).toThrow(BadRequestException);
  });

  it('assertAllowedAmount rejects disallowed custom amount', () => {
    expect(() =>
      assertAllowedAmount({
        amount: 15,
        minAmount: 1,
        allowCustomAmount: false,
        quickAmounts: [10, 25, 50],
      }),
    ).toThrow(BadRequestException);
  });

  it('assertAllowedAmount accepts quick amount when custom disabled', () => {
    expect(() =>
      assertAllowedAmount({
        amount: 25,
        minAmount: 1,
        allowCustomAmount: false,
        quickAmounts: [10, 25, 50],
      }),
    ).not.toThrow();
  });
});

describe('Pix avulso / Asaas boundary', () => {
  it('PixEmvService has no Asaas dependency', () => {
    const fs = require('fs') as typeof import('fs');
    const path = require('path') as typeof import('path');
    const source = fs.readFileSync(
      path.join(__dirname, 'pix-emv.service.ts'),
      'utf8',
    );
    expect(source).not.toMatch(/Asaas/);
  });
});
