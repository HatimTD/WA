/**
 * GDPR Deletion Completion Email
 *
 * WA Policy Section 7.5 - GDPR Compliance
 * Sent to users when their data deletion has been completed.
 */

import {
  Heading,
  Link,
  Text,
} from '@react-email/components'
import * as React from 'react'
import { BaseLayout } from './base-layout'

interface GdprCompletionEmailProps {
  userName: string
  userEmail: string
  requestId: string
  completionDate: string
  deletedData: {
    caseStudies: number
    comments: number
    savedCases: number
    notifications: number
  }
  anonymizedData: {
    caseStudies: number
    asApprover: number
  }
}

export const GdprCompletionEmail = ({
  userName,
  userEmail,
  requestId,
  completionDate,
  deletedData,
  anonymizedData,
}: GdprCompletionEmailProps) => (
  <BaseLayout preview="Your data deletion request has been completed">
    <Heading style={heading}>Data Deletion Complete</Heading>

    <Text style={paragraph}>Hello {userName || 'User'},</Text>

    <Text style={successText}>
      Your data deletion request has been successfully processed in accordance
      with GDPR Article 17 (Right to Erasure).
    </Text>

    <Text style={paragraph}>
      <strong>Request Details:</strong>
    </Text>

    <Text style={detailsText}>
      Email: {userEmail}
      <br />
      Request ID: {requestId.slice(0, 8)}...
      <br />
      Completed: {completionDate}
    </Text>

    <Text style={paragraph}>
      <strong>Data Deleted:</strong>
    </Text>

    <Text style={deletedBox}>
      <span style={checkmark}>✓</span> {deletedData.caseStudies} case studies (drafts/rejected)
      <br />
      <span style={checkmark}>✓</span> {deletedData.comments} comments
      <br />
      <span style={checkmark}>✓</span> {deletedData.savedCases} saved cases
      <br />
      <span style={checkmark}>✓</span> {deletedData.notifications} notifications
      <br />
      <span style={checkmark}>✓</span> Profile information cleared
      <br />
      <span style={checkmark}>✓</span> Authentication sessions terminated
    </Text>

    {(anonymizedData.caseStudies > 0 || anonymizedData.asApprover > 0) && (
      <>
        <Text style={paragraph}>
          <strong>Data Anonymized (for business records):</strong>
        </Text>

        <Text style={anonymizedBox}>
          <span style={infoIcon}>ℹ</span> {anonymizedData.caseStudies} published case studies
          <br />
          <span style={infoIcon}>ℹ</span> {anonymizedData.asApprover} cases where you were approver
        </Text>

        <Text style={footnoteText}>
          Note: Published case studies are anonymized rather than deleted to maintain
          business records integrity. Your name has been replaced with an anonymous
          identifier.
        </Text>
      </>
    )}

    <Text style={paragraph}>
      Your account has been deactivated and your email address has been anonymized.
      If you wish to use our services again in the future, you will need to create
      a new account.
    </Text>

    <Text style={footnote}>
      This action was completed in compliance with GDPR Article 17 and WA Policy Section 7.5.
      A record of this deletion has been retained in our audit logs for compliance purposes.
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

const successText = {
  backgroundColor: '#d4edda',
  border: '1px solid #28a745',
  padding: '16px',
  borderRadius: '8px',
  color: '#155724',
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

const deletedBox = {
  backgroundColor: '#f8d7da',
  border: '1px solid #dc3545',
  padding: '16px',
  borderRadius: '8px',
  color: '#721c24',
  fontSize: '14px',
  lineHeight: '28px',
  marginBottom: '16px',
}

const anonymizedBox = {
  backgroundColor: '#cce5ff',
  border: '1px solid #007bff',
  padding: '16px',
  borderRadius: '8px',
  color: '#004085',
  fontSize: '14px',
  lineHeight: '28px',
  marginBottom: '16px',
}

const checkmark = {
  color: '#28a745',
  fontWeight: 'bold' as const,
  marginRight: '8px',
}

const infoIcon = {
  color: '#007bff',
  fontWeight: 'bold' as const,
  marginRight: '8px',
}

const footnoteText = {
  color: '#6c757d',
  fontSize: '12px',
  lineHeight: '20px',
  fontStyle: 'italic',
  marginBottom: '16px',
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

export default GdprCompletionEmail
