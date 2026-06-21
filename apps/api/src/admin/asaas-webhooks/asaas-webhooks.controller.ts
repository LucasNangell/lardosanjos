import {
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../auth/guards/permissions.guard';
import { RequirePermissions } from '../../auth/decorators/auth.decorators';
import { AsaasWebhookService } from '../../integrations/asaas/asaas-webhook.service';
import { ListAsaasWebhooksQueryDto } from './asaas-webhooks.dto';

@Controller('admin/webhooks/asaas')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AsaasWebhooksAdminController {
  constructor(private readonly webhookService: AsaasWebhookService) {}

  @Get()
  @RequirePermissions('FINANCE_READ')
  list(@Query() query: ListAsaasWebhooksQueryDto) {
    return this.webhookService.list(query);
  }

  @Get(':id')
  @RequirePermissions('FINANCE_READ')
  getById(@Param('id') id: string) {
    return this.webhookService.getById(id);
  }

  @Post(':id/reprocess')
  @RequirePermissions('FINANCE_WRITE')
  reprocess(@Param('id') id: string) {
    return this.webhookService.reprocess(id);
  }
}
