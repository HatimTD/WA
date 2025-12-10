import { IOSSafeLink } from '@/components/ios-safe-link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'GDPR Privacy Policy',
  description: 'Welding Alloys GDPR Privacy Policy explaining how we protect your privacy rights.',
};

export default function GDPRPage() {
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-wa-green-900 mb-4">
              GDPR Privacy Policy
            </h1>
            <p className="text-lg text-gray-600">
              Effective Date: December 10, 2024
            </p>
          </div>

          {/* GDPR Content */}
          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">1. Introduction</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <p className="text-gray-700 mb-4">
                  Welding Alloys Group ("we," "our," or "us") is committed to protecting your personal data and respecting
                  your privacy rights under the General Data Protection Regulation (GDPR) and other applicable data protection laws.
                </p>
                <p className="text-gray-700">
                  This Privacy Policy explains how we collect, use, share, and protect your personal information when you use
                  the Case Study Builder application. It also describes your rights regarding your personal data and how to
                  exercise them.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">2. Data Controller and Contact Details</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <p className="text-gray-700 mb-4">
                  The data controller responsible for your personal data is:
                </p>
                <div className="bg-wa-green-50 rounded-lg p-6 border-2 border-wa-green-200">
                  <p className="text-gray-700 mb-2">
                    <strong>Welding Alloys Group</strong>
                  </p>
                  <p className="text-gray-700 mb-2">
                    Registered Address: [Company Registered Address]
                  </p>
                  <p className="text-gray-700 mb-4">
                    Data Protection Officer: <a href="mailto:dpo@weldingalloys.com" className="text-wa-green-900 hover:underline font-semibold">dpo@weldingalloys.com</a>
                  </p>
                  <p className="text-sm text-gray-600">
                    If you have any questions about this Privacy Policy or our data processing practices, please contact our
                    Data Protection Officer.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">3. Personal Data We Collect</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <h3 className="text-lg font-semibold text-wa-green-900 mb-3">3.1 Information You Provide</h3>
                <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-6">
                  <li><strong>Account Information:</strong> Name, email address, job title, department, employee ID</li>
                  <li><strong>Case Study Content:</strong> Technical descriptions, photographs, project details, customer information (when authorized)</li>
                  <li><strong>Communications:</strong> Comments, feedback, questions, and support requests</li>
                </ul>

                <h3 className="text-lg font-semibold text-wa-green-900 mb-3">3.2 Information Collected Automatically</h3>
                <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-6">
                  <li><strong>Usage Data:</strong> Pages visited, features used, time spent, actions taken</li>
                  <li><strong>Technical Data:</strong> IP address, browser type, device type, operating system</li>
                  <li><strong>Authentication Data:</strong> Login timestamps, session information</li>
                  <li><strong>Analytics Data:</strong> Aggregated usage statistics (anonymized where possible)</li>
                </ul>

                <h3 className="text-lg font-semibold text-wa-green-900 mb-3">3.3 Information from Third Parties</h3>
                <p className="text-gray-700">
                  We may receive information about you from our internal systems (e.g., HR systems, Active Directory) to
                  facilitate your access to the application as an employee.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">4. Legal Basis for Processing</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <p className="text-gray-700 mb-4">
                  We process your personal data based on the following legal grounds under GDPR:
                </p>
                <ul className="list-disc pl-6 space-y-3 text-gray-700">
                  <li>
                    <strong>Contractual Necessity (Article 6(1)(b)):</strong> Processing necessary to provide you access to
                    the Case Study Builder and related services as part of your employment
                  </li>
                  <li>
                    <strong>Legitimate Interests (Article 6(1)(f)):</strong> Processing for business operations, security,
                    fraud prevention, and improving our services
                  </li>
                  <li>
                    <strong>Legal Obligation (Article 6(1)(c)):</strong> Processing required by law, such as record-keeping
                    requirements and security monitoring
                  </li>
                  <li>
                    <strong>Consent (Article 6(1)(a)):</strong> Where you have provided explicit consent for specific processing
                    activities, such as optional analytics features
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">5. How We Use Your Personal Data</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <p className="text-gray-700 mb-4">
                  We use your personal data for the following purposes:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li><strong>Service Delivery:</strong> Provide access to the Case Study Builder, manage your account, and enable collaboration</li>
                  <li><strong>Communication:</strong> Send notifications, respond to inquiries, and provide technical support</li>
                  <li><strong>Analytics:</strong> Understand usage patterns and improve our services</li>
                  <li><strong>Security:</strong> Protect against unauthorized access, fraud, and security threats</li>
                  <li><strong>Compliance:</strong> Meet legal and regulatory requirements</li>
                  <li><strong>Business Operations:</strong> Manage workflows, approvals, and reporting</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">6. Your Rights Under GDPR</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <p className="text-gray-700 mb-4">
                  You have the following rights regarding your personal data:
                </p>

                <div className="space-y-4">
                  <div className="border-l-4 border-wa-green-900 pl-4">
                    <h4 className="font-semibold text-wa-green-900 mb-2">Right to Access (Article 15)</h4>
                    <p className="text-gray-700">
                      You can request a copy of your personal data and information about how we process it.
                    </p>
                  </div>

                  <div className="border-l-4 border-wa-green-900 pl-4">
                    <h4 className="font-semibold text-wa-green-900 mb-2">Right to Rectification (Article 16)</h4>
                    <p className="text-gray-700">
                      You can request correction of inaccurate or incomplete personal data.
                    </p>
                  </div>

                  <div className="border-l-4 border-wa-green-900 pl-4">
                    <h4 className="font-semibold text-wa-green-900 mb-2">Right to Erasure (Article 17)</h4>
                    <p className="text-gray-700">
                      You can request deletion of your personal data in certain circumstances (subject to legal retention requirements).
                    </p>
                  </div>

                  <div className="border-l-4 border-wa-green-900 pl-4">
                    <h4 className="font-semibold text-wa-green-900 mb-2">Right to Restriction (Article 18)</h4>
                    <p className="text-gray-700">
                      You can request that we limit the processing of your personal data in certain situations.
                    </p>
                  </div>

                  <div className="border-l-4 border-wa-green-900 pl-4">
                    <h4 className="font-semibold text-wa-green-900 mb-2">Right to Data Portability (Article 20)</h4>
                    <p className="text-gray-700">
                      You can receive your personal data in a structured, commonly used, machine-readable format.
                    </p>
                  </div>

                  <div className="border-l-4 border-wa-green-900 pl-4">
                    <h4 className="font-semibold text-wa-green-900 mb-2">Right to Object (Article 21)</h4>
                    <p className="text-gray-700">
                      You can object to processing based on legitimate interests or for direct marketing purposes.
                    </p>
                  </div>

                  <div className="border-l-4 border-wa-green-900 pl-4">
                    <h4 className="font-semibold text-wa-green-900 mb-2">Right to Withdraw Consent (Article 7)</h4>
                    <p className="text-gray-700">
                      Where processing is based on consent, you can withdraw it at any time.
                    </p>
                  </div>

                  <div className="border-l-4 border-wa-green-900 pl-4">
                    <h4 className="font-semibold text-wa-green-900 mb-2">Right to Lodge a Complaint</h4>
                    <p className="text-gray-700">
                      You can lodge a complaint with your local data protection supervisory authority.
                    </p>
                  </div>
                </div>

                <p className="text-gray-700 mt-6">
                  To exercise any of these rights, please contact our Data Protection Officer at{' '}
                  <a href="mailto:dpo@weldingalloys.com" className="text-wa-green-900 hover:underline font-semibold">dpo@weldingalloys.com</a>.
                  We will respond to your request within 30 days.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">7. Data Sharing and Disclosure</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <h3 className="text-lg font-semibold text-wa-green-900 mb-3">7.1 Internal Sharing</h3>
                <p className="text-gray-700 mb-4">
                  Your personal data is accessible to authorized Welding Alloys employees who need it to perform their job
                  functions. Access is controlled through role-based permissions.
                </p>

                <h3 className="text-lg font-semibold text-wa-green-900 mb-3">7.2 Third-Party Service Providers</h3>
                <p className="text-gray-700 mb-4">
                  We share personal data with trusted service providers who process data on our behalf:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-6">
                  <li>Cloud hosting providers (Vercel, AWS)</li>
                  <li>Authentication services</li>
                  <li>Analytics services (with data minimization)</li>
                  <li>Email service providers</li>
                </ul>
                <p className="text-gray-700 mb-6">
                  All service providers are contractually bound to protect your data and comply with GDPR.
                </p>

                <h3 className="text-lg font-semibold text-wa-green-900 mb-3">7.3 Legal Disclosures</h3>
                <p className="text-gray-700 mb-6">
                  We may disclose personal data when required by law, court order, or to protect our legal rights.
                </p>

                <h3 className="text-lg font-semibold text-wa-green-900 mb-3">7.4 International Transfers</h3>
                <p className="text-gray-700">
                  When personal data is transferred outside the EEA, we ensure appropriate safeguards through Standard
                  Contractual Clauses, adequacy decisions, or other approved mechanisms under GDPR Chapter V.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">8. Data Retention</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <p className="text-gray-700 mb-4">
                  We retain personal data only as long as necessary for the purposes outlined in this policy:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li><strong>User Account Data:</strong> Duration of employment plus 7 years for legal compliance</li>
                  <li><strong>Case Study Content:</strong> Retained for business purposes unless deletion is requested</li>
                  <li><strong>Usage and Analytics Data:</strong> 13 months</li>
                  <li><strong>Authentication Logs:</strong> 90 days</li>
                  <li><strong>Backup Data:</strong> 30 days</li>
                </ul>
                <p className="text-gray-700 mt-4">
                  After the retention period expires, personal data is securely deleted or anonymized.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">9. Cookies and Tracking Technologies</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <h3 className="text-lg font-semibold text-wa-green-900 mb-3">9.1 Cookies We Use</h3>
                <p className="text-gray-700 mb-4">
                  The Case Study Builder uses the following types of cookies:
                </p>

                <div className="space-y-4 mb-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Essential Cookies (Required)</h4>
                    <p className="text-gray-700 text-sm mb-2">
                      Necessary for authentication, security, and basic application functionality.
                    </p>
                    <p className="text-gray-600 text-sm">Duration: Session or up to 30 days</p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Analytics Cookies (Optional)</h4>
                    <p className="text-gray-700 text-sm mb-2">
                      Help us understand how users interact with the application to improve user experience.
                    </p>
                    <p className="text-gray-600 text-sm">Duration: Up to 13 months</p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Preference Cookies (Optional)</h4>
                    <p className="text-gray-700 text-sm mb-2">
                      Remember your settings and preferences for a better experience.
                    </p>
                    <p className="text-gray-600 text-sm">Duration: Up to 12 months</p>
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-wa-green-900 mb-3">9.2 Managing Cookies</h3>
                <p className="text-gray-700">
                  You can manage cookie preferences through your browser settings. Note that disabling essential cookies may
                  affect application functionality. Analytics and preference cookies require your consent and can be disabled
                  without affecting core features.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">10. Data Security</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <p className="text-gray-700 mb-4">
                  We implement comprehensive security measures to protect your personal data:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
                  <li>End-to-end encryption for data in transit (TLS 1.3)</li>
                  <li>Encryption at rest (AES-256)</li>
                  <li>Multi-factor authentication</li>
                  <li>Regular security audits and penetration testing</li>
                  <li>Access controls and least privilege principles</li>
                  <li>Employee training on data protection</li>
                  <li>Incident response procedures</li>
                </ul>
                <p className="text-gray-700">
                  While we strive to protect your data, no method of transmission over the internet or electronic storage is
                  100% secure. We continuously monitor and improve our security measures.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">11. Children's Privacy</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <p className="text-gray-700">
                  The Case Study Builder is intended for use by Welding Alloys employees and authorized business partners.
                  We do not knowingly collect personal data from individuals under the age of 16. If you become aware that
                  a child has provided us with personal data, please contact our Data Protection Officer.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">12. Changes to This Privacy Policy</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <p className="text-gray-700 mb-4">
                  We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements.
                  Material changes will be communicated through:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>Email notification to registered users</li>
                  <li>Prominent notice on the application</li>
                  <li>Updated effective date at the top of this policy</li>
                </ul>
                <p className="text-gray-700 mt-4">
                  We encourage you to review this Privacy Policy periodically. Continued use of the application after changes
                  constitutes acceptance of the updated policy.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">13. Supervisory Authority</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <p className="text-gray-700 mb-4">
                  If you have concerns about how we handle your personal data, you have the right to lodge a complaint with
                  your local data protection supervisory authority. For users in the EU/EEA, you can find your supervisory
                  authority at: <a href="https://edpb.europa.eu/about-edpb/board/members_en" className="text-wa-green-900 hover:underline" target="_blank" rel="noopener noreferrer">https://edpb.europa.eu</a>
                </p>
                <p className="text-gray-700">
                  We would appreciate the opportunity to address your concerns before you approach the supervisory authority,
                  so please contact us first.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">14. Contact Us</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <p className="text-gray-700 mb-4">
                  For questions about this Privacy Policy, to exercise your rights, or to raise concerns:
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
          </div>

          {/* Navigation Buttons */}
          <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center">
            <IOSSafeLink href="/compliance">
              <Button variant="outline" className="w-full sm:w-auto border-wa-green-900 text-wa-green-900 hover:bg-wa-green-50">
                Back to Compliance
              </Button>
            </IOSSafeLink>
            <IOSSafeLink href="/compliance/ai-governance">
              <Button className="w-full sm:w-auto bg-wa-green-900 hover:bg-wa-green-800">
                Read AI Governance Policy
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
