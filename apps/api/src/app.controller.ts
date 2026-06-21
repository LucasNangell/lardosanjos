import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { AppService } from './app.service';
import { HealthStatus, ReadinessStatus } from '@lardosanjos/types';
import { Public } from './auth/decorators/auth.decorators';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get('health')
  getHealth(): HealthStatus {
    return this.appService.getHealth();
  }

  @Public()
  @Get('health/ready')
  async getReadiness(): Promise<ReadinessStatus> {
    const readiness = await this.appService.getReadiness();
    if (readiness.status !== 'ok') {
      throw new ServiceUnavailableException(readiness);
    }
    return readiness;
  }
}
