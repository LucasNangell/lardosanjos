import {
  Body,
  Controller,
  Headers,
  HttpCode,
  Post,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { Public } from '../../auth/decorators/auth.decorators';
import { AsaasWebhookService } from './asaas-webhook.service';
import { AsaasWebhookPayload } from './asaas.types';

@Controller('integration/asaas')
@SkipThrottle()
export class AsaasWebhookController {
  constructor(private readonly webhookService: AsaasWebhookService) {}

  @Public()
  @Post('webhook')
  @HttpCode(200)
  async handleWebhook(
    @Body() payload: AsaasWebhookPayload,
    @Headers('asaas-access-token') accessToken?: string,
  ) {
    const secret = process.env.ASAAS_WEBHOOK_SECRET;
    if (secret && accessToken !== secret) {
      throw new UnauthorizedException('Webhook não autorizado');
    }

    if (!payload?.id || !payload?.event) {
      throw new BadRequestException('Payload de webhook inválido');
    }

    return this.webhookService.ingest(payload);
  }
}
