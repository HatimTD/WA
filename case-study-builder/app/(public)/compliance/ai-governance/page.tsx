import { IOSSafeLink } from '@/components/ios-safe-link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Governance Policy',
  description: 'Welding Alloys AI Governance Policy detailing transparent AI usage with human oversight.',
};

export default function AIGovernancePage() {
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-wa-green-900 mb-4">
              AI Governance Policy
            </h1>
            <p className="text-lg text-gray-600">
              Effective Date: December 10, 2024
            </p>
          </div>

          {/* AI Governance Content */}
          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">1. Our Commitment to Responsible AI</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <p className="text-gray-700 mb-4">
                  At Welding Alloys, we are committed to the responsible and transparent use of Artificial Intelligence (AI)
                  in the Case Study Builder application. This AI Governance Policy outlines how we use AI technologies,
                  ensure human oversight, protect your data, and maintain accountability.
                </p>
                <p className="text-gray-700">
                  We believe AI should augment human capabilities, not replace human judgment. All AI-assisted features are
                  designed with transparency, fairness, and user control as core principles.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">2. AI Usage Disclosure</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <h3 className="text-lg font-semibold text-wa-green-900 mb-3">2.1 Where We Use AI</h3>
                <p className="text-gray-700 mb-4">
                  The Case Study Builder uses AI technologies in the following areas:
                </p>

                <div className="space-y-4 mb-6">
                  <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-wa-green-900">
                    <h4 className="font-semibold text-gray-900 mb-2">Content Generation Assistance</h4>
                    <p className="text-gray-700 text-sm mb-2">
                      AI helps generate initial drafts, summaries, and suggestions for case study content based on your input.
                    </p>
                    <p className="text-gray-600 text-sm">
                      <strong>Human Oversight:</strong> All AI-generated content requires human review and approval before publication.
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-wa-green-900">
                    <h4 className="font-semibold text-gray-900 mb-2">Voice-to-Text Transcription</h4>
                    <p className="text-gray-700 text-sm mb-2">
                      AI-powered speech recognition converts voice input to text for case study creation.
                    </p>
                    <p className="text-gray-600 text-sm">
                      <strong>Human Oversight:</strong> Transcriptions are editable and require verification before saving.
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-wa-green-900">
                    <h4 className="font-semibold text-gray-900 mb-2">Content Recommendations</h4>
                    <p className="text-gray-700 text-sm mb-2">
                      AI analyzes case study content to suggest relevant tags, categories, and related case studies.
                    </p>
                    <p className="text-gray-600 text-sm">
                      <strong>Human Oversight:</strong> Users can accept, modify, or reject all suggestions.
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-wa-green-900">
                    <h4 className="font-semibold text-gray-900 mb-2">Search and Discovery</h4>
                    <p className="text-gray-700 text-sm mb-2">
                      AI-powered semantic search helps users find relevant case studies more effectively.
                    </p>
                    <p className="text-gray-600 text-sm">
                      <strong>Human Oversight:</strong> Search results are augmented, not filtered, by AI.
                    </p>
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-wa-green-900 mb-3">2.2 What AI Does NOT Do</h3>
                <p className="text-gray-700 mb-2">
                  To be clear, AI in the Case Study Builder does NOT:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>Make final decisions on case study approvals or rejections</li>
                  <li>Automatically publish content without human review</li>
                  <li>Access or process data beyond what is necessary for the specific feature</li>
                  <li>Make autonomous changes to your case studies</li>
                  <li>Share your data with third-party AI training datasets (unless explicitly consented)</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">3. Human Oversight and Control</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <h3 className="text-lg font-semibold text-wa-green-900 mb-3">3.1 Human-in-the-Loop Design</h3>
                <p className="text-gray-700 mb-4">
                  Every AI feature is designed with human oversight as a core principle:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-6">
                  <li><strong>Review Required:</strong> All AI-generated content must be reviewed by a human before finalization</li>
                  <li><strong>Edit Capability:</strong> Users can freely edit, modify, or reject AI suggestions</li>
                  <li><strong>Transparency:</strong> AI-generated content is clearly marked with indicators</li>
                  <li><strong>Opt-Out Available:</strong> Users can disable AI-assisted features in their settings</li>
                  <li><strong>Approval Workflows:</strong> Critical decisions remain with designated human approvers</li>
                </ul>

                <h3 className="text-lg font-semibold text-wa-green-900 mb-3">3.2 AI Transparency Indicators</h3>
                <p className="text-gray-700 mb-4">
                  When content is generated or assisted by AI, we clearly indicate this through:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>Visual badges or labels on AI-generated content</li>
                  <li>Audit trails showing when AI assistance was used</li>
                  <li>Metadata recording the AI model and version used</li>
                  <li>Clear attribution in case study metadata</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">4. Data Usage for AI Training</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <h3 className="text-lg font-semibold text-wa-green-900 mb-3">4.1 Your Data, Your Control</h3>
                <p className="text-gray-700 mb-4">
                  We are committed to protecting your data and giving you control over how it is used:
                </p>

                <div className="bg-wa-green-50 rounded-lg p-6 border-2 border-wa-green-900 mb-6">
                  <h4 className="font-semibold text-wa-green-900 mb-3">Default Privacy Protection</h4>
                  <p className="text-gray-700 mb-2">
                    <strong>By default, your case study data is NOT used for AI model training.</strong>
                  </p>
                  <p className="text-gray-700">
                    Your content is processed only to provide the specific AI features you use (e.g., generating summaries),
                    and is not retained for training purposes unless you explicitly opt-in.
                  </p>
                </div>

                <h3 className="text-lg font-semibold text-wa-green-900 mb-3">4.2 Optional AI Training Contribution</h3>
                <p className="text-gray-700 mb-4">
                  If you wish to help improve our AI models, you can opt-in to contribute anonymized data:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-4">
                  <li>Data is anonymized and stripped of personally identifiable information</li>
                  <li>Customer names, sensitive project details, and proprietary information are excluded</li>
                  <li>You can opt-in or opt-out at any time in your account settings</li>
                  <li>Opt-in is per user, not organization-wide</li>
                </ul>
                <p className="text-gray-700">
                  To opt-in or opt-out, visit your <strong>Account Settings → Privacy → AI Training Preferences</strong>.
                </p>

                <h3 className="text-lg font-semibold text-wa-green-900 mb-3">4.3 Third-Party AI Services</h3>
                <p className="text-gray-700">
                  When we use third-party AI services (e.g., OpenAI, Anthropic), we ensure:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>Data Processing Agreements (DPAs) are in place</li>
                  <li>Your data is not used for third-party model training (where contractually guaranteed)</li>
                  <li>Data is encrypted in transit and at rest</li>
                  <li>Minimal data is shared, limited to what is necessary for the feature</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">5. AI Fairness and Bias Mitigation</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <h3 className="text-lg font-semibold text-wa-green-900 mb-3">5.1 Commitment to Fairness</h3>
                <p className="text-gray-700 mb-4">
                  We are committed to ensuring our AI systems are fair and do not perpetuate bias:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-6">
                  <li>Regular audits of AI outputs for potential bias</li>
                  <li>Diverse training data to reduce demographic bias</li>
                  <li>Continuous monitoring of AI performance across different user groups</li>
                  <li>User feedback mechanisms to report problematic AI behavior</li>
                </ul>

                <h3 className="text-lg font-semibold text-wa-green-900 mb-3">5.2 Reporting Issues</h3>
                <p className="text-gray-700">
                  If you believe an AI feature has produced biased, inaccurate, or inappropriate content, please report it to{' '}
                  <a href="mailto:ai-governance@weldingalloys.com" className="text-wa-green-900 hover:underline font-semibold">ai-governance@weldingalloys.com</a>.
                  We investigate all reports and take corrective action as needed.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">6. Data Security and Privacy</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <p className="text-gray-700 mb-4">
                  When AI processes your data, we maintain the same high security standards:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-6">
                  <li><strong>Encryption:</strong> All data is encrypted in transit (TLS 1.3) and at rest (AES-256)</li>
                  <li><strong>Access Control:</strong> AI systems access only the minimal data required</li>
                  <li><strong>Audit Logs:</strong> All AI interactions are logged for security and accountability</li>
                  <li><strong>Data Minimization:</strong> AI processes only what is necessary for the specific task</li>
                  <li><strong>Retention Limits:</strong> AI processing data is not retained longer than necessary</li>
                  <li><strong>Compliance:</strong> All AI usage complies with GDPR, CCPA, and other applicable regulations</li>
                </ul>

                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                  <h4 className="font-semibold text-yellow-900 mb-2">Important Privacy Notice</h4>
                  <p className="text-yellow-800 text-sm">
                    Never include passwords, API keys, or other sensitive credentials in case study content. While our AI
                    systems have filters to detect such data, human vigilance is the first line of defense.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">7. AI Model Information</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <h3 className="text-lg font-semibold text-wa-green-900 mb-3">7.1 AI Models We Use</h3>
                <p className="text-gray-700 mb-4">
                  The Case Study Builder uses the following AI technologies:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-6">
                  <li><strong>Content Generation:</strong> Large Language Models (LLMs) from OpenAI (GPT-4) and/or Anthropic (Claude)</li>
                  <li><strong>Voice Recognition:</strong> Web Speech API (browser-based) and/or Google Cloud Speech-to-Text</li>
                  <li><strong>Search & Recommendations:</strong> Embeddings-based semantic search</li>
                  <li><strong>Analytics:</strong> Machine learning models for usage pattern analysis (anonymized)</li>
                </ul>

                <h3 className="text-lg font-semibold text-wa-green-900 mb-3">7.2 Model Updates</h3>
                <p className="text-gray-700">
                  AI models are periodically updated to improve performance and accuracy. Material changes to AI capabilities
                  will be communicated via system notifications and this policy will be updated accordingly.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">8. Your Rights and Opt-Out Options</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <h3 className="text-lg font-semibold text-wa-green-900 mb-3">8.1 Right to Disable AI Features</h3>
                <p className="text-gray-700 mb-4">
                  You can disable AI-assisted features at any time:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-6">
                  <li>Navigate to <strong>Account Settings → Privacy → AI Preferences</strong></li>
                  <li>Toggle off specific AI features or disable all AI assistance</li>
                  <li>Your choice is saved and applies to all future sessions</li>
                  <li>Disabling AI does not affect core application functionality</li>
                </ul>

                <h3 className="text-lg font-semibold text-wa-green-900 mb-3">8.2 Right to Opt-Out of AI Training</h3>
                <p className="text-gray-700 mb-4">
                  To ensure your data is never used for AI model training:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-6">
                  <li>By default, you are opted-out (no action required)</li>
                  <li>If you previously opted-in, you can opt-out in <strong>Account Settings → Privacy → AI Training</strong></li>
                  <li>Your choice applies retroactively to data collected since you opted-in</li>
                </ul>

                <h3 className="text-lg font-semibold text-wa-green-900 mb-3">8.3 Right to Human Review</h3>
                <p className="text-gray-700">
                  You can request human review of any AI-generated content or decision. Contact{' '}
                  <a href="mailto:ai-governance@weldingalloys.com" className="text-wa-green-900 hover:underline font-semibold">ai-governance@weldingalloys.com</a>{' '}
                  to request a review.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">9. Accountability and Governance</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <h3 className="text-lg font-semibold text-wa-green-900 mb-3">9.1 AI Governance Team</h3>
                <p className="text-gray-700 mb-4">
                  We have established an AI Governance Team responsible for:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700 mb-6">
                  <li>Overseeing AI development and deployment</li>
                  <li>Conducting regular AI ethics reviews</li>
                  <li>Investigating reported issues with AI systems</li>
                  <li>Ensuring compliance with AI regulations and best practices</li>
                  <li>Updating this policy as AI capabilities evolve</li>
                </ul>

                <h3 className="text-lg font-semibold text-wa-green-900 mb-3">9.2 Regular Audits</h3>
                <p className="text-gray-700 mb-4">
                  We conduct regular audits of our AI systems:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>Quarterly reviews of AI performance and accuracy</li>
                  <li>Annual third-party audits of AI ethics and bias</li>
                  <li>Continuous monitoring of AI security and data protection</li>
                  <li>User feedback analysis and incorporation</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">10. Contact and Questions</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <p className="text-gray-700 mb-4">
                  For questions about our AI practices, to report concerns, or to exercise your rights:
                </p>
                <div className="bg-wa-green-50 rounded-lg p-6 border-2 border-wa-green-200 mb-6">
                  <p className="text-gray-700 mb-2">
                    <strong>AI Governance Team</strong>
                  </p>
                  <p className="text-gray-700 mb-2">
                    Email: <a href="mailto:ai-governance@weldingalloys.com" className="text-wa-green-900 hover:underline font-semibold">ai-governance@weldingalloys.com</a>
                  </p>
                  <p className="text-gray-700 mb-4">
                    Data Protection Officer: <a href="mailto:dpo@weldingalloys.com" className="text-wa-green-900 hover:underline font-semibold">dpo@weldingalloys.com</a>
                  </p>
                  <p className="text-sm text-gray-600">
                    We aim to respond to all inquiries within 48 hours
                  </p>
                </div>

                <p className="text-gray-700">
                  For technical support related to AI features, use the in-app support chat or email{' '}
                  <a href="mailto:support@weldingalloys.com" className="text-wa-green-900 hover:underline">support@weldingalloys.com</a>.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">11. Updates to This Policy</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-gray max-w-none">
                <p className="text-gray-700 mb-4">
                  As AI technology evolves, we may update this AI Governance Policy. Material changes will be communicated through:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>Email notification to all users</li>
                  <li>Prominent notice in the application</li>
                  <li>Updated effective date at the top of this policy</li>
                </ul>
                <p className="text-gray-700 mt-4">
                  Continued use of AI features after updates constitutes acceptance of the revised policy. If you disagree
                  with changes, you can disable AI features in your account settings.
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
            <IOSSafeLink href="/compliance/dpa">
              <Button className="w-full sm:w-auto bg-wa-green-900 hover:bg-wa-green-800">
                Read DPA
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
