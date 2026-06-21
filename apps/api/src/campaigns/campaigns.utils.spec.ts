import {
  isConfirmedCampaignDonation,
  sumConfirmedCampaignDonations,
} from './campaigns.utils';

describe('campaigns.utils', () => {
  it('sums only confirmed asaas and pix donations', () => {
    const total = sumConfirmedCampaignDonations([
      {
        payment: { value: 100, status: 'CONFIRMED' },
        pixDonation: null,
      },
      {
        payment: { value: 50, status: 'PENDING' },
        pixDonation: null,
      },
      {
        payment: null,
        pixDonation: { amount: 30, status: 'CONFIRMADO_MANUALMENTE' },
      },
      {
        payment: null,
        pixDonation: { amount: 20, status: 'AGUARDANDO_CONFIRMACAO_MANUAL' },
      },
    ]);

    expect(total).toBe(130);
  });

  it('detects confirmed donation records', () => {
    expect(
      isConfirmedCampaignDonation({
        payment: { value: 10, status: 'RECEIVED' },
        pixDonation: null,
      }),
    ).toBe(true);
    expect(
      isConfirmedCampaignDonation({
        payment: { value: 10, status: 'PENDING' },
        pixDonation: null,
      }),
    ).toBe(false);
  });
});
