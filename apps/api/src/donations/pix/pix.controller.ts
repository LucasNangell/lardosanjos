import {
  BadRequestException,
  Controller,
  Get,
  Post,
  Param,
  Body,
  Req,
  HttpCode,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { FastifyRequest } from 'fastify';
import { Public } from '../../auth/decorators/auth.decorators';
import { PixService } from './pix.service';

@Controller('public')
export class PixController {
  constructor(private readonly pixService: PixService) {}

  @Public()
  @Get('pix/settings')
  getSettings() {
    return this.pixService.getSettings();
  }

  @Public()
  @Post('donations/pix')
  @HttpCode(201)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  generatePix(@Body() body: unknown) {
    return this.pixService.generatePix(body);
  }

  @Public()
  @Get('donations/pix/:id/status')
  getStatus(@Param('id') id: string) {
    return this.pixService.getStatus(id);
  }

  @Public()
  @Post('donations/pix/:id/mark-as-paid')
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  markAsPaid(@Param('id') id: string) {
    return this.pixService.markAsPaid(id);
  }

  @Public()
  @Post('donations/pix/:id/upload-receipt')
  @HttpCode(200)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async uploadReceipt(
    @Param('id') id: string,
    @Req() req: FastifyRequest,
  ) {
    const file = await req.file();
    if (!file) {
      throw new BadRequestException('Nenhum arquivo enviado');
    }

    const buffer = await file.toBuffer();
    return this.pixService.uploadReceipt(
      id,
      buffer,
      file.mimetype,
    );
  }
}
