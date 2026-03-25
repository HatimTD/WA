import { NextResponse } from 'next/server';
import { auth } from '@/auth';

/**
 * Admin-triggered NetSuite resync
 * POST /api/admin/netsuite/resync
 *
 * Clears all Redis caches then runs full sync from NetSuite RESTlet.
 * Requires ADMIN role.
 */
export async function POST() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { prisma } = await import('@/lib/prisma');
    const adminUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!adminUser || adminUser.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden - ADMIN role required' }, { status: 403 });
    }

    // Step 1: Clear all caches so sync fetches fresh from RESTlet
    const { netsuiteClient } = await import('@/lib/integrations/netsuite');
    await netsuiteClient.clearCache();
    console.log('[Admin Resync] Cleared all NetSuite caches');

    // Step 2: Run employee + subsidiary sync (the critical ones)
    const { waSyncNetSuiteEmployees, waSyncNetSuiteSubsidiaries } = await import('@/lib/integrations/netsuite-sync');

    const [employeeResult, subsidiaryResult] = await Promise.all([
      waSyncNetSuiteEmployees(),
      waSyncNetSuiteSubsidiaries(),
    ]);

    console.log('[Admin Resync] Employee sync:', employeeResult);
    console.log('[Admin Resync] Subsidiary sync:', subsidiaryResult);

    return NextResponse.json({
      success: true,
      employees: employeeResult,
      subsidiaries: subsidiaryResult,
    });
  } catch (error) {
    console.error('[Admin Resync] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Resync failed',
    }, { status: 500 });
  }
}
