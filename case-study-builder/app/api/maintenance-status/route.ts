import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function GET() {
  try {
    const session = await auth();

    // Check maintenance mode
    const maintenanceConfig = await prisma.systemConfig.findUnique({
      where: { key: 'maintenance_mode' },
    });

    const isMaintenanceMode = maintenanceConfig?.value === 'true';

    // Check if user is admin
    let isAdmin = false;
    if (session?.user?.id) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true },
      });
      isAdmin = user?.role === 'ADMIN';
    }

    return NextResponse.json({
      maintenanceMode: isMaintenanceMode,
      isAdmin,
    });
  } catch (error) {
    console.error('[Maintenance Status] Error:', error);
    return NextResponse.json(
      { error: 'Failed to check maintenance status' },
      { status: 500 }
    );
  }
}
