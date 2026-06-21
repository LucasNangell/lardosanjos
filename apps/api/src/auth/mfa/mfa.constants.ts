export const FINANCIAL_PERMISSIONS = [
  'PIX_CONFIRM_MANUAL',
  'PIX_SETTINGS_WRITE',
  'FINANCE_WRITE',
  'ADMIN_USERS_MANAGE',
] as const;

export type FinancialPermission = (typeof FINANCIAL_PERMISSIONS)[number];

export function hasFinancialPermission(permissions: string[]): boolean {
  return FINANCIAL_PERMISSIONS.some((p) => permissions.includes(p));
}

export function userRequiresMfa(permissions: string[]): boolean {
  return hasFinancialPermission(permissions);
}
