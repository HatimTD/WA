/**
 * Tests for waPermissions utility
 */

import {
  WA_ROLES,
  WA_ROLE_CONFIG,
  waHasPermission,
  waHasAllPermissions,
  waHasAnyPermission,
  waGetRolePermissions,
  waIsRoleAtLeast,
  waCanEditCase,
  waCanDeleteCase,
  waCanApproveCases,
  waCanAccessAdminPanel,
  waCanManageUsers,
  waGetVisibleNavItems,
} from '@/lib/waPermissions';

describe('waPermissions', () => {
  describe('WA_ROLES', () => {
    it('should contain all 6 roles', () => {
      expect(WA_ROLES).toHaveLength(6);
      expect(WA_ROLES).toContain('VIEWER');
      expect(WA_ROLES).toContain('CONTRIBUTOR');
      expect(WA_ROLES).toContain('APPROVER');
      expect(WA_ROLES).toContain('ADMIN');
      expect(WA_ROLES).toContain('IT_DEPARTMENT');
      expect(WA_ROLES).toContain('MARKETING');
    });
  });

  describe('WA_ROLE_CONFIG', () => {
    it('should have config for all roles', () => {
      WA_ROLES.forEach((role) => {
        expect(WA_ROLE_CONFIG[role]).toBeDefined();
        expect(WA_ROLE_CONFIG[role].label).toBeTruthy();
        expect(WA_ROLE_CONFIG[role].description).toBeTruthy();
        expect(WA_ROLE_CONFIG[role].color).toBeTruthy();
        expect(WA_ROLE_CONFIG[role].bgColor).toBeTruthy();
        expect(WA_ROLE_CONFIG[role].borderColor).toBeTruthy();
      });
    });
  });

  describe('waHasPermission', () => {
    it('should return false for null/undefined role', () => {
      expect(waHasPermission(null, 'view:cases')).toBe(false);
      expect(waHasPermission(undefined, 'view:cases')).toBe(false);
    });

    it('should return false for invalid role', () => {
      expect(waHasPermission('INVALID_ROLE', 'view:cases')).toBe(false);
    });

    it('VIEWER should only have view permissions', () => {
      expect(waHasPermission('VIEWER', 'view:cases')).toBe(true);
      expect(waHasPermission('VIEWER', 'view:library')).toBe(true);
      expect(waHasPermission('VIEWER', 'view:leaderboard')).toBe(true);
      expect(waHasPermission('VIEWER', 'like:cases')).toBe(true);
      expect(waHasPermission('VIEWER', 'create:cases')).toBe(false);
      expect(waHasPermission('VIEWER', 'edit:own_cases')).toBe(false);
      expect(waHasPermission('VIEWER', 'approve:cases')).toBe(false);
    });

    it('CONTRIBUTOR should have create and edit own permissions', () => {
      expect(waHasPermission('CONTRIBUTOR', 'create:cases')).toBe(true);
      expect(waHasPermission('CONTRIBUTOR', 'edit:own_cases')).toBe(true);
      expect(waHasPermission('CONTRIBUTOR', 'delete:own_cases')).toBe(true);
      expect(waHasPermission('CONTRIBUTOR', 'upload:files')).toBe(true);
      expect(waHasPermission('CONTRIBUTOR', 'comment:cases')).toBe(true);
      expect(waHasPermission('CONTRIBUTOR', 'approve:cases')).toBe(false);
      expect(waHasPermission('CONTRIBUTOR', 'manage:users')).toBe(false);
    });

    it('APPROVER should have approval permissions', () => {
      expect(waHasPermission('APPROVER', 'approve:cases')).toBe(true);
      expect(waHasPermission('APPROVER', 'reject:cases')).toBe(true);
      expect(waHasPermission('APPROVER', 'create:cases')).toBe(true);
      expect(waHasPermission('APPROVER', 'manage:users')).toBe(false);
    });

    it('ADMIN should have all permissions', () => {
      expect(waHasPermission('ADMIN', 'view:cases')).toBe(true);
      expect(waHasPermission('ADMIN', 'create:cases')).toBe(true);
      expect(waHasPermission('ADMIN', 'edit:all_cases')).toBe(true);
      expect(waHasPermission('ADMIN', 'delete:all_cases')).toBe(true);
      expect(waHasPermission('ADMIN', 'approve:cases')).toBe(true);
      expect(waHasPermission('ADMIN', 'publish:cases')).toBe(true);
      expect(waHasPermission('ADMIN', 'manage:users')).toBe(true);
      expect(waHasPermission('ADMIN', 'manage:system')).toBe(true);
      expect(waHasPermission('ADMIN', 'access:admin_panel')).toBe(true);
    });

    it('IT_DEPARTMENT should have system management permissions', () => {
      expect(waHasPermission('IT_DEPARTMENT', 'view:cases')).toBe(true);
      expect(waHasPermission('IT_DEPARTMENT', 'manage:system')).toBe(true);
      expect(waHasPermission('IT_DEPARTMENT', 'access:it_panel')).toBe(true);
      expect(waHasPermission('IT_DEPARTMENT', 'create:cases')).toBe(false);
      expect(waHasPermission('IT_DEPARTMENT', 'manage:users')).toBe(false);
    });

    it('MARKETING should have analytics and export permissions', () => {
      expect(waHasPermission('MARKETING', 'view:cases')).toBe(true);
      expect(waHasPermission('MARKETING', 'view:analytics')).toBe(true);
      expect(waHasPermission('MARKETING', 'export:data')).toBe(true);
      expect(waHasPermission('MARKETING', 'access:marketing_panel')).toBe(true);
      expect(waHasPermission('MARKETING', 'create:cases')).toBe(false);
      expect(waHasPermission('MARKETING', 'approve:cases')).toBe(false);
    });
  });

  describe('waHasAllPermissions', () => {
    it('should return true if role has all permissions', () => {
      expect(waHasAllPermissions('ADMIN', ['view:cases', 'create:cases', 'manage:users'])).toBe(true);
      expect(waHasAllPermissions('CONTRIBUTOR', ['view:cases', 'create:cases'])).toBe(true);
    });

    it('should return false if role is missing any permission', () => {
      expect(waHasAllPermissions('CONTRIBUTOR', ['view:cases', 'manage:users'])).toBe(false);
      expect(waHasAllPermissions('VIEWER', ['view:cases', 'create:cases'])).toBe(false);
    });
  });

  describe('waHasAnyPermission', () => {
    it('should return true if role has any of the permissions', () => {
      expect(waHasAnyPermission('VIEWER', ['view:cases', 'create:cases'])).toBe(true);
      expect(waHasAnyPermission('CONTRIBUTOR', ['approve:cases', 'create:cases'])).toBe(true);
    });

    it('should return false if role has none of the permissions', () => {
      expect(waHasAnyPermission('VIEWER', ['create:cases', 'approve:cases'])).toBe(false);
    });
  });

  describe('waGetRolePermissions', () => {
    it('should return empty array for null/undefined', () => {
      expect(waGetRolePermissions(null)).toEqual([]);
      expect(waGetRolePermissions(undefined)).toEqual([]);
    });

    it('should return permissions array for valid role', () => {
      const viewerPerms = waGetRolePermissions('VIEWER');
      expect(viewerPerms).toContain('view:cases');
      expect(viewerPerms).not.toContain('create:cases');

      const adminPerms = waGetRolePermissions('ADMIN');
      expect(adminPerms).toContain('manage:users');
      expect(adminPerms.length).toBeGreaterThan(viewerPerms.length);
    });
  });

  describe('waIsRoleAtLeast', () => {
    it('should return false for null/undefined role', () => {
      expect(waIsRoleAtLeast(null, 'VIEWER')).toBe(false);
      expect(waIsRoleAtLeast(undefined, 'CONTRIBUTOR')).toBe(false);
    });

    it('should correctly compare role hierarchy', () => {
      expect(waIsRoleAtLeast('ADMIN', 'VIEWER')).toBe(true);
      expect(waIsRoleAtLeast('ADMIN', 'ADMIN')).toBe(true);
      expect(waIsRoleAtLeast('APPROVER', 'CONTRIBUTOR')).toBe(true);
      expect(waIsRoleAtLeast('VIEWER', 'ADMIN')).toBe(false);
      expect(waIsRoleAtLeast('CONTRIBUTOR', 'APPROVER')).toBe(false);
    });
  });

  describe('waCanEditCase', () => {
    it('should return false for null/undefined user', () => {
      expect(waCanEditCase(null, 'user1', 'user2')).toBe(false);
      expect(waCanEditCase('ADMIN', null, 'user2')).toBe(false);
    });

    it('ADMIN should be able to edit any case', () => {
      expect(waCanEditCase('ADMIN', 'admin1', 'contributor1')).toBe(true);
      expect(waCanEditCase('ADMIN', 'admin1', 'admin1')).toBe(true);
    });

    it('CONTRIBUTOR should only edit own cases', () => {
      expect(waCanEditCase('CONTRIBUTOR', 'user1', 'user1')).toBe(true);
      expect(waCanEditCase('CONTRIBUTOR', 'user1', 'user2')).toBe(false);
    });

    it('VIEWER should not be able to edit any case', () => {
      expect(waCanEditCase('VIEWER', 'user1', 'user1')).toBe(false);
    });
  });

  describe('waCanDeleteCase', () => {
    it('ADMIN should be able to delete any case', () => {
      expect(waCanDeleteCase('ADMIN', 'admin1', 'contributor1')).toBe(true);
    });

    it('CONTRIBUTOR should only delete own cases', () => {
      expect(waCanDeleteCase('CONTRIBUTOR', 'user1', 'user1')).toBe(true);
      expect(waCanDeleteCase('CONTRIBUTOR', 'user1', 'user2')).toBe(false);
    });
  });

  describe('waCanApproveCases', () => {
    it('should return true for APPROVER and ADMIN', () => {
      expect(waCanApproveCases('APPROVER')).toBe(true);
      expect(waCanApproveCases('ADMIN')).toBe(true);
    });

    it('should return false for other roles', () => {
      expect(waCanApproveCases('CONTRIBUTOR')).toBe(false);
      expect(waCanApproveCases('VIEWER')).toBe(false);
      expect(waCanApproveCases('IT_DEPARTMENT')).toBe(false);
      expect(waCanApproveCases('MARKETING')).toBe(false);
    });
  });

  describe('waCanAccessAdminPanel', () => {
    it('should return true only for ADMIN', () => {
      expect(waCanAccessAdminPanel('ADMIN')).toBe(true);
      expect(waCanAccessAdminPanel('APPROVER')).toBe(false);
      expect(waCanAccessAdminPanel('CONTRIBUTOR')).toBe(false);
    });
  });

  describe('waCanManageUsers', () => {
    it('should return true only for ADMIN', () => {
      expect(waCanManageUsers('ADMIN')).toBe(true);
      expect(waCanManageUsers('IT_DEPARTMENT')).toBe(false);
      expect(waCanManageUsers('APPROVER')).toBe(false);
    });
  });

  describe('waGetVisibleNavItems', () => {
    it('VIEWER should see limited nav items', () => {
      const items = waGetVisibleNavItems('VIEWER');
      expect(items).toContain('dashboard');
      expect(items).toContain('library');
      expect(items).toContain('leaderboard');
      expect(items).not.toContain('analytics');
      expect(items).not.toContain('admin');
    });

    it('CONTRIBUTOR should see analytics but not admin', () => {
      const items = waGetVisibleNavItems('CONTRIBUTOR');
      expect(items).toContain('dashboard');
      expect(items).toContain('analytics');
      expect(items).not.toContain('admin');
      expect(items).not.toContain('approvals');
    });

    it('ADMIN should see all nav items', () => {
      const items = waGetVisibleNavItems('ADMIN');
      expect(items).toContain('dashboard');
      expect(items).toContain('analytics');
      expect(items).toContain('admin');
      expect(items).toContain('approvals');
      expect(items).toContain('it-settings');
      expect(items).toContain('marketing');
    });

    it('IT_DEPARTMENT should see it-settings', () => {
      const items = waGetVisibleNavItems('IT_DEPARTMENT');
      expect(items).toContain('it-settings');
      expect(items).not.toContain('admin');
      expect(items).not.toContain('approvals');
    });

    it('MARKETING should see marketing panel', () => {
      const items = waGetVisibleNavItems('MARKETING');
      expect(items).toContain('marketing');
      expect(items).toContain('analytics');
      expect(items).not.toContain('admin');
    });
  });
});
