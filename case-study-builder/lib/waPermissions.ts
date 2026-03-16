'use client';

import type { Role } from '@prisma/client';

// All roles from Prisma schema
export const WA_ROLES = ['VIEWER', 'CONTRIBUTOR', 'APPROVER', 'ADMIN', 'IT_DEPARTMENT', 'MARKETING'] as const;
export type WaRole = Role;

// Role hierarchy (higher index = more permissions)
const ROLE_HIERARCHY: Record<WaRole, number> = {
  VIEWER: 0,
  CONTRIBUTOR: 1,
  MARKETING: 2,
  IT_DEPARTMENT: 3,
  APPROVER: 4,
  ADMIN: 5,
};

// Permission definitions
export type WaPermission =
  | 'view:cases'
  | 'create:cases'
  | 'edit:own_cases'
  | 'edit:all_cases'
  | 'delete:own_cases'
  | 'delete:all_cases'
  | 'approve:cases'
  | 'reject:cases'
  | 'publish:cases'
  | 'view:analytics'
  | 'view:leaderboard'
  | 'view:library'
  | 'export:data'
  | 'manage:users'
  | 'manage:system'
  | 'access:admin_panel'
  | 'access:it_panel'
  | 'access:marketing_panel'
  | 'upload:files'
  | 'comment:cases'
  | 'like:cases';

// Role to permissions mapping
const ROLE_PERMISSIONS: Record<WaRole, WaPermission[]> = {
  VIEWER: [
    'view:cases',
    'view:library',
    'view:leaderboard',
    'like:cases',
  ],
  CONTRIBUTOR: [
    'view:cases',
    'create:cases',
    'edit:own_cases',
    'delete:own_cases',
    'view:analytics',
    'view:leaderboard',
    'view:library',
    'upload:files',
    'comment:cases',
    'like:cases',
  ],
  MARKETING: [
    'view:cases',
    'view:analytics',
    'view:leaderboard',
    'view:library',
    'export:data',
    'access:marketing_panel',
    'comment:cases',
    'like:cases',
  ],
  IT_DEPARTMENT: [
    'view:cases',
    'view:analytics',
    'view:leaderboard',
    'view:library',
    'manage:system',
    'access:it_panel',
    'comment:cases',
    'like:cases',
  ],
  APPROVER: [
    'view:cases',
    'create:cases',
    'edit:own_cases',
    'delete:own_cases',
    'approve:cases',
    'reject:cases',
    'view:analytics',
    'view:leaderboard',
    'view:library',
    'export:data',
    'upload:files',
    'comment:cases',
    'like:cases',
  ],
  ADMIN: [
    'view:cases',
    'create:cases',
    'edit:own_cases',
    'edit:all_cases',
    'delete:own_cases',
    'delete:all_cases',
    'approve:cases',
    'reject:cases',
    'publish:cases',
    'view:analytics',
    'view:leaderboard',
    'view:library',
    'export:data',
    'manage:users',
    'manage:system',
    'access:admin_panel',
    'access:it_panel',
    'access:marketing_panel',
    'upload:files',
    'comment:cases',
    'like:cases',
  ],
};

// Role display configuration
export const WA_ROLE_CONFIG: Record<WaRole, {
  label: string;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
}> = {
  VIEWER: {
    label: 'Viewer',
    description: 'Can view case studies and library',
    color: 'text-gray-600',
    bgColor: 'bg-gray-50 dark:bg-gray-900/20',
    borderColor: 'border-gray-200 dark:border-gray-700',
  },
  CONTRIBUTOR: {
    label: 'Contributor',
    description: 'Can create and manage own case studies',
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    borderColor: 'border-green-200 dark:border-green-700',
  },
  MARKETING: {
    label: 'Marketing',
    description: 'Can view analytics and export data',
    color: 'text-pink-600 dark:text-pink-400',
    bgColor: 'bg-pink-50 dark:bg-pink-900/20',
    borderColor: 'border-pink-200 dark:border-pink-700',
  },
  IT_DEPARTMENT: {
    label: 'IT Department',
    description: 'Can manage system settings',
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    borderColor: 'border-orange-200 dark:border-orange-700',
  },
  APPROVER: {
    label: 'Approver',
    description: 'Can approve or reject case studies',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-700',
  },
  ADMIN: {
    label: 'Admin',
    description: 'Full access to all features',
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    borderColor: 'border-purple-200 dark:border-purple-700',
  },
};

/**
 * Check if a role has a specific permission
 */
export function waHasPermission(role: WaRole | string | null | undefined, permission: WaPermission): boolean {
  if (!role) return false;
  const permissions = ROLE_PERMISSIONS[role as WaRole];
  if (!permissions) return false;
  return permissions.includes(permission);
}

/**
 * Check if a role has all of the specified permissions
 */
export function waHasAllPermissions(role: WaRole | string | null | undefined, permissions: WaPermission[]): boolean {
  if (!role) return false;
  return permissions.every(permission => waHasPermission(role, permission));
}

/**
 * Check if a role has any of the specified permissions
 */
export function waHasAnyPermission(role: WaRole | string | null | undefined, permissions: WaPermission[]): boolean {
  if (!role) return false;
  return permissions.some(permission => waHasPermission(role, permission));
}

/**
 * Get all permissions for a role
 */
export function waGetRolePermissions(role: WaRole | string | null | undefined): WaPermission[] {
  if (!role) return [];
  return ROLE_PERMISSIONS[role as WaRole] || [];
}

/**
 * Check if roleA is higher or equal in hierarchy than roleB
 */
export function waIsRoleAtLeast(roleA: WaRole | string | null | undefined, roleB: WaRole): boolean {
  if (!roleA) return false;
  const hierarchyA = ROLE_HIERARCHY[roleA as WaRole];
  const hierarchyB = ROLE_HIERARCHY[roleB];
  if (hierarchyA === undefined || hierarchyB === undefined) return false;
  return hierarchyA >= hierarchyB;
}

/**
 * Check if user can perform action on a case study
 */
export function waCanEditCase(
  userRole: WaRole | string | null | undefined,
  userId: string | null | undefined,
  caseContributorId: string
): boolean {
  if (!userRole || !userId) return false;

  // Admin can edit all
  if (waHasPermission(userRole, 'edit:all_cases')) return true;

  // Others can only edit their own
  if (waHasPermission(userRole, 'edit:own_cases') && userId === caseContributorId) return true;

  return false;
}

/**
 * Check if user can delete a case study
 */
export function waCanDeleteCase(
  userRole: WaRole | string | null | undefined,
  userId: string | null | undefined,
  caseContributorId: string
): boolean {
  if (!userRole || !userId) return false;

  // Admin can delete all
  if (waHasPermission(userRole, 'delete:all_cases')) return true;

  // Others can only delete their own
  if (waHasPermission(userRole, 'delete:own_cases') && userId === caseContributorId) return true;

  return false;
}

/**
 * Check if user can approve/reject cases
 */
export function waCanApproveCases(role: WaRole | string | null | undefined): boolean {
  return waHasPermission(role, 'approve:cases');
}

/**
 * Check if user can access admin panel
 */
export function waCanAccessAdminPanel(role: WaRole | string | null | undefined): boolean {
  return waHasPermission(role, 'access:admin_panel');
}

/**
 * Check if user can manage users
 */
export function waCanManageUsers(role: WaRole | string | null | undefined): boolean {
  return waHasPermission(role, 'manage:users');
}

/**
 * Get navigation items visible to a role
 */
export function waGetVisibleNavItems(role: WaRole | string | null | undefined): string[] {
  const items: string[] = [];

  if (waHasPermission(role, 'view:cases')) items.push('dashboard');
  if (waHasPermission(role, 'view:library')) items.push('library');
  if (waHasPermission(role, 'view:leaderboard')) items.push('leaderboard');
  if (waHasPermission(role, 'view:analytics')) items.push('analytics');
  if (waHasPermission(role, 'approve:cases')) items.push('approvals');
  if (waHasPermission(role, 'access:admin_panel')) items.push('admin');
  if (waHasPermission(role, 'access:it_panel')) items.push('it-settings');
  if (waHasPermission(role, 'access:marketing_panel')) items.push('marketing');

  return items;
}
