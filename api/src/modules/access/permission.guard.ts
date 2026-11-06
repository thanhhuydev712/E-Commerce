import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { AuthenticatedRequest } from '../../common/interfaces/request-with-user.interface.js';
import type { PermissionCode } from './permissions.js';
const KEY = 'required_permissions';
export const RequirePermissions = (...codes: PermissionCode[]) =>
  SetMetadata(KEY, codes);
@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(@Inject(Reflector) private readonly reflector: Reflector) {}
  canActivate(context: ExecutionContext) {
    const required = this.reflector.getAllAndOverride<PermissionCode[]>(KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required?.length) return true;
    const user = context.switchToHttp().getRequest<AuthenticatedRequest>().user;
    return !!user && required.every((code) => user.permissions.includes(code));
  }
}
