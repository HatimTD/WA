import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Verify the request is from Vercel Cron or authenticated via CRON_SECRET.
 * Matches the pattern used by /api/cron/netsuite-sync.
 */
function verifyCronRequest(req: NextRequest): boolean {
  if (process.env.NODE_ENV === 'development') return true;
  if (req.headers.get('x-vercel-cron') === 'true') return true;
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) return true;
  return false;
}

/**
 * GET /api/cron/trigger-monthly-report
 *
 * Triggered on the 1st of each month by Vercel Cron. Pings the WA
 * maintenance service to generate and email the monthly health report.
 * Env-driven, returns {skipped: true} if the service is not configured.
 */
export async function GET(req: NextRequest) {
  if (!verifyCronRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const baseUrl = process.env.MAINTENANCE_API_BASE_URL;
  const apiKey = process.env.MAINTENANCE_API_KEY;

  if (!baseUrl || !apiKey) {
    return NextResponse.json({
      skipped: true,
      reason: 'MAINTENANCE_API_BASE_URL or MAINTENANCE_API_KEY not set',
    });
  }

  try {
    const res = await fetch(`${baseUrl}/api/report/monthly/send`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });
    return NextResponse.json({
      triggered: true,
      reportStatus: res.status,
      ok: res.ok,
    });
  } catch (e) {
    return NextResponse.json(
      { triggered: false, error: (e as Error).message },
      { status: 500 }
    );
  }
}
