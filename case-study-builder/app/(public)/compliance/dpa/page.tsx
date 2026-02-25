import { IOSSafeLink } from '@/components/ios-safe-link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Data Processing Agreement',
  description: 'Welding Alloys Data Processing Agreement detailing how we process and protect your data.',
};

export default function DPAPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-wa-green-50/30">
      {/* Header Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <IOSSafeLink href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12">
                <img
                  src="/welding_alloys_logo.png"
                  alt="Welding Alloys Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="hidden sm:block">
                <h2 className="text-lg sm:text-xl font-bold text-wa-green-900">Welding Alloys</h2>
                <p className="text-xs text-gray-600">Case Study Builder</p>
              </div>
            </IOSSafeLink>
            <IOSSafeLink href="/compliance">
              <Button variant="outline" className="border-wa-green-900 text-wa-green-900 hover:bg-wa-green-50">
                Back to Compliance
              </Button>
            </IOSSafeLink>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="pt-32 sm:pt-40 pb-16 sm:pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-wa-green-900 rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-wa-green-900 mb-4">
              Data Processing Agreement
            </h1>
            <p className="text-lg text-gray-600">
              Effective Date: December 10, 2024
            </p>
          </div>

          {/* DPA Content */}
          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">1. Data Controller Information</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <p className="text-gray-700 mb-4">
                  <strong>Data Controller:</strong> Welding Alloys Group
                </p>
                <p className="text-gray-700 mb-4">
                  <strong>Registered Address:</strong> [Company Registered Address]
                </p>
                <p className="text-gray-700 mb-4">
                  <strong>Contact:</strong> <a href="mailto:dpo@weldingalloys.com" className="text-wa-green-900 hover:underline">dpo@weldingalloys.com</a>
                </p>
                <p className="text-gray-700">
                  Welding Alloys Group ("we," "our," or "us") acts as the data controller for the Case Study Builder application.
                  We determine the purposes and means of processing personal data collected through our platform.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">2. Data Processing Activities</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <h3 className="text-lg font-semibold text-wa-green-900 mb-3">2.1 Types of Data Processed</h3>
                <p className="text-gray-700 mb-4">
                  We process the following categories of personal data:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-6">
                  <li><strong>User Account Data:</strong> Name, email address, job title, department, employee ID</li>
                  <li><strong>Authentication Data:</strong> Login credentials, session tokens, IP addresses</li>
                  <li><strong>Case Study Content:</strong> Technical data, project descriptions, photographs, customer information (when authorized)</li>
                  <li><strong>Usage Data:</strong> Access logs, feature usage, timestamps, device information</li>
                  <li><strong>Communication Data:</strong> Comments, feedback, support requests</li>
                </ul>

                <h3 className="text-lg font-semibold text-wa-green-900 mb-3">2.2 Processing Purposes</h3>
                <p className="text-gray-700 mb-4">
                  Personal data is processed for the following purposes:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>User authentication and access control</li>
                  <li>Case study creation, management, and approval workflows</li>
                  <li>Collaboration and knowledge sharing within the organization</li>
                  <li>Analytics and reporting on case study metrics</li>
                  <li>System security, maintenance, and improvement</li>
                  <li>Compliance with legal and regulatory requirements</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">3. Legal Basis for Processing</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <p className="text-gray-700 mb-4">
                  We process personal data based on the following legal grounds:
                </p>
                <ul className="list-disc pl-6 space-y-3 text-gray-700">
                  <li>
                    <strong>Contractual Necessity:</strong> Processing necessary to provide the Case Study Builder service to employees and authorized users
                  </li>
                  <li>
                    <strong>Legitimate Interest:</strong> Processing for internal business operations, system security, and improvement of services
                  </li>
                  <li>
                    <strong>Legal Obligation:</strong> Processing required to comply with legal and regulatory requirements
                  </li>
                  <li>
                    <strong>Consent:</strong> Where explicit consent is obtained for specific processing activities (e.g., analytics)
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">4. Data Security Measures</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <p className="text-gray-700 mb-4">
                  We implement comprehensive technical and organizational security measures:
                </p>

                <h3 className="text-lg font-semibold text-wa-green-900 mb-3">4.1 Technical Measures</h3>
                <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-6">
                  <li>End-to-end encryption for data transmission (TLS 1.3)</li>
                  <li>Encryption at rest for stored data (AES-256)</li>
                  <li>Multi-factor authentication for user access</li>
                  <li>Role-based access control (RBAC)</li>
                  <li>Regular security audits and vulnerability assessments</li>
                  <li>Automated backup systems with encryption</li>
                  <li>Intrusion detection and prevention systems</li>
                </ul>

                <h3 className="text-lg font-semibold text-wa-green-900 mb-3">4.2 Organizational Measures</h3>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>Comprehensive data protection policies and procedures</li>
                  <li>Regular security awareness training for staff</li>
                  <li>Strict access controls and least privilege principles</li>
                  <li>Incident response and data breach notification procedures</li>
                  <li>Regular review and update of security measures</li>
                  <li>Vendor security assessments and due diligence</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">5. Data Retention and Deletion</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <h3 className="text-lg font-semibold text-wa-green-900 mb-3">5.1 Retention Periods</h3>
                <p className="text-gray-700 mb-4">
                  Personal data is retained for the following periods:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-6">
                  <li><strong>User Account Data:</strong> Duration of employment plus 7 years for legal compliance</li>
                  <li><strong>Case Study Content:</strong> Retained indefinitely for business purposes unless deletion requested</li>
                  <li><strong>Usage Logs:</strong> 13 months for security and analytics purposes</li>
                  <li><strong>Authentication Logs:</strong> 90 days for security monitoring</li>
                  <li><strong>Backup Data:</strong> 30 days for disaster recovery</li>
                </ul>

                <h3 className="text-lg font-semibold text-wa-green-900 mb-3">5.2 Deletion Procedures</h3>
                <p className="text-gray-700">
                  Upon expiry of retention periods or upon valid deletion request, personal data is securely deleted using
                  industry-standard methods including cryptographic erasure for encrypted data and secure deletion protocols
                  for unencrypted data. Backups are automatically purged according to the retention schedule.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">6. Data Sharing and Transfers</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <h3 className="text-lg font-semibold text-wa-green-900 mb-3">6.1 Internal Sharing</h3>
                <p className="text-gray-700 mb-4">
                  Personal data is shared internally only with employees who require access to perform their job functions.
                  Access is controlled through role-based permissions.
                </p>

                <h3 className="text-lg font-semibold text-wa-green-900 mb-3">6.2 Third-Party Processors</h3>
                <p className="text-gray-700 mb-4">
                  We engage the following categories of third-party processors:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-6">
                  <li><strong>Cloud Infrastructure:</strong> Vercel (hosting), AWS (storage)</li>
                  <li><strong>Authentication Services:</strong> Auth.js / NextAuth</li>
                  <li><strong>Analytics Services:</strong> Vercel Analytics (anonymized)</li>
                  <li><strong>Communication:</strong> Email service providers</li>
                </ul>
                <p className="text-gray-700 mb-6">
                  All processors are bound by data processing agreements and comply with GDPR requirements.
                </p>

                <h3 className="text-lg font-semibold text-wa-green-900 mb-3">6.3 International Transfers</h3>
                <p className="text-gray-700">
                  When personal data is transferred outside the European Economic Area (EEA), we ensure appropriate safeguards
                  are in place through Standard Contractual Clauses (SCCs), adequacy decisions, or other approved transfer mechanisms.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">7. Data Subject Rights</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <p className="text-gray-700 mb-4">
                  As a data processor, we facilitate the exercise of the following data subject rights:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-6">
                  <li><strong>Right of Access:</strong> Obtain confirmation and copies of personal data</li>
                  <li><strong>Right to Rectification:</strong> Correct inaccurate or incomplete data</li>
                  <li><strong>Right to Erasure:</strong> Request deletion of personal data (subject to legal obligations)</li>
                  <li><strong>Right to Restriction:</strong> Limit processing in certain circumstances</li>
                  <li><strong>Right to Data Portability:</strong> Receive data in structured, machine-readable format</li>
                  <li><strong>Right to Object:</strong> Object to processing based on legitimate interests</li>
                </ul>
                <p className="text-gray-700">
                  To exercise these rights, contact our Data Protection Officer at{' '}
                  <a href="mailto:dpo@weldingalloys.com" className="text-wa-green-900 hover:underline">dpo@weldingalloys.com</a>.
                  We will respond to requests within 30 days.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">8. Data Breach Notification</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <p className="text-gray-700 mb-4">
                  In the event of a personal data breach, we will:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>Notify the relevant supervisory authority within 72 hours of becoming aware of the breach</li>
                  <li>Notify affected data subjects without undue delay if the breach poses a high risk to their rights</li>
                  <li>Document all data breaches, including facts, effects, and remedial actions taken</li>
                  <li>Implement measures to prevent future breaches</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">9. Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <p className="text-gray-700 mb-4">
                  For any questions regarding this Data Processing Agreement or our data processing activities:
                </p>
                <div className="bg-wa-green-50 rounded-lg p-6 border-2 border-wa-green-200">
                  <p className="text-gray-700 mb-2">
                    <strong>Data Protection Officer</strong>
                  </p>
                  <p className="text-gray-700 mb-2">
                    Welding Alloys Group
                  </p>
                  <p className="text-gray-700 mb-2">
                    Email: <a href="mailto:dpo@weldingalloys.com" className="text-wa-green-900 hover:underline font-semibold">dpo@weldingalloys.com</a>
                  </p>
                  <p className="text-sm text-gray-600 mt-4">
                    We aim to respond to all inquiries within 48 hours
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">10. Updates to this Agreement</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <p className="text-gray-700">
                  This Data Processing Agreement may be updated periodically to reflect changes in our data processing
                  activities or legal requirements. Material changes will be communicated to users via email or system
                  notifications. The current version is always available at this URL with the effective date noted at the top.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Navigation Buttons */}
          <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center">
            <IOSSafeLink href="/compliance">
              <Button variant="outline" className="w-full sm:w-auto border-wa-green-900 text-wa-green-900 hover:bg-wa-green-50">
                Back to Compliance
              </Button>
            </IOSSafeLink>
            <IOSSafeLink href="/compliance/gdpr">
              <Button className="w-full sm:w-auto bg-wa-green-900 hover:bg-wa-green-800">
                Read GDPR Policy
              </Button>
            </IOSSafeLink>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-8 sm:py-12 px-4 sm:px-6 lg:px-8 border-t border-gray-200 bg-white/80">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <h3 className="font-semibold text-wa-green-900 mb-4">Welding Alloys</h3>
              <p className="text-sm text-gray-600">
                Case Study Builder - Capturing industrial solutions since 2024
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-wa-green-900 mb-4">Compliance</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <IOSSafeLink href="/compliance/dpa" className="text-gray-600 hover:text-wa-green-900">
                    Data Processing Agreement
                  </IOSSafeLink>
                </li>
                <li>
                  <IOSSafeLink href="/compliance/gdpr" className="text-gray-600 hover:text-wa-green-900">
                    GDPR Privacy Policy
                  </IOSSafeLink>
                </li>
                <li>
                  <IOSSafeLink href="/compliance/ai-governance" className="text-gray-600 hover:text-wa-green-900">
                    AI Governance Policy
                  </IOSSafeLink>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-wa-green-900 mb-4">Quick Links</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <IOSSafeLink href="/" className="text-gray-600 hover:text-wa-green-900">
                    Home
                  </IOSSafeLink>
                </li>
                <li>
                  <IOSSafeLink href="/dev-login" className="text-gray-600 hover:text-wa-green-900">
                    Login
                  </IOSSafeLink>
                </li>
                <li>
                  <IOSSafeLink href="/dashboard" className="text-gray-600 hover:text-wa-green-900">
                    Dashboard
                  </IOSSafeLink>
                </li>
              </ul>
            </div>
          </div>
          <div className="text-center pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              &copy; {new Date().getFullYear()} Welding Alloys. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
