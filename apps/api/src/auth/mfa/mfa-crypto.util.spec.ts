import { encryptSecret, decryptSecret, hashBackupCode, generateBackupCodes } from './mfa-crypto.util';

describe('mfa-crypto.util', () => {
  beforeAll(() => {
    process.env.MFA_ENCRYPTION_KEY = 'test-key-for-unit-tests-only';
  });

  it('encrypts and decrypts TOTP secret', () => {
    const plain = 'JBSWY3DPEHPK3PXP';
    const enc = encryptSecret(plain);
    expect(decryptSecret(enc)).toBe(plain);
  });

  it('generates unique backup codes', () => {
    const codes = generateBackupCodes(4);
    expect(codes).toHaveLength(4);
    expect(new Set(codes).size).toBe(4);
  });

  it('hashes backup codes consistently', () => {
    expect(hashBackupCode('ABCD1234')).toBe(hashBackupCode('ABCD1234'));
  });
});
