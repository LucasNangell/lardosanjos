import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(params: {
    userId?: string;
    action: string;
    entity: string;
    entityId?: string;
    oldData?: unknown;
    newData?: unknown;
    ipAddress?: string;
  }) {
    await this.prisma.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        oldData: params.oldData ? (params.oldData as object) : undefined,
        newData: params.newData ? (params.newData as object) : undefined,
        ipAddress: params.ipAddress,
      },
    });
  }
}
