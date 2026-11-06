import type { Prisma } from '../../../generated/prisma-v2/index.js';
export const accountSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  phone: true,
  status: true,
  emailVerifiedAt: true,
  createdAt: true,
  updatedAt: true,
  userRolesByUser: {
    select: {
      role: {
        select: {
          code: true,
          rolePermissions: {
            select: { permission: { select: { code: true } } },
          },
        },
      },
    },
  },
} satisfies Prisma.UserSelect;
export type SelectedAccount = Prisma.UserGetPayload<{
  select: typeof accountSelect;
}>;
export function accountView(user: SelectedAccount) {
  const { userRolesByUser, ...profile } = user;
  return {
    ...profile,
    roleCodes: userRolesByUser.map((item) => item.role.code).sort(),
    permissions: [
      ...new Set(
        userRolesByUser.flatMap((item) =>
          item.role.rolePermissions.map((entry) => entry.permission.code),
        ),
      ),
    ].sort(),
  };
}
