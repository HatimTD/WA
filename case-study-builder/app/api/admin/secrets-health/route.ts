/**
 * Admin Secrets Health API
 *
 * Provides secrets health status and rotation tracking.
 * Implements WA Policy Section 6.2.
 *
 * GET - Get secrets health status
 * POST - Generate security report or mark rotation
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import {
  validateAllSecrets,
  getSecretsByCategory,
  getSecretsNeedingRotation,
  generateSecurityReport,
  markSecretRotated,
} from '@/lib/secrets-manager';
import prisma from '@/lib/prisma';

/**
 * GET /api/admin/secrets-health
 * Gets the health status of all secrets
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

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const validation = validateAllSecrets();
    const byCategory = getSecretsByCategory();
    const needsRotation = getSecretsNeedingRotation();

    return NextResponse.json({
      summary: {
        healthy: validation.healthy,
        warnings: validation.warnings,
        errors: validation.errors,
        missing: validation.missing,
        total: validation.secrets.length,
      },
      byCategory,
      needsRotation: needsRotation.map((s) => ({
        name: s.name,
        category: s.category,
        daysSinceRotation: s.daysSinceRotation,
      })),
      // Don't expose detailed secret info in this endpoint
    });
  } catch (error) {
    console.error('[Secrets Health API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to check secrets health' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/secrets-health
 * Generate report or mark rotation
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { action, secretName } = body;

    if (action === 'report') {
      const report = generateSecurityReport();
      return NextResponse.json({
        action: 'report',
        report,
      });
    }

    if (action === 'markRotated' && secretName) {
      markSecretRotated(secretName);
      return NextResponse.json({
        action: 'markRotated',
        secretName,
        rotatedAt: new Date(),
      });
    }

    return NextResponse.json(
      { error: 'Invalid action. Use "report" or "markRotated"' },
      { status: 400 }
    );
  } catch (error) {
    console.error('[Secrets Health API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
