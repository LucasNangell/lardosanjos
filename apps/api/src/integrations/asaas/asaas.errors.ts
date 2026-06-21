import { HttpException, HttpStatus } from '@nestjs/common';

export class AsaasApiError extends HttpException {
  constructor(
    message: string,
    statusCode: HttpStatus = HttpStatus.BAD_GATEWAY,
    public readonly asaasErrors?: unknown[],
    public readonly asaasHttpStatus?: number,
  ) {
    super({ message, asaasErrors, asaasHttpStatus }, statusCode);
  }
}

export function mapAsaasHttpStatusToClient(status: number): HttpStatus {
  if (status === 401 || status === 403) {
    return HttpStatus.BAD_GATEWAY;
  }
  if (status >= 400 && status < 500) {
    return HttpStatus.BAD_REQUEST;
  }
  return HttpStatus.BAD_GATEWAY;
}

export function sanitizeAsaasPayload(payload: unknown): unknown {
  if (!payload || typeof payload !== 'object') return payload;

  const sensitiveKeys = [
    'creditCard',
    'creditCardHolderInfo',
    'number',
    'ccv',
    'access_token',
    'apiKey',
  ];

  const clone = { ...(payload as Record<string, unknown>) };
  for (const key of sensitiveKeys) {
    if (key in clone) {
      clone[key] = '[REDACTED]';
    }
  }
  return clone;
}
