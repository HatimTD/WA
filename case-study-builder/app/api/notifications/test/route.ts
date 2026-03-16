import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userId } = await req.json()

    // Use the current user if no userId specified
    const targetUserId = userId || session.user.id

    // Create a test notification
    const notification = await prisma.waNotification.create({
      data: {
        userId: targetUserId,
        type: 'SYSTEM_ANNOUNCEMENT',
        title: 'Test Notification',
        message: 'This is a test notification sent from the System Settings panel.',
        read: false,
      },
    })

    return NextResponse.json({
      success: true,
      notification,
      message: 'Test notification created successfully',
    })
  } catch (error: any) {
    console.error('Test notification error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create test notification' },
      { status: 500 }
    )
  }
}
