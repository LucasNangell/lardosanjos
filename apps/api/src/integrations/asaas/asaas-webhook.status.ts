import { PaymentStatus, SubscriptionStatus } from '@lardosanjos/database';

const PAYMENT_STATUS_RANK: Record<PaymentStatus, number> = {
  PENDING: 10,
  OVERDUE: 20,
  FAILED: 30,
  CANCELED: 30,
  RECEIVED: 40,
  CONFIRMED: 50,
  REFUNDED: 60,
};

const TERMINAL_PAYMENT_STATUSES = new Set<PaymentStatus>([
  'REFUNDED',
  'FAILED',
  'CANCELED',
]);

export function shouldAdvancePaymentStatus(
  current: PaymentStatus,
  next: PaymentStatus,
): boolean {
  if (current === next) return false;
  if (TERMINAL_PAYMENT_STATUSES.has(next)) return true;
  if (TERMINAL_PAYMENT_STATUSES.has(current) && next !== 'REFUNDED') {
    return false;
  }
  return PAYMENT_STATUS_RANK[next] >= PAYMENT_STATUS_RANK[current];
}

const SUBSCRIPTION_STATUS_RANK: Record<SubscriptionStatus, number> = {
  PENDING: 10,
  INACTIVE: 20,
  CANCELED: 30,
  ACTIVE: 40,
};

export function shouldAdvanceSubscriptionStatus(
  current: SubscriptionStatus,
  next: SubscriptionStatus,
): boolean {
  if (current === next) return false;
  if (next === 'CANCELED' || next === 'INACTIVE') return true;
  return SUBSCRIPTION_STATUS_RANK[next] >= SUBSCRIPTION_STATUS_RANK[current];
}

export function mapAsaasPaymentStatus(asaasStatus: string): PaymentStatus {
  const map: Record<string, PaymentStatus> = {
    PENDING: 'PENDING',
    RECEIVED: 'RECEIVED',
    CONFIRMED: 'CONFIRMED',
    OVERDUE: 'OVERDUE',
    REFUNDED: 'REFUNDED',
    FAILED: 'FAILED',
    CANCELED: 'CANCELED',
    RECEIVED_IN_CASH: 'RECEIVED',
    REFUND_REQUESTED: 'REFUNDED',
    CHARGEBACK_REQUESTED: 'FAILED',
    CHARGEBACK_DISPUTE: 'FAILED',
    AWAITING_CHARGEBACK_REVERSAL: 'PENDING',
    DUNNING_REQUESTED: 'OVERDUE',
    DUNNING_RECEIVED: 'RECEIVED',
    AWAITING_RISK_ANALYSIS: 'PENDING',
  };
  return map[asaasStatus] ?? 'PENDING';
}

export function mapAsaasSubscriptionStatus(asaasStatus: string): SubscriptionStatus {
  const map: Record<string, SubscriptionStatus> = {
    ACTIVE: 'ACTIVE',
    EXPIRED: 'INACTIVE',
    INACTIVE: 'INACTIVE',
  };
  return map[asaasStatus] ?? 'PENDING';
}

export function mapSubscriptionEventType(eventType: string): SubscriptionStatus | null {
  if (eventType === 'SUBSCRIPTION_DELETED') return 'CANCELED';
  if (eventType === 'SUBSCRIPTION_INACTIVATED') return 'INACTIVE';
  return null;
}
