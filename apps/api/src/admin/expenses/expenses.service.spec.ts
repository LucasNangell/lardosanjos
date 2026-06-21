import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../common/audit.service';
import { StorageService } from '../../storage/storage.service';
import { AsaasService } from '../../integrations/asaas/asaas.service';
import {
  assertValidExpenseReceipt,
  EXPENSE_RECEIPT_ALLOWED_TYPES,
} from './expenses.utils';
import {
  createExpenseReceiptAccessToken,
  verifyExpenseReceiptAccessToken,
} from './expense-receipt-access.util';

describe('ExpensesService', () => {
  let service: ExpensesService;
  let prisma: {
    expense: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
      count: jest.Mock;
      aggregate: jest.Mock;
    };
    expenseCategory: {
      findUnique: jest.Mock;
      findMany: jest.Mock;
      count: jest.Mock;
    };
    uploadedFile: { findUnique: jest.Mock };
    payment: { findMany: jest.Mock; aggregate: jest.Mock };
    pixDonation: { aggregate: jest.Mock; count: jest.Mock };
    transparencyReport: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      upsert: jest.Mock;
      update: jest.Mock;
    };
  };
  let audit: { log: jest.Mock };
  let storage: { upload: jest.Mock; getFileBuffer: jest.Mock };
  let asaas: { getPayment: jest.Mock };

  const category = {
    id: 'cat-1',
    name: 'Alimentação',
    icon: null,
    color: '#2AA98C',
    isActive: true,
  };

  const publicExpense = {
    id: 'exp-1',
    categoryId: 'cat-1',
    title: 'Ração',
    description: 'Nota interna',
    publicDescription: 'Compra de ração',
    amount: { toString: () => '150.50' },
    date: new Date('2026-06-01'),
    supplier: 'PetShop',
    receiptFileId: 'file-1',
    isPublic: true,
    createdById: 'admin-1',
    createdAt: new Date('2026-06-01'),
    category,
  };

  const privateExpense = {
    ...publicExpense,
    id: 'exp-2',
    isPublic: false,
    receiptFileId: 'file-2',
  };

  beforeEach(() => {
    prisma = {
      expense: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
        aggregate: jest.fn(),
      },
      expenseCategory: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
      uploadedFile: { findUnique: jest.fn() },
      payment: { findMany: jest.fn(), aggregate: jest.fn() },
      pixDonation: { aggregate: jest.fn(), count: jest.fn() },
      transparencyReport: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        upsert: jest.fn(),
        update: jest.fn(),
      },
    };
    audit = { log: jest.fn() };
    storage = {
      upload: jest.fn(),
      getFileBuffer: jest.fn(),
    };
    asaas = { getPayment: jest.fn() };

    service = new ExpensesService(
      prisma as unknown as PrismaService,
      audit as unknown as AuditService,
      storage as unknown as StorageService,
      asaas as unknown as AsaasService,
    );
  });

  it('creates public expense and audits', async () => {
    prisma.expenseCategory.findUnique.mockResolvedValue(category);
    prisma.expense.create.mockResolvedValue(publicExpense);

    const result = await service.createExpense(
      {
        category_id: 'cat-1',
        title: 'Ração',
        public_description: 'Compra de ração',
        amount: 150.5,
        date: '2026-06-01',
        is_public: true,
      },
      'admin-1',
    );

    expect(result.is_public).toBe(true);
    expect(result.amount).toBe(150.5);
    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'CREATE', entity: 'expenses' }),
    );
  });

  it('creates private expense', async () => {
    prisma.expenseCategory.findUnique.mockResolvedValue(category);
    prisma.expense.create.mockResolvedValue(privateExpense);

    const result = await service.createExpense(
      {
        category_id: 'cat-1',
        title: 'Ração',
        public_description: 'Interno',
        amount: 150.5,
        date: '2026-06-01',
        is_public: false,
      },
      'admin-1',
    );

    expect(result.is_public).toBe(false);
  });

  it('uploads valid receipt', async () => {
    storage.upload.mockResolvedValue({
      fileId: 'file-1',
      fileSize: 1000,
    });

    const result = await service.uploadReceipt(
      Buffer.alloc(1000),
      'application/pdf',
      'admin-1',
    );

    expect(result.file_id).toBe('file-1');
    expect(storage.upload).toHaveBeenCalledWith(
      expect.any(Buffer),
      'application/pdf',
      'expense-receipts',
      'admin-1',
    );
  });

  it('rejects invalid receipt mime type', () => {
    expect(() =>
      assertValidExpenseReceipt('application/x-msdownload', 100),
    ).toThrow(BadRequestException);
  });

  it('rejects receipt larger than 5MB', () => {
    expect(() =>
      assertValidExpenseReceipt('application/pdf', 6 * 1024 * 1024),
    ).toThrow(BadRequestException);
  });

  it('accepts allowed receipt types', () => {
    for (const mime of EXPENSE_RECEIPT_ALLOWED_TYPES) {
      expect(() => assertValidExpenseReceipt(mime, 1024)).not.toThrow();
    }
  });

  it('audits update of published expense with dedicated action', async () => {
    prisma.expense.findUnique.mockResolvedValue(publicExpense);
    prisma.expense.update.mockResolvedValue({
      ...publicExpense,
      amount: { toString: () => '160.00' },
    });

    await service.updateExpense(
      'exp-1',
      { amount: 160 },
      'admin-1',
    );

    expect(audit.log).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'UPDATE_PUBLISHED_EXPENSE',
        oldData: publicExpense,
      }),
    );
  });

  it('closes monthly report using confirmed income and public expenses', async () => {
    prisma.payment.aggregate.mockResolvedValue({
      _sum: { value: { toString: () => '1000.00' } },
    });
    prisma.pixDonation.aggregate.mockResolvedValue({
      _sum: { amount: { toString: () => '200.00' } },
    });
    prisma.expense.aggregate.mockResolvedValue({
      _sum: { amount: { toString: () => '300.00' } },
    });
    prisma.transparencyReport.upsert.mockResolvedValue({
      id: 'rep-1',
      month: 6,
      year: 2026,
      totalIncome: { toString: () => '1200.00' },
      totalExpense: { toString: () => '300.00' },
      netBalance: { toString: () => '900.00' },
      isPublished: true,
    });

    const result = await service.closeTransparencyReport(
      { month: 6, year: 2026, summary: 'Junho', publish: true },
      'admin-1',
    );

    expect(result.total_income).toBe(1200);
    expect(result.total_expense).toBe(300);
    expect(result.net_balance).toBe(900);
    expect(prisma.expense.aggregate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ isPublic: true }),
      }),
    );
  });

  it('reconcileAsaas excludes pix manual and compares local status', async () => {
    prisma.payment.findMany.mockResolvedValue([
      {
        id: 'pay-1',
        asaasPaymentId: 'asaas-1',
        billingType: 'PIX',
        status: 'CONFIRMED',
        value: { toString: () => '50.00' },
        paidAt: new Date('2026-06-01'),
        createdAt: new Date('2026-06-01'),
      },
    ]);
    process.env.ASAAS_API_KEY = 'test-key';
    asaas.getPayment.mockResolvedValue({ status: 'PENDING' });

    const result = await service.reconcileAsaas({ limit: 10 });

    expect(result.summary.pix_manual_included).toBe(false);
    expect(result.items[0].mismatch).toBe(true);
    delete process.env.ASAAS_API_KEY;
  });

  it('streams receipt with valid token', async () => {
    const token = createExpenseReceiptAccessToken({
      fileId: 'file-1',
      expenseId: 'exp-1',
      adminUserId: 'admin-1',
      ttlSeconds: 300,
    });

    prisma.expense.findUnique.mockResolvedValue(publicExpense);
    storage.getFileBuffer.mockResolvedValue({
      buffer: Buffer.from('pdf'),
      mimeType: 'application/pdf',
    });

    const file = await service.streamReceipt(token);
    expect(file.mimeType).toBe('application/pdf');
    expect(verifyExpenseReceiptAccessToken(token)).not.toBeNull();
  });

  it('throws when expense not found', async () => {
    prisma.expense.findUnique.mockResolvedValue(null);
    await expect(service.getExpense('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('preserves decimal precision in response', async () => {
    prisma.expense.findUnique.mockResolvedValue({
      ...publicExpense,
      amount: { toString: () => '150.50' },
    });

    const result = await service.getExpense('exp-1');
    expect(result.amount).toBe(150.5);
  });
});
