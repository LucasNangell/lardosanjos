import { Injectable } from '@nestjs/common';
import { HealthStatus, ReadinessStatus, ServiceCheckStatus } from '@lardosanjos/types';
import { PrismaService } from './prisma/prisma.service';
import { pingRedis } from './common/redis-health.util';

@Injectable()
export class AppService {
  private readonly startTime = Date.now();

  constructor(private readonly prisma: PrismaService) {}

  getHealth(): HealthStatus {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
    };
  }

  async getReadiness(): Promise<ReadinessStatus> {
    const uptime = Math.floor((Date.now() - this.startTime) / 1000);
    const timestamp = new Date().toISOString();
    const isProduction = process.env.NODE_ENV === 'production';
    const redisUrl = process.env.REDIS_URL?.trim();

    let database: ServiceCheckStatus = 'ok';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      database = 'error';
    }

    let redis: ServiceCheckStatus = 'skipped';
    if (redisUrl) {
      try {
        redis = (await pingRedis(redisUrl)) ? 'ok' : 'error';
      } catch {
        redis = 'error';
      }
    } else if (isProduction) {
      redis = 'error';
    }

    const status =
      database === 'ok' && (redis === 'ok' || redis === 'skipped') ? 'ok' : 'degraded';

    return {
      status,
      timestamp,
      uptime,
      checks: { database, redis },
    };
  }
}
