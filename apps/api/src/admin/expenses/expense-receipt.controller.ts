import { Controller, Get, Param, Res } from '@nestjs/common';
import { FastifyReply } from 'fastify';
import { Public } from '../../auth/decorators/auth.decorators';
import { ExpensesService } from './expenses.service';

@Controller('admin/expense-receipts')
export class ExpenseReceiptController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Public()
  @Get(':token')
  async viewReceipt(@Param('token') token: string, @Res() reply: FastifyReply) {
    const file = await this.expensesService.streamReceipt(token);
    reply.header('Content-Type', file.mimeType);
    reply.header('Cache-Control', 'private, no-store');
    reply.header('X-Content-Type-Options', 'nosniff');
    return reply.send(file.buffer);
  }
}
