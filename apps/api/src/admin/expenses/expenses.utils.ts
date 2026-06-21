import { BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CONFIRMED_PAYMENT_STATUSES,
  CONFIRMED_PIX_STATUS,
} from '../../common/constants/finance.constants';
import { decimalToNumber, getMonthRange } from '../../public/transparency.utils';

export const EXPENSE_RECEIPT_ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
];

export const EXPENSE_RECEIPT_MAX_BYTES = 5 * 1024 * 1024;

export function assertValidExpenseReceipt(mimeType: string, size: number) {
  if (!EXPENSE_RECEIPT_ALLOWED_TYPES.includes(mimeType)) {
    throw new BadRequestException('Tipo de arquivo não permitido');
  }
  if (size > EXPENSE_RECEIPT_MAX_BYTES) {
    throw new BadRequestException('Arquivo excede 5MB');
  }
}

export async function aggregateConfirmedIncome(
  prisma: PrismaService,
  start: Date,
  end: Date,
) {
  const [paymentAgg, pixAgg] = await Promise.all([
    prisma.payment.aggregate({
      where: {
        status: { in: CONFIRMED_PAYMENT_STATUSES },
        OR: [
          { paidAt: { gte: start, lte: end } },
          { receivedAt: { gte: start, lte: end } },
        ],
      },
      _sum: { value: true },
    }),
    prisma.pixDonation.aggregate({
      where: {
        status: CONFIRMED_PIX_STATUS,
        manuallyConfirmedAt: { gte: start, lte: end },
      },
      _sum: { amount: true },
    }),
  ]);

  const asaasIncome = decimalToNumber(paymentAgg._sum.value);
  const pixIncome = decimalToNumber(pixAgg._sum.amount);

  return {
    asaas_income: asaasIncome,
    pix_manual_income: pixIncome,
    total_income: asaasIncome + pixIncome,
  };
}

export async function aggregateExpenses(
  prisma: PrismaService,
  start: Date,
  end: Date,
  publicOnly: boolean,
) {
  const agg = await prisma.expense.aggregate({
    where: {
      ...(publicOnly ? { isPublic: true } : {}),
      date: { gte: start, lte: end },
    },
    _sum: { amount: true },
  });

  return decimalToNumber(agg._sum.amount);
}

export function monthRangeFromDto(month: number, year: number) {
  return getMonthRange(year, month);
}
