import { NextRequest, NextResponse } from 'next/server';
import { waGetAllSubsidiaries } from '@/lib/actions/waUserSubsidiaryActions';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

/**
 * API endpoint to get all active subsidiaries
 *
 * GET /api/admin/subsidiaries
 *
 * Returns all active subsidiaries grouped by region.
 * Used for admin dropdown when assigning subsidiaries to users.
 *
 * Admin only - requires ADMIN role
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    // Check authentication
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Note: waGetAllSubsidiaries doesn't enforce ADMIN check internally,
    // so we check here at the API level
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Forbidden - ADMIN role required' },
        { status: 403 }
      );
    }

    // Get all subsidiaries
    const result = await waGetAllSubsidiaries();

    if (!result.success) {
      return NextResponse.json(result, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('[API] Get subsidiaries error:', error);

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
