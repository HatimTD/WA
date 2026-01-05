/**
 * GDPR Deletion Request API
 *
 * Handles right-to-be-forgotten requests per GDPR Article 17.
 * Implements WA Policy Section 7.5.1.
 *
 * POST - Create a new deletion request
 * GET - Get status of a deletion request
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import {
  createDeletionRequest,
  getDeletionRequestStatus,
  verifyDeletionRequest,
  processDeletionRequest,
  cancelDeletionRequest,
} from '@/lib/gdpr-compliance';

/**
 * POST /api/gdpr/deletion-request
 * Creates a new GDPR deletion request
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { action, requestId, verificationToken } = body;

    // Handle verification action
    if (action === 'verify' && requestId && verificationToken) {
      const verified = await verifyDeletionRequest(requestId, verificationToken);
      if (!verified) {
        return NextResponse.json(
          { error: 'Invalid or expired verification token' },
          { status: 400 }
        );
      }
      return NextResponse.json({
        success: true,
        message: 'Request verified. An administrator will process your request.',
      });
    }

    // Handle cancellation action
    if (action === 'cancel' && requestId) {
      const cancelled = await cancelDeletionRequest(requestId, session.user.id);
      if (!cancelled) {
        return NextResponse.json(
          { error: 'Unable to cancel request' },
          { status: 400 }
        );
      }
      return NextResponse.json({
        success: true,
        message: 'Deletion request cancelled',
      });
    }

    // Create new deletion request
    const result = await createDeletionRequest(
      session.user.id,
      session.user.email
    );

    return NextResponse.json({
      success: true,
      requestId: result.requestId,
      message:
        'Deletion request created. Please check your email for verification instructions.',
      // In production, DO NOT return the token - send it via email
      ...(process.env.NODE_ENV === 'development' && {
        verificationToken: result.verificationToken,
      }),
    });
  } catch (error) {
    console.error('[GDPR API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process deletion request' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/gdpr/deletion-request?id=xxx
 * Gets the status of a deletion request
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

    const requestId = request.nextUrl.searchParams.get('id');

    if (!requestId) {
      return NextResponse.json(
        { error: 'Request ID is required' },
        { status: 400 }
      );
    }

    const status = await getDeletionRequestStatus(requestId);

    if (!status) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(status);
  } catch (error) {
    console.error('[GDPR API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to get request status' },
      { status: 500 }
    );
  }
}
