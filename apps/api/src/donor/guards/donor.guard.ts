import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthUser } from '../../auth/interfaces/auth-user.interface';
import { Donor } from '@lardosanjos/database';

export const DONOR_REQUEST_KEY = 'donor';

@Injectable()
export class DonorGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user as AuthUser | undefined;

    if (!user) {
      throw new UnauthorizedException();
    }

    const donor = await this.prisma.donor.findUnique({
      where: { userId: user.id },
    });

    if (!donor) {
      throw new ForbiddenException('Perfil de doador não encontrado');
    }

    request[DONOR_REQUEST_KEY] = donor as Donor;
    return true;
  }
}
