import type { PrismaClient } from '../../../generated/prisma-v2/index.js';
import { PERMISSIONS } from './permissions.js';
export async function seedAccess(prisma: PrismaClient) {
  return prisma.$transaction(
    async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(20261106,1)`;
      const admin = await tx.role.upsert({
        where: { code: 'ADMIN' },
        create: { code: 'ADMIN', name: 'Administrator', isSystem: true },
        update: {},
      });
      await tx.role.upsert({
        where: { code: 'CUSTOMER' },
        create: { code: 'CUSTOMER', name: 'Customer', isSystem: true },
        update: {},
      });
      const entries = Object.entries(PERMISSIONS);
      const existing = await tx.permission.findMany({
        where: { code: { in: entries.map(([code]) => code) } },
      });
      const byCode = new Map(
        existing.map((permission) => [permission.code, permission]),
      );
      const missing = entries.filter(([code]) => !byCode.has(code));
      // Ghi theo lô để seed không giữ khóa quá lâu khi PostgreSQL ở xa.
      if (missing.length)
        await tx.permission.createMany({
          data: missing.map(([code, description]) => ({ code, description })),
          skipDuplicates: true,
        });
      for (const [code, description] of entries)
        if (byCode.has(code) && byCode.get(code)!.description !== description)
          await tx.permission.update({
            where: { code },
            data: { description },
          });
      const permissions = missing.length
        ? await tx.permission.findMany({
            where: { code: { in: entries.map(([code]) => code) } },
          })
        : existing;
      await tx.rolePermission.createMany({
        data: permissions.map((permission) => ({
          roleId: admin.id,
          permissionId: permission.id,
        })),
        skipDuplicates: true,
      });
      await tx.auditLog.create({
        data: {
          actorType: 'SYSTEM',
          action: 'ACCESS_SEED',
          entityType: 'ACCESS',
          entityId: 'phase01',
          afterRedacted: { permissionCodes: Object.keys(PERMISSIONS) },
        },
      });
      return {
        roles: ['ADMIN', 'CUSTOMER'],
        permissionCodes: Object.keys(PERMISSIONS),
        userAssignmentsChanged: false,
      };
    },
    { maxWait: 10000, timeout: 30000 },
  );
}
