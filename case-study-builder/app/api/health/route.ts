import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return Response.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  } catch {
    return Response.json(
      { status: 'error', timestamp: new Date().toISOString() },
      { status: 503 }
    );
  }
}
