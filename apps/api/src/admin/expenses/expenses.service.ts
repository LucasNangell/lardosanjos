import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../common/audit.service';
import { StorageService } from '../../storage/storage.service';
import { AsaasService } from '../../integrations/asaas/asaas.service';
import { mapAsaasPaymentStatus } from '../../integrations/asaas/asaas-webhook.status';
import {
  CloseTransparencyReportDto,
  CreateExpenseCategoryDto,
  CreateExpenseDto,
  UpdateExpenseCategoryDto,
  UpdateExpenseDto,
} from './expenses.dto';
import {
  aggregateConfirmedIncome,
  aggregateExpenses,
  assertValidExpenseReceipt,
  monthRangeFromDto,
} from './expenses.utils';
import {
  createExpenseReceiptAccessToken,
  verifyExpenseReceiptAccessToken,
} from './expense-receipt-access.util';
import {
  decimalToNumber,
  getCurrentMonthRange,
  roundMoney,
} from '../../public/transparency.utils';

@Injectable()
export class ExpensesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly storageService: StorageService,
    private readonly asaasService: AsaasService,
  ) {}

  listCategories() {
    return this.prisma.expenseCategory
      .findMany({
        orderBy: { name: 'asc' },
      })
      .then((items) =>
        items.map((c) => ({
          id: c.id,
          name: c.name,
          icon: c.icon,
          color: c.color,
          is_active: c.isActive,
        })),
      );
  }

  async createCategory(dto: CreateExpenseCategoryDto, userId: string) {
    const category = await this.prisma.expenseCategory.create({
      data: {
        name: dto.name,
        icon: dto.icon,
        color: dto.color,
        isActive: dto.is_active ?? true,
      },
    });

    await this.auditService.log({
      userId,
      action: 'CREATE',
      entity: 'expense_categories',
      entityId: category.id,
      newData: category,
    });

    return {
      id: category.id,
      name: category.name,
      icon: category.icon,
      color: category.color,
      is_active: category.isActive,
    };
  }

  async updateCategory(
    id: string,
    dto: UpdateExpenseCategoryDto,
    userId: string,
  ) {
    const existing = await this.prisma.expenseCategory.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('Categoria não encontrada');

    const category = await this.prisma.expenseCategory.update({
      where: { id },
      data: {
        name: dto.name,
        icon: dto.icon,
        color: dto.color,
        isActive: dto.is_active,
      },
    });

    await this.auditService.log({
      userId,
      action: 'UPDATE',
      entity: 'expense_categories',
      entityId: id,
      oldData: existing,
      newData: category,
    });

    return {
      id: category.id,
      name: category.name,
      icon: category.icon,
      color: category.color,
      is_active: category.isActive,
    };
  }

  async deleteCategory(id: string, userId: string) {
    const count = await this.prisma.expense.count({
      where: { categoryId: id },
    });
    if (count > 0) {
      throw new BadRequestException('Categoria possui despesas vinculadas');
    }

    const existing = await this.prisma.expenseCategory.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('Categoria não encontrada');

    await this.prisma.expenseCategory.delete({ where: { id } });

    await this.auditService.log({
      userId,
      action: 'DELETE',
      entity: 'expense_categories',
      entityId: id,
      oldData: existing,
    });

    return { message: 'Categoria removida' };
  }

  async listExpenses() {
    const expenses = await this.prisma.expense.findMany({
      include: { category: true },
      orderBy: { date: 'desc' },
    });

    return expenses.map((e) => this.toExpenseResponse(e));
  }

  async getExpense(id: string) {
    const expense = await this.prisma.expense.findUnique({
      where: { id },
      include: { category: true },
    });
    if (!expense) throw new NotFoundException('Despesa não encontrada');
    return this.toExpenseResponse(expense);
  }

  async createExpense(dto: CreateExpenseDto, userId: string) {
    const category = await this.prisma.expenseCategory.findUnique({
      where: { id: dto.category_id },
    });
    if (!category) throw new NotFoundException('Categoria não encontrada');

    if (dto.receipt_file_id) {
      await this.assertReceiptFileExists(dto.receipt_file_id);
    }

    const expense = await this.prisma.expense.create({
      data: {
        categoryId: dto.category_id,
        title: dto.title,
        description: dto.description,
        publicDescription: dto.public_description,
        amount: dto.amount,
        date: new Date(dto.date),
        supplier: dto.supplier,
        receiptFileId: dto.receipt_file_id,
        isPublic: dto.is_public ?? true,
        createdById: userId,
      },
      include: { category: true },
    });

    await this.auditService.log({
      userId,
      action: 'CREATE',
      entity: 'expenses',
      entityId: expense.id,
      newData: expense,
    });

    return this.toExpenseResponse(expense);
  }

  async updateExpense(id: string, dto: UpdateExpenseDto, userId: string) {
    const existing = await this.prisma.expense.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Despesa não encontrada');

    if (dto.receipt_file_id) {
      await this.assertReceiptFileExists(dto.receipt_file_id);
    }

    const expense = await this.prisma.expense.update({
      where: { id },
      data: {
        categoryId: dto.category_id,
        title: dto.title,
        description: dto.description,
        publicDescription: dto.public_description,
        amount: dto.amount,
        date: dto.date ? new Date(dto.date) : undefined,
        supplier: dto.supplier,
        receiptFileId: dto.receipt_file_id,
        isPublic: dto.is_public,
      },
      include: { category: true },
    });

    await this.auditService.log({
      userId,
      action: existing.isPublic ? 'UPDATE_PUBLISHED_EXPENSE' : 'UPDATE',
      entity: 'expenses',
      entityId: id,
      oldData: existing,
      newData: expense,
    });

    return this.toExpenseResponse(expense);
  }

  async deleteExpense(id: string, userId: string) {
    const existing = await this.prisma.expense.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Despesa não encontrada');

    await this.prisma.expense.delete({ where: { id } });

    await this.auditService.log({
      userId,
      action: existing.isPublic ? 'DELETE_PUBLISHED_EXPENSE' : 'DELETE',
      entity: 'expenses',
      entityId: id,
      oldData: existing,
    });

    return { message: 'Despesa removida' };
  }

  async uploadReceipt(buffer: Buffer, mimeType: string, userId: string) {
    assertValidExpenseReceipt(mimeType, buffer.length);

    const upload = await this.storageService.upload(
      buffer,
      mimeType,
      'expense-receipts',
      userId,
    );

    await this.auditService.log({
      userId,
      action: 'UPLOAD_RECEIPT',
      entity: 'uploaded_files',
      entityId: upload.fileId,
      newData: {
        file_id: upload.fileId,
        mime_type: mimeType,
        folder: 'expense-receipts',
      },
    });

    return {
      file_id: upload.fileId,
      mime_type: mimeType,
      file_size: upload.fileSize,
    };
  }

  async getReceiptAccessUrl(expenseId: string, adminUserId: string) {
    const expense = await this.prisma.expense.findUnique({
      where: { id: expenseId },
    });
    if (!expense) throw new NotFoundException('Despesa não encontrada');
    if (!expense.receiptFileId) {
      throw new NotFoundException('Despesa não possui comprovante');
    }

    const token = createExpenseReceiptAccessToken({
      fileId: expense.receiptFileId,
      expenseId: expense.id,
      adminUserId,
    });

    const baseUrl =
      process.env.API_PUBLIC_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      'http://localhost:4000/api/v1';

    return {
      url: `${baseUrl.replace(/\/$/, '')}/admin/expense-receipts/${token}`,
      expires_in_seconds: 300,
    };
  }

  async streamReceipt(token: string) {
    const verified = verifyExpenseReceiptAccessToken(token);
    if (!verified) {
      throw new ForbiddenException('Token inválido ou expirado');
    }

    const expense = await this.prisma.expense.findUnique({
      where: { id: verified.expenseId },
    });
    if (!expense || expense.receiptFileId !== verified.fileId) {
      throw new NotFoundException('Comprovante não encontrado');
    }

    return this.storageService.getFileBuffer(verified.fileId);
  }

  async getFinanceDashboard() {
    const { start, end } = getCurrentMonthRange();

    const [
      income,
      publicExpenses,
      allExpenses,
      expenseCount,
      categoryCount,
      pendingPixCount,
      recentExpenses,
    ] = await Promise.all([
      aggregateConfirmedIncome(this.prisma, start, end),
      aggregateExpenses(this.prisma, start, end, true),
      aggregateExpenses(this.prisma, start, end, false),
      this.prisma.expense.count(),
      this.prisma.expenseCategory.count({ where: { isActive: true } }),
      this.prisma.pixDonation.count({
        where: {
          status: {
            in: ['AGUARDANDO_CONFIRMACAO_MANUAL', 'COMPROVANTE_ENVIADO'],
          },
        },
      }),
      this.prisma.expense.findMany({
        take: 5,
        orderBy: { date: 'desc' },
        include: { category: true },
      }),
    ]);

    return {
      current_month: {
        asaas_income: roundMoney(income.asaas_income),
        pix_manual_income: roundMoney(income.pix_manual_income),
        total_income: roundMoney(income.total_income),
        public_expenses: roundMoney(publicExpenses),
        all_expenses: roundMoney(allExpenses),
        balance_public: roundMoney(income.total_income - publicExpenses),
        balance_all: roundMoney(income.total_income - allExpenses),
      },
      totals: {
        expenses_count: expenseCount,
        categories_count: categoryCount,
        pending_pix_confirmations: pendingPixCount,
      },
      recent_expenses: recentExpenses.map((e) => this.toExpenseResponse(e)),
    };
  }

  async listTransparencyReports() {
    const reports = await this.prisma.transparencyReport.findMany({
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });

    return reports.map((r) => ({
      id: r.id,
      month: r.month,
      year: r.year,
      summary: r.summary,
      total_income: decimalToNumber(r.totalIncome),
      total_expense: decimalToNumber(r.totalExpense),
      net_balance: decimalToNumber(r.netBalance),
      is_published: r.isPublished,
      published_at: r.publishedAt?.toISOString() ?? null,
      created_at: r.createdAt.toISOString(),
    }));
  }

  async closeTransparencyReport(dto: CloseTransparencyReportDto, userId: string) {
    const { start, end } = monthRangeFromDto(dto.month, dto.year);
    const income = await aggregateConfirmedIncome(this.prisma, start, end);
    const totalExpense = await aggregateExpenses(this.prisma, start, end, true);
    const netBalance = roundMoney(income.total_income - totalExpense);

    const report = await this.prisma.transparencyReport.upsert({
      where: { month_year: { month: dto.month, year: dto.year } },
      update: {
        summary: dto.summary,
        totalIncome: income.total_income,
        totalExpense,
        netBalance,
        isPublished: dto.publish ?? false,
        publishedAt: dto.publish ? new Date() : null,
      },
      create: {
        month: dto.month,
        year: dto.year,
        summary: dto.summary,
        totalIncome: income.total_income,
        totalExpense,
        netBalance,
        isPublished: dto.publish ?? false,
        publishedAt: dto.publish ? new Date() : null,
      },
    });

    await this.auditService.log({
      userId,
      action: 'CLOSE_REPORT',
      entity: 'transparency_reports',
      entityId: report.id,
      newData: report,
    });

    return {
      id: report.id,
      month: report.month,
      year: report.year,
      total_income: decimalToNumber(report.totalIncome),
      total_expense: decimalToNumber(report.totalExpense),
      net_balance: decimalToNumber(report.netBalance),
      is_published: report.isPublished,
    };
  }

  async publishReport(id: string, userId: string) {
    const existing = await this.prisma.transparencyReport.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('Relatório não encontrado');

    const report = await this.prisma.transparencyReport.update({
      where: { id },
      data: { isPublished: true, publishedAt: new Date() },
    });

    await this.auditService.log({
      userId,
      action: 'PUBLISH',
      entity: 'transparency_reports',
      entityId: id,
      oldData: existing,
      newData: report,
    });

    return { id: report.id, is_published: true };
  }

  async unpublishReport(id: string, userId: string) {
    const existing = await this.prisma.transparencyReport.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('Relatório não encontrado');

    const report = await this.prisma.transparencyReport.update({
      where: { id },
      data: { isPublished: false, publishedAt: null },
    });

    await this.auditService.log({
      userId,
      action: 'UNPUBLISH',
      entity: 'transparency_reports',
      entityId: id,
      oldData: existing,
      newData: report,
    });

    return { id: report.id, is_published: false };
  }

  exportReportText(id: string) {
    return this.prisma.transparencyReport
      .findUnique({ where: { id } })
      .then((report) => {
        if (!report) throw new NotFoundException('Relatório não encontrado');

        const lines = [
          'LAR DOS ANJOS PET — RELATÓRIO DE TRANSPARÊNCIA',
          `Período: ${String(report.month).padStart(2, '0')}/${report.year}`,
          '',
          `Total arrecadado: R$ ${decimalToNumber(report.totalIncome).toFixed(2)}`,
          `Total gasto (público): R$ ${decimalToNumber(report.totalExpense).toFixed(2)}`,
          `Saldo: R$ ${decimalToNumber(report.netBalance).toFixed(2)}`,
          '',
          report.summary ? `Resumo:\n${report.summary}` : '',
          '',
          `Publicado: ${report.isPublished ? 'Sim' : 'Não'}`,
          `Gerado em: ${new Date().toISOString()}`,
        ].filter(Boolean);

        return {
          filename: `relatorio-${report.year}-${String(report.month).padStart(2, '0')}.txt`,
          content: lines.join('\n'),
        };
      });
  }

  async reconcileAsaas(params: {
    from?: string;
    to?: string;
    limit?: number;
  }) {
    const limit = Math.min(Math.max(params.limit ?? 50, 1), 100);
    const where: { createdAt?: { gte?: Date; lte?: Date } } = {};

    if (params.from) {
      where.createdAt = { ...where.createdAt, gte: new Date(params.from) };
    }
    if (params.to) {
      where.createdAt = { ...where.createdAt, lte: new Date(params.to) };
    }

    const payments = await this.prisma.payment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    const items = await Promise.all(
      payments.map(async (payment) => {
        let asaasStatus: string | null = null;
        let asaasMapped: string | null = null;
        let mismatch = false;
        let fetchError: string | null = null;

        if (process.env.ASAAS_API_KEY) {
          try {
            const asaasPayment = await this.asaasService.getPayment(
              payment.asaasPaymentId,
            );
            asaasStatus = asaasPayment.status;
            asaasMapped = mapAsaasPaymentStatus(asaasPayment.status);
            mismatch = asaasMapped !== payment.status;
          } catch {
            fetchError = 'Não foi possível consultar Asaas';
          }
        }

        return {
          id: payment.id,
          asaas_payment_id: payment.asaasPaymentId,
          billing_type: payment.billingType,
          local_status: payment.status,
          local_value: decimalToNumber(payment.value),
          asaas_status: asaasStatus,
          asaas_mapped_status: asaasMapped,
          mismatch,
          fetch_error: fetchError,
          paid_at: payment.paidAt?.toISOString() ?? null,
          created_at: payment.createdAt.toISOString(),
        };
      }),
    );

    return {
      items,
      summary: {
        total: items.length,
        mismatches: items.filter((item) => item.mismatch).length,
        pix_manual_included: false,
        note: 'Conciliação Asaas não inclui doações Pix avulso (fluxo manual interno).',
      },
    };
  }

  private async assertReceiptFileExists(fileId: string) {
    const file = await this.prisma.uploadedFile.findUnique({
      where: { id: fileId },
    });
    if (!file) throw new NotFoundException('Comprovante não encontrado');
    if (!file.fileKey.startsWith('expense-receipts/')) {
      throw new BadRequestException('Arquivo inválido para despesa');
    }
  }

  private toExpenseResponse(expense: {
    id: string;
    categoryId: string;
    title: string;
    description: string | null;
    publicDescription: string;
    amount: unknown;
    date: Date;
    supplier: string | null;
    receiptFileId: string | null;
    isPublic: boolean;
    createdAt: Date;
    category: {
      id: string;
      name: string;
      icon: string | null;
      color: string | null;
    };
  }) {
    return {
      id: expense.id,
      category_id: expense.categoryId,
      title: expense.title,
      description: expense.description,
      public_description: expense.publicDescription,
      amount: decimalToNumber(expense.amount),
      date: expense.date.toISOString().slice(0, 10),
      supplier: expense.supplier,
      receipt_file_id: expense.receiptFileId,
      has_receipt: Boolean(expense.receiptFileId),
      is_public: expense.isPublic,
      created_at: expense.createdAt.toISOString(),
      category: expense.category,
    };
  }
}
