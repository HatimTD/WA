import { NextRequest, NextResponse } from 'next/server';
import { waUpdateUserSubsidiaries } from '@/lib/actions/waUserSubsidiaryActions';

/**
 * API endpoint to update user's subsidiary assignments
 *
 * PUT /api/admin/update-user-subsidiaries
 *
 * Body:
 * {
 *   userId: string;
 *   subsidiaryIds: string[];  // Array of subsidiary IDs
 * }
 *
 * Admin only - requires ADMIN role
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, subsidiaryIds } = body;

    // Validate inputs
    if (!userId || typeof userId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    if (!Array.isArray(subsidiaryIds)) {
      return NextResponse.json(
        { success: false, error: 'Subsidiary IDs must be an array' },
        { status: 400 }
      );
    }

    // Call server action
    const result = await waUpdateUserSubsidiaries(userId, subsidiaryIds);

    if (!result.success) {
      const status = result.error?.includes('Unauthorized')
        ? 401
        : result.error?.includes('Forbidden')
        ? 403
        : result.error?.includes('not found')
        ? 404
        : 400;

      return NextResponse.json(result, { status });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('[API] Update user subsidiaries error:', error);

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
