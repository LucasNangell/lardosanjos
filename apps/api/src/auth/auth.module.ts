import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { EmailService } from '../common/email.service';
import { AuditService } from '../common/audit.service';
import { MfaService } from './mfa/mfa.service';
import { MfaController } from './mfa/mfa.controller';
import { FinancialMfaGuard } from './guards/financial-mfa.guard';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({}),
  ],
  controllers: [AuthController, MfaController],
  providers: [AuthService, JwtStrategy, EmailService, AuditService, MfaService, FinancialMfaGuard],
  exports: [AuthService, MfaService, FinancialMfaGuard],
})
export class AuthModule {}
