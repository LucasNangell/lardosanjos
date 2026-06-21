import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuditLogsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: {
    page?: number;
    limit?: number;
    entity?: string;
    action?: string;
  }) {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 50));
    const skip = (page - 1) * limit;

    const where = {
      ...(query.entity && { entity: query.entity }),
      ...(query.action && { action: query.action }),
    };

    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      items: items.map((log) => ({
        id: log.id,
        action: log.action,
        entity: log.entity,
        entity_id: log.entityId,
        user: log.user
          ? { id: log.user.id, name: log.user.name, email: log.user.email }
          : null,
        ip_address: log.ipAddress,
        created_at: log.createdAt.toISOString(),
        old_data: log.oldData,
        new_data: log.newData,
      })),
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    };
  }
}
