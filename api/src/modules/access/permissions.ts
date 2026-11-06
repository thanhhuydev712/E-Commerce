export const PERMISSIONS = {
  'accounts.read': 'Read account profiles',
  'accounts.manage': 'Lock or archive accounts',
  'access.read': 'Read roles and permissions',
  'access.manage': 'Manage role assignments and permission grants',
  'catalog.read': 'Read unpublished catalog data',
  'catalog.write': 'Manage and publish catalog data',
  'pricing.write': 'Manage VND prices and tax metadata',
  'media.write': 'Upload and inspect catalog media',
  'inventory.read': 'Read warehouse balances and movements',
  'inventory.adjust': 'Create warehouses and adjust stock with audit',
} as const;
export type PermissionCode = keyof typeof PERMISSIONS;
