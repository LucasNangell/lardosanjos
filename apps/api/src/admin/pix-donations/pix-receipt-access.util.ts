import { createHmac, timingSafeEqual } from 'crypto';

const DEFAULT_TTL_SECONDS = 300;

function getSecret() {
  return process.env.JWT_SECRET || process.env.PIX_RECEIPT_SECRET || 'dev-receipt-secret';
}

export function createReceiptAccessToken(params: {
  fileId: string;
  donationId: string;
  adminUserId: string;
  ttlSeconds?: number;
}) {
  const exp =
    Math.floor(Date.now() / 1000) +
    (params.ttlSeconds ?? DEFAULT_TTL_SECONDS);
  const payload = `${params.fileId}:${params.donationId}:${params.adminUserId}:${exp}`;
  const signature = createHmac('sha256', getSecret())
    .update(payload)
    .digest('hex');
  return Buffer.from(`${payload}:${signature}`).toString('base64url');
}

export function verifyReceiptAccessToken(token: string) {
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf8');
    const parts = decoded.split(':');
    if (parts.length !== 5) {
      return null;
    }

    const [fileId, donationId, adminUserId, expRaw, signature] = parts;
    const exp = Number(expRaw);
    if (!fileId || !donationId || !adminUserId || !Number.isFinite(exp)) {
      return null;
    }

    if (exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    const payload = `${fileId}:${donationId}:${adminUserId}:${exp}`;
    const expected = createHmac('sha256', getSecret())
      .update(payload)
      .digest('hex');

    const provided = Buffer.from(signature);
    const expectedBuf = Buffer.from(expected);
    if (
      provided.length !== expectedBuf.length ||
      !timingSafeEqual(provided, expectedBuf)
    ) {
      return null;
    }

    return { fileId, donationId, adminUserId, exp };
  } catch {
    return null;
  }
}
