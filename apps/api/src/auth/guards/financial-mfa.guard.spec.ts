import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FinancialMfaGuard } from './financial-mfa.guard';
import { REQUIRE_FINANCIAL_MFA_KEY } from '../decorators/financial-mfa.decorator';

describe('FinancialMfaGuard', () => {
  const mfaService = {
    validateStepUpToken: jest.fn(),
  };
  const prisma = {
    user: { findUnique: jest.fn() },
  };

  let guard: FinancialMfaGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new FinancialMfaGuard(reflector, mfaService as never, prisma as never);
    jest.clearAllMocks();
  });

  function context(user?: object, headers?: Record<string, string>, required = true) {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(required);
    return {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({
          user,
          headers: headers ?? {},
        }),
      }),
    } as never;
  }

  it('allows when MFA not required on route', async () => {
    const ok = await guard.canActivate(context(undefined, {}, false));
    expect(ok).toBe(true);
  });

  it('allows non-financial user without step-up', async () => {
    const ok = await guard.canActivate(
      context({ id: 'u1', permissions: ['ANIMAL_READ'] }),
    );
    expect(ok).toBe(true);
  });

  it('blocks financial user without MFA setup', async () => {
    prisma.user.findUnique.mockResolvedValue({ totpEnabledAt: null });
    await expect(
      guard.canActivate(
        context({ id: 'u1', permissions: ['FINANCE_WRITE'] }),
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('blocks financial user without step-up token', async () => {
    prisma.user.findUnique.mockResolvedValue({ totpEnabledAt: new Date() });
    mfaService.validateStepUpToken.mockReturnValue(false);
    await expect(
      guard.canActivate(
        context({ id: 'u1', permissions: ['PIX_CONFIRM_MANUAL'] }),
      ),
    ).rejects.toMatchObject({
      response: { code: 'MFA_STEP_UP_REQUIRED' },
    });
  });

  it('allows with valid step-up token', async () => {
    prisma.user.findUnique.mockResolvedValue({ totpEnabledAt: new Date() });
    mfaService.validateStepUpToken.mockReturnValue(true);
    const ok = await guard.canActivate(
      context(
        { id: 'u1', permissions: ['PIX_CONFIRM_MANUAL'] },
        { 'x-mfa-step-up': 'valid-token' },
      ),
    );
    expect(ok).toBe(true);
    expect(mfaService.validateStepUpToken).toHaveBeenCalledWith('valid-token', 'u1');
  });
});
