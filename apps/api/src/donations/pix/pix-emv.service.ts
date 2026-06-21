import { Injectable } from '@nestjs/common';
import { PixKeyType } from '@lardosanjos/database';

export interface PixEmvInput {
  pixKey: string;
  pixKeyType: PixKeyType;
  receiverName: string;
  receiverCity: string;
  amount: number;
  txid: string;
  description?: string;
}

@Injectable()
export class PixEmvService {
  generatePayload(input: PixEmvInput): string {
    this.assertInput(input);

    const pixKey = this.formatPixKey(input.pixKey, input.pixKeyType);
    const txid = this.sanitizeTxid(input.txid);
    const amount = input.amount.toFixed(2);

    const merchantAccount = this.tlv(
      '26',
      this.tlv('00', 'br.gov.bcb.pix') + this.tlv('01', pixKey),
    );

    const additionalData = this.tlv('62', this.tlv('05', txid));

    const payloadWithoutCrc =
      this.tlv('00', '01') +
      merchantAccount +
      this.tlv('52', '0000') +
      this.tlv('53', '986') +
      this.tlv('54', amount) +
      this.tlv('58', 'BR') +
      this.tlv('59', this.sanitizeField(input.receiverName, 25)) +
      this.tlv('60', this.sanitizeField(input.receiverCity, 15)) +
      additionalData;

    const crc = this.computeCrc16(payloadWithoutCrc + '6304');
    const payload = payloadWithoutCrc + this.tlv('63', crc);

    if (!this.validatePayloadIntegrity(payload)) {
      throw new Error('Falha ao gerar CRC16 do payload Pix');
    }

    return payload;
  }

  /** Valida integridade CRC16 do payload EMV (tag 63). */
  validatePayloadIntegrity(payload: string): boolean {
    const crcIndex = payload.lastIndexOf('6304');
    if (crcIndex === -1 || payload.length < crcIndex + 8) {
      return false;
    }

    const body = payload.slice(0, crcIndex + 4);
    const declaredCrc = payload.slice(crcIndex + 4, crcIndex + 8);
    const computed = this.computeCrc16(body);
    return declaredCrc.toUpperCase() === computed.toUpperCase();
  }

  computeCrc16(payload: string): string {
    let crc = 0xffff;
    for (let i = 0; i < payload.length; i++) {
      crc ^= payload.charCodeAt(i) << 8;
      for (let j = 0; j < 8; j++) {
        if (crc & 0x8000) {
          crc = (crc << 1) ^ 0x1021;
        } else {
          crc <<= 1;
        }
        crc &= 0xffff;
      }
    }
    return crc.toString(16).toUpperCase().padStart(4, '0');
  }

  private assertInput(input: PixEmvInput): void {
    if (!input.receiverName?.trim()) {
      throw new Error('Nome do recebedor é obrigatório');
    }
    if (!input.receiverCity?.trim()) {
      throw new Error('Cidade do recebedor é obrigatória');
    }
    if (!Number.isFinite(input.amount) || input.amount <= 0) {
      throw new Error('Valor inválido para Pix');
    }
    if (!input.txid?.trim()) {
      throw new Error('TXID é obrigatório');
    }
  }

  private tlv(id: string, value: string): string {
    if (value.length > 99) {
      throw new Error(`Campo EMV ${id} excede tamanho máximo`);
    }
    return `${id}${value.length.toString().padStart(2, '0')}${value}`;
  }

  private sanitizeField(value: string, maxLength: number): string {
    const sanitized = value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9 ]/g, '')
      .slice(0, maxLength)
      .toUpperCase()
      .trim();

    if (!sanitized) {
      throw new Error('Campo EMV contém caracteres inválidos');
    }
    return sanitized;
  }

  private sanitizeTxid(txid: string): string {
    const sanitized = txid.replace(/[^a-zA-Z0-9]/g, '').slice(0, 25);
    if (!sanitized) {
      throw new Error('TXID inválido');
    }
    return sanitized;
  }

  private formatPixKey(key: string, type: PixKeyType): string {
    switch (type) {
      case 'CPF':
      case 'CNPJ':
        return key.replace(/\D/g, '');
      case 'PHONE': {
        const digits = key.replace(/\D/g, '');
        return digits.startsWith('55') ? `+${digits}` : `+55${digits}`;
      }
      case 'EMAIL':
      case 'RANDOM_KEY':
      default:
        return key.trim();
    }
  }
}
