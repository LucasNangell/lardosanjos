import {
  mapAsaasPaymentStatus,
  shouldAdvancePaymentStatus,
  shouldAdvanceSubscriptionStatus,
} from './asaas-webhook.status';

describe('asaas-webhook.status', () => {
  it('does not downgrade confirmed payment on out-of-order pending event', () => {
    expect(shouldAdvancePaymentStatus('CONFIRMED', 'PENDING')).toBe(false);
    expect(shouldAdvancePaymentStatus('RECEIVED', 'PENDING')).toBe(false);
  });

  it('advances payment to confirmed or received', () => {
    expect(shouldAdvancePaymentStatus('PENDING', 'CONFIRMED')).toBe(true);
    expect(shouldAdvancePaymentStatus('PENDING', 'RECEIVED')).toBe(true);
  });

  it('allows terminal refund/failed statuses', () => {
    expect(shouldAdvancePaymentStatus('CONFIRMED', 'REFUNDED')).toBe(true);
    expect(shouldAdvancePaymentStatus('CONFIRMED', 'FAILED')).toBe(true);
  });

  it('maps asaas payment statuses', () => {
    expect(mapAsaasPaymentStatus('CONFIRMED')).toBe('CONFIRMED');
    expect(mapAsaasPaymentStatus('OVERDUE')).toBe('OVERDUE');
  });

  it('does not downgrade active subscription', () => {
    expect(shouldAdvanceSubscriptionStatus('ACTIVE', 'PENDING')).toBe(false);
    expect(shouldAdvanceSubscriptionStatus('PENDING', 'ACTIVE')).toBe(true);
  });
});
