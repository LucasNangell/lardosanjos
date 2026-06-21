import { Controller, Get, Param, Res } from '@nestjs/common';
import { FastifyReply } from 'fastify';
import { Public } from '../../auth/decorators/auth.decorators';
import { PixDonationsService } from './pix-donations.service';

@Controller('admin/pix/receipts')
export class PixReceiptController {
  constructor(private readonly pixDonationsService: PixDonationsService) {}

  @Public()
  @Get(':token')
  async viewReceipt(@Param('token') token: string, @Res() reply: FastifyReply) {
    const file = await this.pixDonationsService.streamReceipt(token);
    reply.header('Content-Type', file.mimeType);
    reply.header('Cache-Control', 'private, no-store');
    reply.header('X-Content-Type-Options', 'nosniff');
    return reply.send(file.buffer);
  }
}
