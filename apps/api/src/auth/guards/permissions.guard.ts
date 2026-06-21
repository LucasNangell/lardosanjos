import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/auth.decorators';
import { AuthUser } from '../interfaces/auth-user.interface';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!required || required.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user as AuthUser | undefined;

    if (!user) throw new ForbiddenException('Acesso negado');

    const hasPermission = required.some((p) => user.permissions.includes(p));
    if (!hasPermission) {
      throw new ForbiddenException('Permissão insuficiente');
    }

    return true;
  }
}
