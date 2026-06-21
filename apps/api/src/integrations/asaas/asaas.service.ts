import { Injectable, Logger } from '@nestjs/common';
import {
  getAsaasConfig,
  isRetryableNetworkError,
  isRetryableStatus,
  sleep,
} from './asaas.config';
import {
  AsaasApiError,
  mapAsaasHttpStatusToClient,
  sanitizeAsaasPayload,
} from './asaas.errors';
import {
  AsaasCustomer,
  AsaasCustomerInput,
  AsaasCreditCardInput,
  AsaasCreditCardHolderInfo,
  AsaasPayment,
  AsaasPaymentInput,
  AsaasSubscription,
  AsaasSubscriptionInput,
} from './asaas.types';

type FetchFn = typeof fetch;

@Injectable()
export class AsaasService {
  private readonly logger = new Logger(AsaasService.name);

  constructor(private readonly fetchFn: FetchFn = fetch) {}

  private get config() {
    return getAsaasConfig();
  }

  get environment(): string {
    return this.config.environment;
  }

  private get apiKey(): string {
    const key = this.config.apiKey;
    if (!key) {
      throw new AsaasApiError('Asaas API key não configurada', 503);
    }
    return key;
  }

  private async fetchWithRetry(
    url: string,
    init: RequestInit,
    attempt = 0,
  ): Promise<Response> {
    const { maxRetries, timeoutMs, retryDelayMs } = this.config;

    try {
      const response = await this.fetchFn(url, {
        ...init,
        signal: AbortSignal.timeout(timeoutMs),
      });

      if (isRetryableStatus(response.status) && attempt < maxRetries) {
        this.logger.warn(
          `Asaas retry ${attempt + 1}/${maxRetries} after HTTP ${response.status}`,
        );
        await sleep(retryDelayMs * (attempt + 1));
        return this.fetchWithRetry(url, init, attempt + 1);
      }

      return response;
    } catch (error) {
      if (isRetryableNetworkError(error) && attempt < maxRetries) {
        this.logger.warn(
          `Asaas retry ${attempt + 1}/${maxRetries} after network error`,
        );
        await sleep(retryDelayMs * (attempt + 1));
        return this.fetchWithRetry(url, init, attempt + 1);
      }

      if (isRetryableNetworkError(error)) {
        throw new AsaasApiError('Timeout ou falha de comunicação com Asaas');
      }

      throw error;
    }
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<T> {
    const url = `${this.config.baseUrl}${path}`;
    const headers: Record<string, string> = {
      access_token: this.apiKey,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    if (body) {
      this.logger.debug(
        `Asaas ${method} ${path}`,
        JSON.stringify(sanitizeAsaasPayload(body)),
      );
    } else {
      this.logger.debug(`Asaas ${method} ${path}`);
    }

    let response: Response;
    try {
      response = await this.fetchWithRetry(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch (error) {
      if (error instanceof AsaasApiError) throw error;
      this.logger.error(`Asaas network error on ${method} ${path}`, error);
      throw new AsaasApiError('Falha de comunicação com Asaas');
    }

    const text = await response.text();
    let data: Record<string, unknown> = {};
    if (text) {
      try {
        data = JSON.parse(text) as Record<string, unknown>;
      } catch {
        this.logger.error(`Asaas invalid JSON response: ${text.slice(0, 200)}`);
        throw new AsaasApiError('Resposta inválida do Asaas');
      }
    }

    if (!response.ok) {
      const errors = Array.isArray(data.errors) ? data.errors : undefined;
      const message =
        (errors?.[0] &&
          typeof errors[0] === 'object' &&
          errors[0] !== null &&
          'description' in errors[0] &&
          typeof (errors[0] as { description?: string }).description ===
            'string' &&
          (errors[0] as { description: string }).description) ||
        `Erro Asaas (${response.status})`;

      this.logger.warn(
        `Asaas error ${response.status} on ${method} ${path}: ${message}`,
        JSON.stringify(sanitizeAsaasPayload(data)),
      );

      throw new AsaasApiError(
        message,
        mapAsaasHttpStatusToClient(response.status),
        errors,
        response.status,
      );
    }

    return data as T;
  }

  createCustomer(input: AsaasCustomerInput): Promise<AsaasCustomer> {
    return this.request<AsaasCustomer>('POST', '/customers', input);
  }

  updateCustomer(
    customerId: string,
    input: Partial<AsaasCustomerInput>,
  ): Promise<AsaasCustomer> {
    return this.request<AsaasCustomer>(
      'PUT',
      `/customers/${customerId}`,
      input,
    );
  }

  getCustomer(customerId: string): Promise<AsaasCustomer> {
    return this.request<AsaasCustomer>('GET', `/customers/${customerId}`);
  }

  createCreditCardPayment(input: AsaasPaymentInput): Promise<AsaasPayment> {
    return this.request<AsaasPayment>('POST', '/payments', {
      ...input,
      billingType: 'CREDIT_CARD',
    });
  }

  createBoletoPayment(input: AsaasPaymentInput): Promise<AsaasPayment> {
    return this.request<AsaasPayment>('POST', '/payments', {
      ...input,
      billingType: 'BOLETO',
    });
  }

  createSubscription(input: AsaasSubscriptionInput): Promise<AsaasSubscription> {
    return this.request<AsaasSubscription>('POST', '/subscriptions', input);
  }

  getSubscription(subscriptionId: string): Promise<AsaasSubscription> {
    return this.request<AsaasSubscription>(
      'GET',
      `/subscriptions/${subscriptionId}`,
    );
  }

  cancelSubscription(subscriptionId: string): Promise<AsaasSubscription> {
    return this.request<AsaasSubscription>(
      'DELETE',
      `/subscriptions/${subscriptionId}`,
    );
  }

  updateSubscription(
    subscriptionId: string,
    input: {
      value?: number;
      billingType?: 'CREDIT_CARD' | 'BOLETO' | 'PIX';
      cycle?: AsaasSubscriptionInput['cycle'];
      nextDueDate?: string;
      description?: string;
      updatePendingPayments?: boolean;
    },
  ): Promise<AsaasSubscription> {
    return this.request<AsaasSubscription>(
      'PUT',
      `/subscriptions/${subscriptionId}`,
      input,
    );
  }

  updateSubscriptionCreditCard(
    subscriptionId: string,
    input: {
      creditCard: AsaasCreditCardInput;
      creditCardHolderInfo: AsaasCreditCardHolderInfo;
    },
  ): Promise<AsaasSubscription> {
    return this.request<AsaasSubscription>(
      'PUT',
      `/subscriptions/${subscriptionId}/creditCard`,
      input,
    );
  }

  getPayment(paymentId: string): Promise<AsaasPayment> {
    return this.request<AsaasPayment>('GET', `/payments/${paymentId}`);
  }

  getPaymentIdentificationField(
    paymentId: string,
  ): Promise<{ identificationField: string; barCode?: string }> {
    return this.request('GET', `/payments/${paymentId}/identificationField`);
  }
}
