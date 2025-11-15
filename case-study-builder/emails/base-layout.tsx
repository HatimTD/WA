import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import * as React from 'react'

interface BaseLayoutProps {
  preview: string
  logoUrl?: string
  children: React.ReactNode
}

export const BaseLayout = ({ preview, logoUrl, children }: BaseLayoutProps) => (
  <Html>
    <Head />
    <Preview>{preview}</Preview>
    <Body style={main}>
      <Container style={container}>
        {logoUrl && (
          <Section style={logoSection}>
            <Img src={logoUrl} alt="Logo" style={logo} />
          </Section>
        )}
        <Section style={content}>{children}</Section>
        <Section style={footer}>
          <Text style={footerText}>
            Case Study Builder - Weld Australia
          </Text>
          <Text style={footerText}>
            This is an automated notification from the Case Study Builder system.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
}

const logoSection = {
  padding: '32px',
  textAlign: 'center' as const,
}

const logo = {
  margin: '0 auto',
  maxWidth: '200px',
}

const content = {
  padding: '0 48px',
}

const footer = {
  padding: '32px 48px',
  textAlign: 'center' as const,
}

const footerText = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
}

export default BaseLayout
