'use server';

/**
 * User Subsidiary Management Actions
 *
 * Server actions for managing user-subsidiary assignments.
 * Supports multi-subsidiary assignment (mirrors multi-role pattern).
 *
 * Features:
 * - Assign multiple subsidiaries to users
 * - Auto-compute regions from subsidiaries
 * - Track assignment source (NETSUITE vs MANUAL)
 * - Admin-only operations
 *
 * @module waUserSubsidiaryActions
 * @author WA Development Team
 * @version 1.0.0
 * @since 2026-02-02
 */

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

/**
 * Update user's subsidiary assignments
 *
 * Replaces all existing manual subsidiary assignments with new ones.
 * NetSuite-sourced assignments are preserved.
 *
 * @param userId - User ID to update
 * @param subsidiaryIds - Array of subsidiary IDs to assign
 * @returns Success status and updated subsidiary list
 */
export async function waUpdateUserSubsidiaries(
  userId: string,
  subsidiaryIds: string[]
): Promise<{
  success: boolean;
  error?: string;
  subsidiaries?: Array<{ id: string; name: string; region: string }>;
}> {
  try {
    const session = await auth();

    // Check authentication
    if (!session?.user?.id) {
      console.log('[waUpdateUserSubsidiaries] No session - Unauthorized');
      return { success: false, error: 'Unauthorized' };
    }

    // Check if user is ADMIN (supports both single role and multi-role)
    const adminUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        role: true,
        userRoles: { select: { role: true } },
      },
    });

    // Check primary role OR any role in userRoles array
    const hasAdminRole =
      adminUser?.role === 'ADMIN' ||
      adminUser?.userRoles?.some((ur) => ur.role === 'ADMIN');

    if (!adminUser || !hasAdminRole) {
      console.log('[waUpdateUserSubsidiaries] Not ADMIN:', {
        userId: session.user.id,
        role: adminUser?.role,
        userRoles: adminUser?.userRoles?.map((ur) => ur.role),
      });
      return { success: false, error: 'Forbidden - ADMIN role required' };
    }

    console.log('[waUpdateUserSubsidiaries] Auth passed:', {
      adminUserId: session.user.id,
      targetUserId: userId,
      subsidiaryIds,
    });

    // Validate inputs
    if (!userId || typeof userId !== 'string') {
      return { success: false, error: 'User ID is required' };
    }

    if (!Array.isArray(subsidiaryIds)) {
      return { success: false, error: 'Subsidiary IDs must be an array' };
    }

    // Allow empty array (removes all manual assignments but keeps NetSuite ones)
    if (subsidiaryIds.length === 0) {
      // Delete only MANUAL assignments
      await prisma.waUserSubsidiary.deleteMany({
        where: {
          userId,
          source: 'MANUAL',
        },
      });

      // Get remaining subsidiaries (NetSuite-sourced)
      const remainingSubsidiaries = await waGetUserSubsidiaries(userId);
      return {
        success: true,
        subsidiaries: remainingSubsidiaries.subsidiaries || [],
      };
    }

    // Validate all subsidiary IDs exist and are active
    const subsidiaries = await prisma.waSubsidiary.findMany({
      where: {
        id: { in: subsidiaryIds },
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        region: true,
      },
    });

    if (subsidiaries.length !== subsidiaryIds.length) {
      return {
        success: false,
        error: 'One or more subsidiaries not found or inactive',
      };
    }

    // Update in a transaction
    console.log('[waUpdateUserSubsidiaries] Starting transaction...');
    await prisma.$transaction(async (tx) => {
      // Delete only MANUAL assignments (keep NetSuite-sourced)
      const deleted = await tx.waUserSubsidiary.deleteMany({
        where: {
          userId,
          source: 'MANUAL',
        },
      });
      console.log('[waUpdateUserSubsidiaries] Deleted MANUAL assignments:', deleted.count);

      // Create new MANUAL assignments
      const created = await tx.waUserSubsidiary.createMany({
        data: subsidiaryIds.map((subsidiaryId) => ({
          userId,
          subsidiaryId,
          source: 'MANUAL',
          assignedBy: session.user!.id,
        })),
      });
      console.log('[waUpdateUserSubsidiaries] Created MANUAL assignments:', created.count);
    });
    console.log('[waUpdateUserSubsidiaries] Transaction completed successfully');

    // Fetch ALL subsidiaries (MANUAL + NETSUITE) to return complete list
    const allUserSubsidiaries = await prisma.waUserSubsidiary.findMany({
      where: { userId },
      include: {
        subsidiary: {
          select: {
            id: true,
            name: true,
            region: true,
          },
        },
      },
      orderBy: {
        source: 'asc', // MANUAL first, then NETSUITE
      },
    });

    const allSubsidiaries = allUserSubsidiaries.map((us) => ({
      id: us.subsidiary.id,
      name: us.subsidiary.name,
      region: us.subsidiary.region,
      source: us.source, // CRITICAL: Include source for filtering MANUAL vs NETSUITE
    }));

    return {
      success: true,
      subsidiaries: allSubsidiaries,
    };
  } catch (error) {
    console.error('[waUpdateUserSubsidiaries] Error:', error);

    // Handle user not found
    if ((error as any)?.code === 'P2025') {
      return { success: false, error: 'User not found' };
    }

    return { success: false, error: 'Failed to update user subsidiaries' };
  }
}

/**
 * Get all subsidiaries assigned to a user
 *
 * Returns both MANUAL and NETSUITE-sourced assignments.
 *
 * @param userId - User ID
 * @returns List of subsidiaries with regions
 */
export async function waGetUserSubsidiaries(userId: string): Promise<{
  success: boolean;
  error?: string;
  subsidiaries?: Array<{
    id: string;
    name: string;
    region: string;
    source: string;
    assignedAt: Date;
  }>;
}> {
  try {
    if (!userId || typeof userId !== 'string') {
      return { success: false, error: 'User ID is required' };
    }

    const userSubsidiaries = await prisma.waUserSubsidiary.findMany({
      where: { userId },
      include: {
        subsidiary: {
          select: {
            id: true,
            name: true,
            region: true,
          },
        },
      },
      orderBy: [
        { source: 'asc' }, // MANUAL first, then NETSUITE
        { assignedAt: 'desc' },
      ],
    });

    const subsidiaries = userSubsidiaries.map((us) => ({
      id: us.subsidiary.id,
      name: us.subsidiary.name,
      region: us.subsidiary.region,
      source: us.source,
      assignedAt: us.assignedAt,
    }));

    return {
      success: true,
      subsidiaries,
    };
  } catch (error) {
    console.error('[waGetUserSubsidiaries] Error:', error);
    return { success: false, error: 'Failed to fetch user subsidiaries' };
  }
}

/**
 * Get unique regions from user's subsidiaries
 *
 * Computes regions from all assigned subsidiaries (MANUAL + NETSUITE).
 * Multi-subsidiary = multi-region automatically.
 *
 * @param userId - User ID
 * @returns List of unique regions
 */
export async function waGetUserRegions(userId: string): Promise<{
  success: boolean;
  error?: string;
  regions?: string[];
}> {
  try {
    if (!userId || typeof userId !== 'string') {
      return { success: false, error: 'User ID is required' };
    }

    const result = await waGetUserSubsidiaries(userId);

    if (!result.success || !result.subsidiaries) {
      return { success: false, error: result.error };
    }

    // Extract unique regions
    const regions = [...new Set(result.subsidiaries.map((s) => s.region))];

    return {
      success: true,
      regions,
    };
  } catch (error) {
    console.error('[waGetUserRegions] Error:', error);
    return { success: false, error: 'Failed to fetch user regions' };
  }
}

/**
 * Get all active subsidiaries grouped by region
 *
 * Used for admin dropdown selection.
 * Returns subsidiaries organized by region for easy selection.
 *
 * @returns Subsidiaries grouped by region
 */
export async function waGetAllSubsidiaries(): Promise<{
  success: boolean;
  error?: string;
  subsidiaries?: Array<{
    id: string;
    name: string;
    region: string;
    integrationId: string;
  }>;
  byRegion?: Record<
    string,
    Array<{
      id: string;
      name: string;
      integrationId: string;
    }>
  >;
}> {
  try {
    const subsidiaries = await prisma.waSubsidiary.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        region: true,
        integrationId: true,
      },
      orderBy: [{ region: 'asc' }, { name: 'asc' }],
    });

    // Group by region
    const byRegion: Record<
      string,
      Array<{
        id: string;
        name: string;
        integrationId: string;
      }>
    > = {};

    subsidiaries.forEach((subsidiary) => {
      if (!byRegion[subsidiary.region]) {
        byRegion[subsidiary.region] = [];
      }
      byRegion[subsidiary.region].push({
        id: subsidiary.id,
        name: subsidiary.name,
        integrationId: subsidiary.integrationId,
      });
    });

    return {
      success: true,
      subsidiaries,
      byRegion,
    };
  } catch (error) {
    console.error('[waGetAllSubsidiaries] Error:', error);
    return { success: false, error: 'Failed to fetch subsidiaries' };
  }
}

/**
 * Auto-assign subsidiary from NetSuite employee data
 *
 * Called during login JWT callback to auto-populate user's subsidiary
 * from NetSuite employee data. Only creates assignment if doesn't exist.
 *
 * @param userId - User ID
 * @param netsuiteEmployeeId - NetSuite employee internal ID
 * @returns Success status
 */
export async function waAutoAssignSubsidiaryFromNetSuite(
  userId: string,
  netsuiteEmployeeId: string
): Promise<{
  success: boolean;
  error?: string;
  subsidiary?: { id: string; name: string; region: string };
}> {
  try {
    if (!userId || !netsuiteEmployeeId) {
      return { success: false, error: 'User ID and NetSuite employee ID required' };
    }

    // Get NetSuite employee data
    const nsEmployee = await prisma.waNetsuiteEmployee.findUnique({
      where: { netsuiteInternalId: netsuiteEmployeeId },
      select: {
        subsidiarynohierarchy: true,
        subsidiarynohierarchyname: true,
      },
    });

    if (!nsEmployee || !nsEmployee.subsidiarynohierarchy) {
      return { success: false, error: 'NetSuite employee has no subsidiary data' };
    }

    // Find matching WaSubsidiary by integrationId
    const subsidiary = await prisma.waSubsidiary.findUnique({
      where: {
        integrationId: nsEmployee.subsidiarynohierarchy,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        region: true,
      },
    });

    if (!subsidiary) {
      return {
        success: false,
        error: `Subsidiary not found for integration ID: ${nsEmployee.subsidiarynohierarchy}`,
      };
    }

    // Check if assignment already exists (from any source)
    const existingAssignment = await prisma.waUserSubsidiary.findUnique({
      where: {
        userId_subsidiaryId: {
          userId,
          subsidiaryId: subsidiary.id,
        },
      },
    });

    if (existingAssignment) {
      // Already assigned (either MANUAL or NETSUITE source)
      return {
        success: true,
        subsidiary,
      };
    }

    // Create new NETSUITE-sourced assignment
    await prisma.waUserSubsidiary.create({
      data: {
        userId,
        subsidiaryId: subsidiary.id,
        source: 'NETSUITE',
        assignedBy: 'SYSTEM', // System-assigned from NetSuite
      },
    });

    return {
      success: true,
      subsidiary,
    };
  } catch (error) {
    console.error('[waAutoAssignSubsidiaryFromNetSuite] Error:', error);
    return { success: false, error: 'Failed to auto-assign subsidiary' };
  }
}
