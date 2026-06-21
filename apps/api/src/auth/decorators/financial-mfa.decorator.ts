import { SetMetadata } from '@nestjs/common';

export const REQUIRE_FINANCIAL_MFA_KEY = 'requireFinancialMfa';

export const RequireFinancialMfa = () => SetMetadata(REQUIRE_FINANCIAL_MFA_KEY, true);
