import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  try {
    // Temporarily disabled for testing - REMEMBER TO RE-ENABLE BEFORE PRODUCTION
    // const session = await auth()
    // if (!session?.user || session.user.role !== 'ADMIN') {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    const { to, html, logoUrl, templateType, subject } = await req.json()

    if (!to) {
      return NextResponse.json({ error: 'Email address required' }, { status: 400 })
    }

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: 'RESEND_API_KEY not configured' },
        { status: 500 }
      )
    }

    // Sample variables for test email
    const sampleVariables = {
      userName: 'Test User',
      caseTitle: 'Sample Case Study Title',
      caseType: 'APPLICATION',
      rejectionReason: 'This is a sample rejection reason',
      commentAuthor: 'Jane Doe',
      commentText: 'This is a sample comment on your case study.',
      badgeName: 'EXPLORER',
      currentValue: '850',
      targetValue: '1000',
      progress: '85%',
      dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3010'}/dashboard`,
    }

    // Replace variables in HTML
    let processedHtml = html
    Object.entries(sampleVariables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g')
      processedHtml = processedHtml.replace(regex, value)
    })

    // Wrap in base layout if not already wrapped
    if (!processedHtml.includes('<!DOCTYPE html>')) {
      processedHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Test Email</title>
          </head>
          <body style="margin: 0; padding: 0; background-color: #f6f9fc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Ubuntu, sans-serif;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px;">
              ${logoUrl ? `<div style="text-align: center; padding: 32px;"><img src="${logoUrl}" alt="Logo" style="max-width: 200px;"></div>` : ''}
              <div style="padding: 0 48px;">
                ${processedHtml}
              </div>
              <div style="padding: 32px 48px; text-align: center; color: #8898aa; font-size: 12px; line-height: 16px;">
                <p>Case Study Builder - Weld Australia</p>
                <p>This is a test email from the Case Study Builder system.</p>
              </div>
            </div>
          </body>
        </html>
      `
    }

    const data = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Case Study Builder <onboarding@resend.dev>',
      to: [to],
      subject: subject || `Test Email - ${templateType || 'Template Preview'}`,
      html: processedHtml,
    })

    return NextResponse.json({
      success: true,
      messageId: data.id,
      message: `Test email sent successfully to ${to}`,
    })
  } catch (error: any) {
    console.error('Test email error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send test email' },
      { status: 500 }
    )
  }
}
