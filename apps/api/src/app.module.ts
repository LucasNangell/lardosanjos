import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { CommonModule } from './common/common.module';
import { AuthModule } from './auth/auth.module';
import { AdminModule } from './admin/admin.module';
import { StorageModule } from './storage/storage.module';
import { AsaasModule } from './integrations/asaas/asaas.module';
import { DonationsModule } from './donations/donations.module';
import { AnimalsModule } from './animals/animals.module';
import { CampaignsModule } from './campaigns/campaigns.module';
import { MuralModule } from './mural/mural.module';
import { BadgesModule } from './badges/badges.module';
import { LgpdModule } from './lgpd/lgpd.module';
import { DonorModule } from './donor/donor.module';
import { PublicModule } from './public/public.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';

@Module({
  imports: [
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    PrismaModule,
    CommonModule,
    StorageModule,
    AsaasModule,
    AuthModule,
    AdminModule,
    DonationsModule,
    AnimalsModule,
    CampaignsModule,
    MuralModule,
    BadgesModule,
    LgpdModule,
    DonorModule,
    PublicModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AppModule {}
