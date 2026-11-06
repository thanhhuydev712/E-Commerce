import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { DbTransaction } from '../../common/database.js';
import { lockUser } from '../../common/database.js';
import type { CreateRoleDto } from './access.dto.js';

@Injectable()
export class AccessService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}
  listRoles() {
    return this.prisma.role.findMany({
      orderBy: { code: 'asc' },
      include: {
        rolePermissions: { select: { permission: { select: { code: true } } } },
      },
    });
  }
  listPermissions() {
    return this.prisma.permission.findMany({ orderBy: { code: 'asc' } });
  }
  async serializeChanges(tx: DbTransaction) {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(20261106, 1)`;
  }
  async createRole(actorId: string, dto: CreateRoleDto) {
    return this.prisma.$transaction(async (tx) => {
      const role = await tx.role.create({
        data: { code: dto.code, name: dto.name, isSystem: false },
      });
      await tx.auditLog.create({
        data: {
          actorId,
          actorType: 'USER',
          action: 'ROLE_CREATE',
          entityType: 'ROLE',
          entityId: role.id,
        },
      });
      return role;
    });
  }
  async setPermissions(actorId: string, roleId: string, codes: string[]) {
    return this.prisma.$transaction(async (tx) => {
      await this.serializeChanges(tx);
      const role = await tx.role.findUnique({ where: { id: roleId } });
      if (!role) throw new NotFoundException('Role not found');
      if (role.isSystem)
        throw new ForbiddenException(
          'System role permissions are managed by the reviewed seed',
        );
      const permissions = await tx.permission.findMany({
        where: { code: { in: codes } },
      });
      if (permissions.length !== codes.length)
        throw new BadRequestException('Unknown permission code');
      await tx.rolePermission.deleteMany({ where: { roleId } });
      if (permissions.length)
        await tx.rolePermission.createMany({
          data: permissions.map((permission) => ({
            roleId,
            permissionId: permission.id,
          })),
        });
      await tx.auditLog.create({
        data: {
          actorId,
          actorType: 'USER',
          action: 'ROLE_PERMISSIONS_SET',
          entityType: 'ROLE',
          entityId: roleId,
          afterRedacted: { codes },
        },
      });
      return { roleId, codes };
    });
  }
  async setRoles(actorId: string, userId: string, roleIds: string[]) {
    if (actorId === userId)
      throw new ForbiddenException('Self role changes are not allowed');
    return this.prisma.$transaction(async (tx) => {
      await this.serializeChanges(tx);
      await lockUser(tx, this.prisma.schema, userId);
      const user = await tx.user.findUnique({
        where: { id: userId },
        include: { userRolesByUser: { include: { role: true } } },
      });
      if (!user || user.status !== 'ACTIVE')
        throw new NotFoundException('Active account not found');
      const roles = await tx.role.findMany({ where: { id: { in: roleIds } } });
      if (roles.length !== roleIds.length)
        throw new BadRequestException('Unknown role');
      if (
        user.userRolesByUser.some((item) => item.role.code === 'ADMIN') &&
        !roles.some((role) => role.code === 'ADMIN')
      ) {
        const other = await tx.user.count({
          where: {
            id: { not: userId },
            status: 'ACTIVE',
            userRolesByUser: { some: { role: { code: 'ADMIN' } } },
          },
        });
        if (!other)
          throw new ForbiddenException(
            'Cannot remove the last active administrator',
          );
      }
      await tx.userRole.deleteMany({ where: { userId } });
      await tx.userRole.createMany({
        data: roleIds.map((roleId) => ({
          userId,
          roleId,
          assignedBy: actorId,
        })),
      });
      await tx.auditLog.create({
        data: {
          actorId,
          actorType: 'USER',
          action: 'USER_ROLES_SET',
          entityType: 'USER',
          entityId: userId,
          afterRedacted: { roleIds },
        },
      });
      return { userId, roleCodes: roles.map((role) => role.code) };
    });
  }
}
