import { PaymentStatus, PixDonationStatus } from '@prisma/client';
import {
  CONFIRMED_PAYMENT_STATUSES,
  CONFIRMED_PIX_STATUS,
} from '../common/constants/finance.constants';

export type CampaignDonationRecord = {
  payment: { value: unknown; status: PaymentStatus } | null;
  pixDonation: { amount: unknown; status: PixDonationStatus } | null;
};

export function sumConfirmedCampaignDonations(
  donations: CampaignDonationRecord[],
): number {
  return donations.reduce((sum, donation) => {
    if (
      donation.payment &&
      CONFIRMED_PAYMENT_STATUSES.includes(donation.payment.status)
    ) {
      return sum + Number(donation.payment.value);
    }
    if (
      donation.pixDonation &&
      donation.pixDonation.status === CONFIRMED_PIX_STATUS
    ) {
      return sum + Number(donation.pixDonation.amount);
    }
    return sum;
  }, 0);
}

export function isConfirmedCampaignDonation(donation: CampaignDonationRecord) {
  if (
    donation.payment &&
    CONFIRMED_PAYMENT_STATUSES.includes(donation.payment.status)
  ) {
    return true;
  }
  return (
    donation.pixDonation?.status === CONFIRMED_PIX_STATUS
  );
}
