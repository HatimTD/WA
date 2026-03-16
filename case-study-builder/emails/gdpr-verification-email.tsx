/**
 * GDPR Deletion Request Verification Email
 *
 * WA Policy Section 7.5 - GDPR Compliance
 * Sent to users when they request deletion of their data.
 */

import {
  Button,
  Heading,
  Link,
  Text,
} from '@react-email/components'
import * as React from 'react'
import { BaseLayout } from './base-layout'

interface GdprVerificationEmailProps {
  userName: string
  userEmail: string
  requestId: string
  verificationToken: string
  verificationUrl: string
  requestDate: string
}

export const GdprVerificationEmail = ({
  userName,
  userEmail,
  requestId,
  verificationUrl,
  requestDate,
}: GdprVerificationEmailProps) => (
  <BaseLayout preview="Verify your data deletion request">
    <Heading style={heading}>Data Deletion Request Verification</Heading>

    <Text style={paragraph}>Hello {userName || 'User'},</Text>

    <Text style={paragraph}>
      We received a request to delete your personal data from the Case Study Builder
      system. This action is in accordance with GDPR Article 17 (Right to Erasure).
    </Text>

    <Text style={paragraph}>
      <strong>Request Details:</strong>
    </Text>

    <Text style={detailsText}>
      Email: {userEmail}
      <br />
      Request ID: {requestId.slice(0, 8)}...
      <br />
      Date: {requestDate}
    </Text>

    <Text style={warningText}>
      <strong>Important:</strong> This action is permanent and cannot be undone.
      Once verified, the following will be deleted or anonymized:
    </Text>

    <ul style={list}>
      <li>Your personal profile information</li>
      <li>Draft and rejected case studies</li>
      <li>Comments and notifications</li>
      <li>Saved cases and preferences</li>
    </ul>

    <Text style={paragraph}>
      Published case studies will be anonymized (not deleted) to preserve business records.
    </Text>

    <Button style={button} href={verificationUrl}>
      Verify Deletion Request
    </Button>

    <Text style={paragraph}>
      If you did not request this action, please ignore this email or contact
      support immediately. This verification link expires in 24 hours.
    </Text>

    <Text style={footnote}>
      This request complies with GDPR Article 17 and WA Policy Section 7.5.
      <br />
      <Link href="mailto:privacy@weldingalloys.com" style={link}>
        Contact Privacy Team
      </Link>
    </Text>
  </BaseLayout>
)

const heading = {
  color: '#1a1a1a',
  fontSize: '24px',
  fontWeight: 'bold' as const,
  marginBottom: '24px',
}

const paragraph = {
  color: '#3c4043',
  fontSize: '14px',
  lineHeight: '24px',
  marginBottom: '16px',
}

const detailsText = {
  backgroundColor: '#f8f9fa',
  padding: '16px',
  borderRadius: '8px',
  color: '#3c4043',
  fontSize: '14px',
  lineHeight: '24px',
  marginBottom: '16px',
}

const warningText = {
  backgroundColor: '#fff3cd',
  border: '1px solid #ffc107',
  padding: '16px',
  borderRadius: '8px',
  color: '#856404',
  fontSize: '14px',
  lineHeight: '24px',
  marginBottom: '16px',
}

const list = {
  color: '#3c4043',
  fontSize: '14px',
  lineHeight: '24px',
  marginBottom: '16px',
  paddingLeft: '20px',
}

const button = {
  backgroundColor: '#dc3545',
  borderRadius: '8px',
  color: '#ffffff',
  display: 'block',
  fontSize: '14px',
  fontWeight: 'bold' as const,
  padding: '12px 24px',
  textAlign: 'center' as const,
  textDecoration: 'none',
  marginBottom: '24px',
}

const footnote = {
  color: '#6c757d',
  fontSize: '12px',
  lineHeight: '20px',
  marginTop: '24px',
  borderTop: '1px solid #e9ecef',
  paddingTop: '16px',
}

const link = {
  color: '#007bff',
  textDecoration: 'underline',
}

export default GdprVerificationEmail
