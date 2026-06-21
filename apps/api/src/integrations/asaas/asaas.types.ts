export interface AsaasCustomerInput {
  name: string;
  email: string;
  cpfCnpj?: string;
  phone?: string;
  mobilePhone?: string;
  postalCode?: string;
  address?: string;
  addressNumber?: string;
  complement?: string;
  province?: string;
  city?: string;
  state?: string;
}

export interface AsaasCustomer {
  id: string;
  name: string;
  email: string;
  cpfCnpj?: string;
  phone?: string;
  mobilePhone?: string;
}

export interface AsaasCreditCardInput {
  holderName: string;
  number: string;
  expiryMonth: string;
  expiryYear: string;
  ccv: string;
}

export interface AsaasCreditCardHolderInfo {
  name: string;
  email: string;
  cpfCnpj: string;
  postalCode: string;
  addressNumber: string;
  phone: string;
}

export interface AsaasPaymentInput {
  customer: string;
  billingType: 'CREDIT_CARD' | 'BOLETO';
  value: number;
  dueDate: string;
  description?: string;
  externalReference?: string;
  creditCard?: AsaasCreditCardInput;
  creditCardHolderInfo?: AsaasCreditCardHolderInfo;
}

export interface AsaasPayment {
  id: string;
  customer: string;
  billingType: string;
  value: number;
  status: string;
  dueDate: string;
  invoiceUrl?: string;
  bankSlipUrl?: string;
  pixQrCodeUrl?: string;
  pixCopyAndPaste?: string;
  confirmedDate?: string;
  paymentDate?: string;
  clientPaymentDate?: string;
}

export interface AsaasIdentificationField {
  identificationField: string;
  barCode?: string;
}

export interface AsaasSubscriptionInput {
  customer: string;
  billingType: 'CREDIT_CARD' | 'BOLETO' | 'PIX';
  value: number;
  nextDueDate: string;
  cycle: 'MONTHLY' | 'WEEKLY' | 'BIWEEKLY' | 'QUARTERLY' | 'SEMIANNUALLY' | 'YEARLY';
  description?: string;
  externalReference?: string;
  creditCard?: AsaasCreditCardInput;
  creditCardHolderInfo?: AsaasCreditCardHolderInfo;
}

export interface AsaasSubscription {
  id: string;
  customer: string;
  billingType: string;
  value: number;
  status: string;
  cycle: string;
  nextDueDate: string;
}

export interface AsaasWebhookPayload {
  id: string;
  event: string;
  payment?: AsaasPayment;
  subscription?: AsaasSubscription;
}
