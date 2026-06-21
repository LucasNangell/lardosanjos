import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/audit.service';
import { ConsentDto, DataRequestDto } from './lgpd.dto';

@Injectable()
export class LgpdService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async recordConsent(dto: ConsentDto) {
    const key = `lgpd:consent:${dto.email.toLowerCase()}`;
    const value = JSON.stringify({
      analyticsConsent: dto.analyticsConsent,
      marketingConsent: dto.marketingConsent,
      recordedAt: new Date().toISOString(),
    });

    await this.prisma.systemSetting.upsert({
      where: { key },
      update: { value },
      create: {
        key,
        value,
        description: 'Registro de consentimento LGPD do titular',
      },
    });

    await this.audit.log({
      action: 'LGPD_CONSENT',
      entity: 'SystemSetting',
      entityId: key,
      newData: { email: dto.email, analyticsConsent: dto.analyticsConsent },
      ipAddress: dto.ipAddress,
    });

    return {
      message: 'Consentimento registrado com sucesso',
      recordedAt: new Date().toISOString(),
    };
  }

  async requestDataExport(dto: DataRequestDto) {
    const requestId = `export-${Date.now()}`;
    const key = `lgpd:export:${requestId}`;

    await this.prisma.systemSetting.create({
      data: {
        key,
        value: JSON.stringify({
          email: dto.email,
          fullName: dto.fullName,
          reason: dto.reason,
          status: 'PENDING',
          requestedAt: new Date().toISOString(),
        }),
        description: 'Solicitação de exportação de dados LGPD',
      },
    });

    await this.audit.log({
      action: 'LGPD_EXPORT_REQUEST',
      entity: 'SystemSetting',
      entityId: requestId,
      newData: { email: dto.email },
    });

    return {
      message:
        'Solicitação de exportação registrada. Nossa equipe entrará em contato em até 15 dias úteis.',
      requestId,
      status: 'PENDING',
    };
  }

  async requestDataDeletion(dto: DataRequestDto) {
    const requestId = `delete-${Date.now()}`;
    const key = `lgpd:delete:${requestId}`;

    await this.prisma.systemSetting.create({
      data: {
        key,
        value: JSON.stringify({
          email: dto.email,
          fullName: dto.fullName,
          reason: dto.reason,
          status: 'PENDING',
          requestedAt: new Date().toISOString(),
        }),
        description: 'Solicitação de exclusão de dados LGPD',
      },
    });

    await this.audit.log({
      action: 'LGPD_DELETE_REQUEST',
      entity: 'SystemSetting',
      entityId: requestId,
      newData: { email: dto.email },
    });

    return {
      message:
        'Solicitação de exclusão registrada. Nossa equipe analisará em até 15 dias úteis.',
      requestId,
      status: 'PENDING',
    };
  }
}
