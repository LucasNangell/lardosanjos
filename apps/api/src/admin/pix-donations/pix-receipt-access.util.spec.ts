import { createReceiptAccessToken, verifyReceiptAccessToken } from './pix-receipt-access.util';

describe('pix-receipt-access.util', () => {
  it('creates and verifies receipt token', () => {
    const token = createReceiptAccessToken({
      fileId: 'file-1',
      donationId: 'pix-1',
      adminUserId: 'admin-1',
      ttlSeconds: 300,
    });

    const payload = verifyReceiptAccessToken(token);
    expect(payload).toMatchObject({
      fileId: 'file-1',
      donationId: 'pix-1',
      adminUserId: 'admin-1',
    });
  });

  it('rejects invalid token', () => {
    expect(verifyReceiptAccessToken('invalid-token')).toBeNull();
  });
});
