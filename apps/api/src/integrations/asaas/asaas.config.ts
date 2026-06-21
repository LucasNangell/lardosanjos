export function getAsaasConfig() {
  return {
    baseUrl: (
      process.env.ASAAS_API_URL || 'https://sandbox.asaas.com/api/v3'
    ).replace(/\/$/, ''),
    apiKey: process.env.ASAAS_API_KEY,
    environment: process.env.ASAAS_ENVIRONMENT || 'sandbox',
    timeoutMs: parseInt(process.env.ASAAS_TIMEOUT_MS || '15000', 10),
    maxRetries: parseInt(process.env.ASAAS_MAX_RETRIES || '2', 10),
    retryDelayMs: parseInt(process.env.ASAAS_RETRY_DELAY_MS || '400', 10),
  };
}

export function isRetryableStatus(status: number): boolean {
  return status === 429 || status >= 500;
}

export function isRetryableNetworkError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const name = error.name;
  return (
    name === 'AbortError' ||
    name === 'TimeoutError' ||
    name === 'FetchError' ||
    error.message.toLowerCase().includes('network')
  );
}

export async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}
