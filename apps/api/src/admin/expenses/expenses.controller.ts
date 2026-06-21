import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { FinancialMfaGuard } from '../../auth/guards/financial-mfa.guard';
import { RequirePermissions } from '../../auth/decorators/auth.decorators';
import { RequireFinancialMfa } from '../../auth/decorators/financial-mfa.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { AuthUser } from '../../auth/interfaces/auth-user.interface';
import { ExpensesService } from './expenses.service';
import {
  CreateExpenseCategoryDto,
  CreateExpenseDto,
  UpdateExpenseCategoryDto,
  UpdateExpenseDto,
} from './expenses.dto';

@Controller('admin/expense-categories')
@UseGuards(JwtAuthGuard, PermissionsGuard, FinancialMfaGuard)
export class ExpenseCategoriesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Get()
  @RequirePermissions('FINANCE_READ')
  list() {
    return this.expensesService.listCategories();
  }

  @Post()
  @RequirePermissions('FINANCE_WRITE')
  @RequireFinancialMfa()
  create(@Body() dto: CreateExpenseCategoryDto, @CurrentUser() user: AuthUser) {
    return this.expensesService.createCategory(dto, user.id);
  }

  @Patch(':id')
  @RequirePermissions('FINANCE_WRITE')
  @RequireFinancialMfa()
  update(
    @Param('id') id: string,
    @Body() dto: UpdateExpenseCategoryDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.expensesService.updateCategory(id, dto, user.id);
  }

  @Delete(':id')
  @RequirePermissions('FINANCE_WRITE')
  @RequireFinancialMfa()
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.expensesService.deleteCategory(id, user.id);
  }
}

@Controller('admin/expenses')
@UseGuards(JwtAuthGuard, PermissionsGuard, FinancialMfaGuard)
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Get()
  @RequirePermissions('FINANCE_READ')
  list() {
    return this.expensesService.listExpenses();
  }

  @Post('receipts/upload')
  @RequirePermissions('FINANCE_WRITE')
  @RequireFinancialMfa()
  async uploadReceipt(@Req() req: FastifyRequest, @CurrentUser() user: AuthUser) {
    const file = await req.file();
    if (!file) {
      throw new BadRequestException('Nenhum arquivo enviado');
    }

    const buffer = await file.toBuffer();
    return this.expensesService.uploadReceipt(buffer, file.mimetype, user.id);
  }

  @Get(':id/receipt-url')
  @RequirePermissions('FINANCE_READ')
  receiptUrl(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.expensesService.getReceiptAccessUrl(id, user.id);
  }

  @Get(':id')
  @RequirePermissions('FINANCE_READ')
  get(@Param('id') id: string) {
    return this.expensesService.getExpense(id);
  }

  @Post()
  @RequirePermissions('FINANCE_WRITE')
  @RequireFinancialMfa()
  create(@Body() dto: CreateExpenseDto, @CurrentUser() user: AuthUser) {
    return this.expensesService.createExpense(dto, user.id);
  }

  @Patch(':id')
  @RequirePermissions('FINANCE_WRITE')
  @RequireFinancialMfa()
  update(
    @Param('id') id: string,
    @Body() dto: UpdateExpenseDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.expensesService.updateExpense(id, dto, user.id);
  }

  @Delete(':id')
  @RequirePermissions('FINANCE_WRITE')
  @RequireFinancialMfa()
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.expensesService.deleteExpense(id, user.id);
  }
}
