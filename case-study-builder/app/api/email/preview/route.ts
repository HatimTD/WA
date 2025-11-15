import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { render } from '@react-email/render'
import { NotificationEmail } from '@/emails/notification-email'

export async function POST(req: NextRequest) {
  try {
    // Temporarily disabled for testing - REMEMBER TO RE-ENABLE BEFORE PRODUCTION
    // const session = await auth()
    // if (!session?.user || session.user.role !== 'ADMIN') {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    const { html, logoUrl, templateType } = await req.json()

    // Generate preview with sample data
    const sampleVariables = {
      userName: 'John Doe',
      caseTitle: 'Sample Case Study',
      caseType: 'APPLICATION',
      rejectionReason: 'Needs more detail',
      commentAuthor: 'Jane Smith',
      commentText: 'Great work on this case study!',
      badgeName: 'EXPLORER',
      currentValue: '850',
      targetValue: '1000',
      progress: '85%',
    }

    // If using React Email template, render it
    if (html.includes('{{')) {
      // Simple variable replacement for preview
      let previewHtml = html
      Object.entries(sampleVariables).forEach(([key, value]) => {
        const regex = new RegExp(`{{${key}}}`, 'g')
        previewHtml = previewHtml.replace(regex, value)
      })

      return NextResponse.json({ html: previewHtml })
    }

    return NextResponse.json({ html })
  } catch (error) {
    console.error('Email preview error:', error)
    return NextResponse.json(
      { error: 'Failed to generate preview' },
      { status: 500 }
    )
  }
}
