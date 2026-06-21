import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';
import * as redisHealth from './common/redis-health.util';

describe('AppService', () => {
  const prisma = {
    $queryRaw: jest.fn(),
  } as unknown as PrismaService;

  let service: AppService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AppService(prisma);
  });

  it('getHealth retorna status ok', () => {
    const health = service.getHealth();
    expect(health.status).toBe('ok');
    expect(health.uptime).toBeGreaterThanOrEqual(0);
    expect(health.timestamp).toBeTruthy();
  });

  it('getReadiness retorna ok quando banco e redis respondem', async () => {
    (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ ok: 1 }]);
    jest.spyOn(redisHealth, 'pingRedis').mockResolvedValue(true);
    process.env.REDIS_URL = 'redis://localhost:6379';
    process.env.NODE_ENV = 'production';

    const readiness = await service.getReadiness();

    expect(readiness.status).toBe('ok');
    expect(readiness.checks.database).toBe('ok');
    expect(readiness.checks.redis).toBe('ok');
  });

  it('getReadiness retorna degraded quando banco falha', async () => {
    (prisma.$queryRaw as jest.Mock).mockRejectedValue(new Error('db down'));
    process.env.REDIS_URL = 'redis://localhost:6379';
    process.env.NODE_ENV = 'production';

    const readiness = await service.getReadiness();

    expect(readiness.status).toBe('degraded');
    expect(readiness.checks.database).toBe('error');
  });

  it('getReadiness ignora redis fora de produção sem REDIS_URL', async () => {
    (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ ok: 1 }]);
    delete process.env.REDIS_URL;
    process.env.NODE_ENV = 'test';

    const readiness = await service.getReadiness();

    expect(readiness.status).toBe('ok');
    expect(readiness.checks.redis).toBe('skipped');
  });
});
