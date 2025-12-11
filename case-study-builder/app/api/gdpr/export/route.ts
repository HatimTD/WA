/**
 * GDPR Data Export API
 *
 * Handles data portability requests per GDPR Article 20.
 * Implements WA Policy Section 7.5.2.
 *
 * GET - Export all user data in JSON format
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { exportUserData } from '@/lib/gdpr-compliance';

/**
 * GET /api/gdpr/export
 * Exports all user data in a portable format
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const data = await exportUserData(session.user.id);

    // Return as downloadable JSON
    const jsonData = JSON.stringify(data, null, 2);
    const filename = `user-data-export-${session.user.id}-${new Date().toISOString().split('T')[0]}.json`;

    return new NextResponse(jsonData, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('[GDPR Export API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to export user data' },
      { status: 500 }
    );
  }
}
