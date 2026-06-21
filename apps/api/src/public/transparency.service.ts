import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CONFIRMED_PAYMENT_STATUSES,
  CONFIRMED_PIX_STATUS,
} from '../common/constants/finance.constants';
import {
  decimalToNumber,
  daysInMonth,
  getCurrentMonthRange,
  getMonthRange,
  roundMoney,
} from './transparency.utils';

const DEFAULT_MONTHLY_GOAL = 15000;
const MONTHLY_GOAL_KEY = 'transparency.monthly_goal';
const DAILY_COST_KEY = 'transparency.daily_cost_estimate';

@Injectable()
export class TransparencyService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary() {
    const now = new Date();
    const { start: monthStart, end: monthEnd } = getCurrentMonthRange(now);
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    const [
      allTimePaymentAgg,
      allTimePixAgg,
      monthPaymentAgg,
      monthPixAgg,
      monthExpenseAgg,
      allTimeExpenseAgg,
      activeDonors,
      monthlyGoalSetting,
      dailyCostSetting,
      publicExpenses,
      reports,
      expensesByCategoryRaw,
      monthlyEvolution,
    ] = await Promise.all([
      this.prisma.payment.aggregate({
        where: { status: { in: CONFIRMED_PAYMENT_STATUSES } },
        _sum: { value: true },
      }),
      this.prisma.pixDonation.aggregate({
        where: { status: CONFIRMED_PIX_STATUS },
        _sum: { amount: true },
      }),
      this.prisma.payment.aggregate({
        where: {
          status: { in: CONFIRMED_PAYMENT_STATUSES },
          OR: [
            { paidAt: { gte: monthStart, lte: monthEnd } },
            { receivedAt: { gte: monthStart, lte: monthEnd } },
          ],
        },
        _sum: { value: true },
      }),
      this.prisma.pixDonation.aggregate({
        where: {
          status: CONFIRMED_PIX_STATUS,
          manuallyConfirmedAt: { gte: monthStart, lte: monthEnd },
        },
        _sum: { amount: true },
      }),
      this.prisma.expense.aggregate({
        where: {
          isPublic: true,
          date: { gte: monthStart, lte: monthEnd },
        },
        _sum: { amount: true },
      }),
      this.prisma.expense.aggregate({
        where: { isPublic: true },
        _sum: { amount: true },
      }),
      this.prisma.subscription.count({ where: { status: 'ACTIVE' } }),
      this.prisma.systemSetting.findUnique({ where: { key: MONTHLY_GOAL_KEY } }),
      this.prisma.systemSetting.findUnique({ where: { key: DAILY_COST_KEY } }),
      this.getPublicExpensesList(),
      this.prisma.transparencyReport.findMany({
        where: { isPublished: true },
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
        take: 12,
      }),
      this.getExpensesByCategory(monthStart, monthEnd),
      this.buildMonthlyEvolution(12),
    ]);

    const asaasAllTime = decimalToNumber(allTimePaymentAgg._sum.value);
    const pixAllTime = decimalToNumber(allTimePixAgg._sum.amount);
    const asaasMonth = decimalToNumber(monthPaymentAgg._sum.value);
    const pixMonth = decimalToNumber(monthPixAgg._sum.amount);

    const totalIncome = roundMoney(asaasAllTime + pixAllTime);
    const totalExpense = roundMoney(decimalToNumber(allTimeExpenseAgg._sum.amount));
    const monthIncome = roundMoney(asaasMonth + pixMonth);
    const monthExpense = roundMoney(decimalToNumber(monthExpenseAgg._sum.amount));
    const monthBalance = roundMoney(monthIncome - monthExpense);

    const monthlyGoal = decimalToNumber(
      monthlyGoalSetting?.value ?? DEFAULT_MONTHLY_GOAL,
    );

    const configuredDailyCost = dailyCostSetting
      ? decimalToNumber(dailyCostSetting.value)
      : null;

    const days = daysInMonth(year, month);
    const dailyCostEstimate =
      configuredDailyCost ??
      roundMoney(monthExpense > 0 ? monthExpense / days : totalExpense / Math.max(days, 1));

    const goalProgressPercent =
      monthlyGoal > 0 ? roundMoney(Math.min(100, (monthIncome / monthlyGoal) * 100)) : 0;

    const hasIncome = totalIncome > 0 || monthIncome > 0;
    const hasExpenses = publicExpenses.length > 0 || totalExpense > 0;
    const dataState =
      !hasIncome && !hasExpenses
        ? 'empty'
        : hasIncome && hasExpenses
          ? 'complete'
          : 'partial';

    return {
      reference_month: { year, month },
      data_state: dataState,
      month_income: monthIncome,
      monthly_goal: monthlyGoal,
      goal_progress_percent: goalProgressPercent,
      daily_cost_estimate: dailyCostEstimate,
      active_donors: activeDonors,
      month_expense: monthExpense,
      month_balance: monthBalance,
      total_income: totalIncome,
      total_expense: totalExpense,
      net_balance: roundMoney(totalIncome - totalExpense),
      income_by_source: {
        asaas: roundMoney(asaasAllTime),
        pix_manual: roundMoney(pixAllTime),
      },
      month_income_by_source: {
        asaas: roundMoney(asaasMonth),
        pix_manual: roundMoney(pixMonth),
      },
      expenses_by_category: expensesByCategoryRaw,
      monthly_evolution: monthlyEvolution,
      public_expenses: publicExpenses,
      reports: reports.map((r) => ({
        id: r.id,
        month: r.month,
        year: r.year,
        summary: r.summary,
        total_income: decimalToNumber(r.totalIncome),
        total_expense: decimalToNumber(r.totalExpense),
        net_balance: decimalToNumber(r.netBalance),
        published_at: r.publishedAt?.toISOString() ?? null,
      })),
      confirmed_statuses: {
        asaas: CONFIRMED_PAYMENT_STATUSES,
        pix: [CONFIRMED_PIX_STATUS],
      },
      pending_note:
        'Somente pagamentos Asaas recebidos/confirmados e Pix avulsos confirmados manualmente entram nos totais.',
    };
  }

  async getPublicExpenses() {
    return { items: await this.getPublicExpensesList() };
  }

  private async getPublicExpensesList(limit = 50) {
    const expenses = await this.prisma.expense.findMany({
      where: { isPublic: true },
      include: { category: true },
      orderBy: { date: 'desc' },
      take: limit,
    });

    return expenses.map((e) => ({
      id: e.id,
      title: e.title,
      public_description: e.publicDescription,
      amount: decimalToNumber(e.amount),
      date: e.date.toISOString().slice(0, 10),
      category: {
        id: e.category.id,
        name: e.category.name,
        icon: e.category.icon,
        color: e.category.color,
      },
    }));
  }

  private async getExpensesByCategory(monthStart: Date, monthEnd: Date) {
    const expenses = await this.prisma.expense.findMany({
      where: {
        isPublic: true,
        date: { gte: monthStart, lte: monthEnd },
      },
      include: { category: true },
    });

    const map = new Map<
      string,
      { category_id: string; name: string; color: string | null; total: number }
    >();

    for (const expense of expenses) {
      const key = expense.categoryId;
      const current = map.get(key) ?? {
        category_id: expense.category.id,
        name: expense.category.name,
        color: expense.category.color,
        total: 0,
      };
      current.total = roundMoney(current.total + decimalToNumber(expense.amount));
      map.set(key, current);
    }

    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }

  private async buildMonthlyEvolution(months: number) {
    const now = new Date();
    const evolution: Array<{
      year: number;
      month: number;
      label: string;
      income: number;
      expense: number;
      balance: number;
    }> = [];

    for (let offset = months - 1; offset >= 0; offset -= 1) {
      const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const { start, end } = getMonthRange(year, month);

      const [paymentAgg, pixAgg, expenseAgg] = await Promise.all([
        this.prisma.payment.aggregate({
          where: {
            status: { in: CONFIRMED_PAYMENT_STATUSES },
            OR: [
              { paidAt: { gte: start, lte: end } },
              { receivedAt: { gte: start, lte: end } },
            ],
          },
          _sum: { value: true },
        }),
        this.prisma.pixDonation.aggregate({
          where: {
            status: CONFIRMED_PIX_STATUS,
            manuallyConfirmedAt: { gte: start, lte: end },
          },
          _sum: { amount: true },
        }),
        this.prisma.expense.aggregate({
          where: { isPublic: true, date: { gte: start, lte: end } },
          _sum: { amount: true },
        }),
      ]);

      const income = roundMoney(
        decimalToNumber(paymentAgg._sum.value) + decimalToNumber(pixAgg._sum.amount),
      );
      const expense = roundMoney(decimalToNumber(expenseAgg._sum.amount));

      evolution.push({
        year,
        month,
        label: `${String(month).padStart(2, '0')}/${year}`,
        income,
        expense,
        balance: roundMoney(income - expense),
      });
    }

    return evolution;
  }
}
