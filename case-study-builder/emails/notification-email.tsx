import {
  Button,
  Heading,
  Hr,
  Link,
  Section,
  Text,
} from '@react-email/components'
import * as React from 'react'
import { BaseLayout } from './base-layout'

interface NotificationEmailProps {
  preview: string
  logoUrl?: string
  heading: string
  content: string
  buttonText?: string
  buttonUrl?: string
  variables?: Record<string, string>
}

export const NotificationEmail = ({
  preview,
  logoUrl,
  heading,
  content,
  buttonText,
  buttonUrl,
  variables = {},
}: NotificationEmailProps) => {
  // Replace variables in content
  let processedContent = content
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g')
    processedContent = processedContent.replace(regex, value)
  })

  // Split content into paragraphs
  const paragraphs = processedContent.split('\n\n').filter(p => p.trim())

  return (
    <BaseLayout preview={preview} logoUrl={logoUrl}>
      <Heading style={h1}>{heading}</Heading>

      {paragraphs.map((paragraph, index) => (
        <Text key={index} style={text}>
          {paragraph}
        </Text>
      ))}

      {buttonText && buttonUrl && (
        <Section style={buttonContainer}>
          <Button style={button} href={buttonUrl}>
            {buttonText}
          </Button>
        </Section>
      )}

      <Hr style={hr} />

      <Text style={text}>
        If you have any questions or need assistance, please contact your system administrator.
      </Text>
    </BaseLayout>
  )
}

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0',
}

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  marginBottom: '16px',
}

const buttonContainer = {
  margin: '32px 0',
}

const button = {
  backgroundColor: '#0070f3',
  borderRadius: '5px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '12px 20px',
}

const hr = {
  borderColor: '#e6ebf1',
  margin: '32px 0',
}

export default NotificationEmail
