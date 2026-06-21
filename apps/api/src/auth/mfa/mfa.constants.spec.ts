import { hasFinancialPermission, userRequiresMfa } from './mfa.constants';

describe('mfa.constants', () => {
  it('detects financial permissions', () => {
    expect(hasFinancialPermission(['FINANCE_READ'])).toBe(false);
    expect(hasFinancialPermission(['FINANCE_WRITE', 'ANIMAL_READ'])).toBe(true);
    expect(hasFinancialPermission(['PIX_CONFIRM_MANUAL'])).toBe(true);
  });

  it('requires MFA for financial users', () => {
    expect(userRequiresMfa(['ADMIN_USERS_MANAGE'])).toBe(true);
    expect(userRequiresMfa(['ANIMAL_READ'])).toBe(false);
  });
});
