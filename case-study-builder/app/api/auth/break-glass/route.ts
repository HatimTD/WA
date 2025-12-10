/**
 * Break-Glass Authentication API
 *
 * Provides emergency admin access per WA Policy Section 3.1.
 * This endpoint should only be used when normal authentication is unavailable.
 *
 * @route POST /api/auth/break-glass
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  waValidateBreakGlassAccess,
  waGetBreakGlassConfig,
  waTerminateBreakGlassSession,
  type BreakGlassSession,
} from '@/lib/break-glass-admin';

const BREAK_GLASS_COOKIE = 'break-glass-session';

/**
 * POST /api/auth/break-glass
 *
 * Authenticate using break-glass emergency access
 */
export async function POST(request: NextRequest) {
  try {
    const config = waGetBreakGlassConfig();

    // Check if break-glass is enabled
    if (!config.enabled) {
      return NextResponse.json(
        { error: 'Break-glass access is not enabled' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { key } = body;

    if (!key) {
      return NextResponse.json(
        { error: 'Break-glass key is required' },
        { status: 400 }
      );
    }

    // Get client information
    const ipAddress = request.headers.get('x-forwarded-for') ||
                      request.headers.get('x-real-ip') ||
                      'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Validate break-glass access
    const result = await waValidateBreakGlassAccess(key, ipAddress, userAgent);

    if (!result.valid || !result.session) {
      return NextResponse.json(
        { error: result.error || 'Authentication failed' },
        { status: 401 }
      );
    }

    // Create response with session cookie
    const response = NextResponse.json({
      success: true,
      message: 'Break-glass access granted',
      session: {
        email: result.session.email,
        expiresAt: result.session.expiresAt,
        remainingMinutes: config.sessionTimeoutMinutes,
      },
    });

    // Set secure session cookie
    const cookieStore = await cookies();
    cookieStore.set(BREAK_GLASS_COOKIE, JSON.stringify(result.session), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: config.sessionTimeoutMinutes * 60,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('[Break-Glass API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/auth/break-glass
 *
 * Terminate break-glass session
 */
export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(BREAK_GLASS_COOKIE);

    if (sessionCookie) {
      try {
        const session: BreakGlassSession = JSON.parse(sessionCookie.value);
        await waTerminateBreakGlassSession(session, 'user_logout');
      } catch {
        // Session parsing failed, just clear the cookie
      }
    }

    // Clear the cookie
    cookieStore.delete(BREAK_GLASS_COOKIE);

    return NextResponse.json({
      success: true,
      message: 'Break-glass session terminated',
    });
  } catch (error) {
    console.error('[Break-Glass API] Logout error:', error);
    return NextResponse.json(
      { error: 'Failed to terminate session' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/auth/break-glass
 *
 * Check break-glass session status
 */
export async function GET() {
  try {
    const config = waGetBreakGlassConfig();

    // Check if break-glass is enabled (don't reveal config details)
    if (!config.enabled) {
      return NextResponse.json({
        enabled: false,
        authenticated: false,
      });
    }

    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(BREAK_GLASS_COOKIE);

    if (!sessionCookie) {
      return NextResponse.json({
        enabled: true,
        authenticated: false,
      });
    }

    try {
      const session: BreakGlassSession = JSON.parse(sessionCookie.value);

      // Check if session is expired
      if (Date.now() > session.expiresAt) {
        await waTerminateBreakGlassSession(session, 'session_expired');
        cookieStore.delete(BREAK_GLASS_COOKIE);

        return NextResponse.json({
          enabled: true,
          authenticated: false,
          expired: true,
        });
      }

      return NextResponse.json({
        enabled: true,
        authenticated: true,
        session: {
          email: session.email,
          expiresAt: session.expiresAt,
          remainingMinutes: Math.ceil((session.expiresAt - Date.now()) / 60000),
        },
      });
    } catch {
      return NextResponse.json({
        enabled: true,
        authenticated: false,
      });
    }
  } catch (error) {
    console.error('[Break-Glass API] Status check error:', error);
    return NextResponse.json(
      { error: 'Failed to check session status' },
      { status: 500 }
    );
  }
}
