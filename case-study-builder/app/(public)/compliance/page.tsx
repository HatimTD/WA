import { IOSSafeLink } from '@/components/ios-safe-link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Compliance & Security',
  description: 'Welding Alloys security compliance documentation including DPA, GDPR, and AI Governance policies.',
};

export default function CompliancePage() {
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
            <IOSSafeLink
              href="/dev-login"
              prefetch={false}
            >
              <Button className="bg-wa-green-900 hover:bg-wa-green-800">
                Login
              </Button>
            </IOSSafeLink>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 sm:pt-40 pb-16 sm:pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-6 sm:space-y-8">
            <div className="flex justify-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-wa-green-900 rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
            </div>

            <div className="space-y-3 sm:space-y-4">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-wa-green-900 tracking-tight">
                Compliance & Security
              </h1>
              <p className="text-xl sm:text-2xl text-gray-700 font-medium">
                Your data security and privacy are our priority
              </p>
            </div>

            <p className="text-base sm:text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed px-4">
              At Welding Alloys, we are committed to protecting your data and ensuring compliance with global data protection regulations.
              Review our comprehensive policies below to understand how we handle your information.
            </p>
          </div>
        </div>
      </section>

      {/* Compliance Documents */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* DPA Card */}
            <Card className="hover:shadow-xl transition-all duration-300 border-2 hover:border-wa-green-200">
              <CardHeader>
                <div className="w-12 h-12 bg-wa-green-900 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <CardTitle className="text-2xl">Data Processing Agreement</CardTitle>
                <CardDescription className="text-base">
                  Our commitment to processing your data securely and responsibly
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600 mb-6">
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-wa-green-900 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Data controller information
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-wa-green-900 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Processing purposes & legal basis
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-wa-green-900 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Security measures & retention
                  </li>
                </ul>
                <IOSSafeLink href="/compliance/dpa">
                  <Button className="w-full bg-wa-green-900 hover:bg-wa-green-800">
                    Read DPA
                  </Button>
                </IOSSafeLink>
              </CardContent>
            </Card>

            {/* GDPR Card */}
            <Card className="hover:shadow-xl transition-all duration-300 border-2 hover:border-wa-green-200">
              <CardHeader>
                <div className="w-12 h-12 bg-wa-green-900 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <CardTitle className="text-2xl">GDPR Privacy Policy</CardTitle>
                <CardDescription className="text-base">
                  How we protect your privacy rights under GDPR
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600 mb-6">
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-wa-green-900 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Your data subject rights
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-wa-green-900 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Cookie policy & tracking
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-wa-green-900 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Contact & data requests
                  </li>
                </ul>
                <IOSSafeLink href="/compliance/gdpr">
                  <Button className="w-full bg-wa-green-900 hover:bg-wa-green-800">
                    Read GDPR Policy
                  </Button>
                </IOSSafeLink>
              </CardContent>
            </Card>

            {/* AI Governance Card */}
            <Card className="hover:shadow-xl transition-all duration-300 border-2 hover:border-wa-green-200">
              <CardHeader>
                <div className="w-12 h-12 bg-wa-green-900 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <CardTitle className="text-2xl">AI Governance Policy</CardTitle>
                <CardDescription className="text-base">
                  Transparent AI usage with human oversight and control
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600 mb-6">
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-wa-green-900 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    AI usage disclosure
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-wa-green-900 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Human oversight & review
                  </li>
                  <li className="flex items-start">
                    <svg className="w-5 h-5 text-wa-green-900 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Training data & opt-out
                  </li>
                </ul>
                <IOSSafeLink href="/compliance/ai-governance">
                  <Button className="w-full bg-wa-green-900 hover:bg-wa-green-800">
                    Read AI Policy
                  </Button>
                </IOSSafeLink>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white/50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-wa-green-900 mb-6">
            Questions About Our Policies?
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            If you have any questions about our compliance policies or data handling practices,
            please don't hesitate to contact our Data Protection Officer.
          </p>
          <div className="bg-white rounded-xl p-6 sm:p-8 shadow-lg border-2 border-wa-green-200">
            <p className="text-gray-700 mb-2">
              <strong>Data Protection Officer</strong>
            </p>
            <p className="text-gray-600 mb-4">
              Email: <a href="mailto:dpo@weldingalloys.com" className="text-wa-green-900 hover:underline font-semibold">dpo@weldingalloys.com</a>
            </p>
            <p className="text-sm text-gray-500">
              We aim to respond to all inquiries within 48 hours
            </p>
          </div>
        </div>
      </section>

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
