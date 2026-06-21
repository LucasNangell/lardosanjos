import { PaymentStatus, PixDonationStatus } from '@lardosanjos/database';

export const CONFIRMED_PAYMENT_STATUSES: PaymentStatus[] = [
  'RECEIVED',
  'CONFIRMED',
];

export const CONFIRMED_PIX_STATUS: PixDonationStatus = 'CONFIRMADO_MANUALMENTE';
