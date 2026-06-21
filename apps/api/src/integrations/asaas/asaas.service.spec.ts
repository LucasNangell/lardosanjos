import { AsaasService } from './asaas.service';
import { AsaasApiError, sanitizeAsaasPayload } from './asaas.errors';

const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('AsaasService', () => {
  let service: AsaasService;

  beforeEach(() => {
    process.env.ASAAS_API_URL = 'https://sandbox.asaas.com/api/v3';
    process.env.ASAAS_API_KEY = 'test-api-key';
    process.env.ASAAS_ENVIRONMENT = 'sandbox';
    process.env.ASAAS_TIMEOUT_MS = '15000';
    process.env.ASAAS_MAX_RETRIES = '2';
    process.env.ASAAS_RETRY_DELAY_MS = '1';
    service = new AsaasService(mockFetch as unknown as typeof fetch);
    mockFetch.mockReset();
  });

  afterEach(() => {
    delete process.env.ASAAS_API_KEY;
  });

  function mockResponse(body: unknown, status = 200) {
    mockFetch.mockResolvedValueOnce({
      ok: status >= 200 && status < 300,
      status,
      text: async () => (typeof body === 'string' ? body : JSON.stringify(body)),
    });
  }

  it('createCustomer sends POST with access_token header', async () => {
    const customer = { id: 'cus_1', name: 'João', email: 'joao@test.com' };
    mockResponse(customer);

    const result = await service.createCustomer({
      name: 'João',
      email: 'joao@test.com',
    });

    expect(result).toEqual(customer);
    expect(mockFetch).toHaveBeenCalledWith(
      'https://sandbox.asaas.com/api/v3/customers',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          access_token: 'test-api-key',
        }),
      }),
    );
  });

  it('updateCustomer sends PUT', async () => {
    mockResponse({ id: 'cus_1', name: 'João', email: 'joao@test.com' });

    await service.updateCustomer('cus_1', { phone: '11999999999' });

    expect(mockFetch).toHaveBeenCalledWith(
      'https://sandbox.asaas.com/api/v3/customers/cus_1',
      expect.objectContaining({ method: 'PUT' }),
    );
  });

  it('getCustomer sends GET', async () => {
    mockResponse({ id: 'cus_1', name: 'João', email: 'joao@test.com' });

    await service.getCustomer('cus_1');

    expect(mockFetch).toHaveBeenCalledWith(
      'https://sandbox.asaas.com/api/v3/customers/cus_1',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('createCreditCardPayment sets billingType CREDIT_CARD', async () => {
    mockResponse({ id: 'pay_1', status: 'PENDING' });

    await service.createCreditCardPayment({
      customer: 'cus_1',
      billingType: 'CREDIT_CARD',
      value: 50,
      dueDate: '2026-07-01',
      creditCard: {
        holderName: 'João',
        number: '4111111111111111',
        expiryMonth: '12',
        expiryYear: '2030',
        ccv: '123',
      },
    });

    const body = JSON.parse(
      (mockFetch.mock.calls[0][1] as { body: string }).body,
    );
    expect(body.billingType).toBe('CREDIT_CARD');
  });

  it('createBoletoPayment sets billingType BOLETO', async () => {
    mockResponse({ id: 'pay_2', status: 'PENDING' });

    await service.createBoletoPayment({
      customer: 'cus_1',
      billingType: 'BOLETO',
      value: 100,
      dueDate: '2026-07-01',
    });

    const body = JSON.parse(
      (mockFetch.mock.calls[0][1] as { body: string }).body,
    );
    expect(body.billingType).toBe('BOLETO');
  });

  it('createSubscription sends POST', async () => {
    mockResponse({ id: 'sub_1', status: 'ACTIVE' });

    await service.createSubscription({
      customer: 'cus_1',
      billingType: 'CREDIT_CARD',
      value: 30,
      nextDueDate: '2026-07-01',
      cycle: 'MONTHLY',
    });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/subscriptions'),
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('getSubscription sends GET', async () => {
    mockResponse({ id: 'sub_1', status: 'ACTIVE' });

    await service.getSubscription('sub_1');

    expect(mockFetch).toHaveBeenCalledWith(
      'https://sandbox.asaas.com/api/v3/subscriptions/sub_1',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('cancelSubscription sends DELETE', async () => {
    mockResponse({ id: 'sub_1', status: 'INACTIVE' });

    await service.cancelSubscription('sub_1');

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/subscriptions/sub_1'),
      expect.objectContaining({ method: 'DELETE' }),
    );
  });

  it('getPayment sends GET', async () => {
    mockResponse({ id: 'pay_1', status: 'RECEIVED' });

    const payment = await service.getPayment('pay_1');

    expect(payment.id).toBe('pay_1');
    expect(mockFetch).toHaveBeenCalledWith(
      'https://sandbox.asaas.com/api/v3/payments/pay_1',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('throws AsaasApiError on invalid payload (400)', async () => {
    mockResponse(
      { errors: [{ description: 'Cliente inválido' }] },
      400,
    );

    await expect(
      service.createCustomer({ name: 'X', email: 'bad' }),
    ).rejects.toThrow(AsaasApiError);
  });

  it('throws AsaasApiError on 401 from Asaas', async () => {
    mockResponse(
      { errors: [{ description: 'A chave de API informada é inválida' }] },
      401,
    );

    try {
      await service.getCustomer('cus_1');
      fail('expected error');
    } catch (error) {
      expect(error).toBeInstanceOf(AsaasApiError);
      expect((error as AsaasApiError).asaasHttpStatus).toBe(401);
      expect((error as AsaasApiError).getStatus()).toBe(502);
    }
  });

  it('throws on timeout after retries exhausted', async () => {
    const timeoutError = Object.assign(new Error('The operation was aborted'), {
      name: 'TimeoutError',
    });
    mockFetch.mockRejectedValue(timeoutError);

    await expect(service.getPayment('pay_1')).rejects.toThrow(AsaasApiError);
    expect(mockFetch.mock.calls.length).toBe(3);
  });

  it('retries on HTTP 503 and succeeds', async () => {
    mockResponse({ errors: [{ description: 'Unavailable' }] }, 503);
    mockResponse({ id: 'cus_1', name: 'João', email: 'joao@test.com' });

    const result = await service.createCustomer({
      name: 'João',
      email: 'joao@test.com',
    });

    expect(result.id).toBe('cus_1');
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('throws on invalid JSON response', async () => {
    mockResponse('<html>error</html>', 200);

    await expect(service.getCustomer('cus_1')).rejects.toThrow(
      'Resposta inválida do Asaas',
    );
  });

  it('throws when API key is missing', async () => {
    delete process.env.ASAAS_API_KEY;
    const noKeyService = new AsaasService(mockFetch as unknown as typeof fetch);

    await expect(noKeyService.getPayment('pay_1')).rejects.toThrow(AsaasApiError);
  });

  it('sanitizes credit card data in logs', () => {
    const sanitized = sanitizeAsaasPayload({
      customer: 'cus_1',
      creditCard: { number: '4111111111111111', ccv: '123' },
    }) as Record<string, unknown>;

    expect(sanitized.creditCard).toBe('[REDACTED]');
  });

  it('does not expose createPixAvulso or similar one-time Pix methods', () => {
    const forbidden = [
      'createPixPayment',
      'createPixAvulso',
      'createOneTimePix',
      'createPixDonation',
    ];
    for (const method of forbidden) {
      expect(typeof (service as unknown as Record<string, unknown>)[method]).not.toBe(
        'function',
      );
    }
  });

  it('environment reads ASAAS_ENVIRONMENT', () => {
    expect(service.environment).toBe('sandbox');
  });
});

describe('Pix avulso boundary', () => {
  it('PixService does not depend on AsaasService', () => {
    const fs = require('fs') as typeof import('fs');
    const path = require('path') as typeof import('path');
    const pixServicePath = path.join(
      __dirname,
      '../../donations/pix/pix.service.ts',
    );
    const source = fs.readFileSync(pixServicePath, 'utf8');
    expect(source).not.toMatch(/AsaasService/);
    expect(source).not.toMatch(/integrations\/asaas/);
  });
});
