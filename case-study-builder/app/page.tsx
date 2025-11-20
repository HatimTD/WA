import { IOSSafeLink } from '@/components/ios-safe-link';
import Image from 'next/image';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Welding Alloys - Case Study Builder',
  description: 'Welcome to Welding Alloys Case Study Builder. Capture, catalog, and share industrial challenge solutions. Track progress toward solving 100,000 challenges by 2030.',
  openGraph: {
    title: 'Welding Alloys - Case Study Builder',
    description: 'Capture and share industrial welding solutions',
  },
};

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-wa-green-50/30">
      {/* Header Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 sm:w-12 sm:h-12">
                <Image
                  src="/welding-alloys-logo.svg"
                  alt="Welding Alloys Logo"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              <div className="hidden sm:block">
                <h2 className="text-lg sm:text-xl font-bold text-wa-green-900">Welding Alloys</h2>
                <p className="text-xs text-gray-600">Case Study Builder</p>
              </div>
            </div>
            <IOSSafeLink
              href="/dev-login"
              prefetch={false}
              className="px-4 sm:px-6 py-2 sm:py-2.5 bg-wa-green-900 text-white rounded-lg font-semibold hover:bg-wa-green-800 transition-all duration-200 shadow-lg hover:shadow-xl text-sm sm:text-base"
            >
              Login
            </IOSSafeLink>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 sm:pt-40 pb-16 sm:pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-6 sm:space-y-8">
            {/* Logo */}
            <div className="flex justify-center">
              <div className="relative w-24 h-24 sm:w-32 sm:h-32 lg:w-40 lg:h-40 animate-[fadeIn_1s_ease-in]">
                <Image
                  src="/welding-alloys-logo.svg"
                  alt="Welding Alloys Logo"
                  fill
                  className="object-contain drop-shadow-2xl"
                  priority
                />
              </div>
            </div>

            {/* Title */}
            <div className="space-y-3 sm:space-y-4">
              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-wa-green-900 tracking-tight">
                Case Study Builder
              </h1>
              <p className="text-xl sm:text-2xl lg:text-3xl text-gray-700 font-medium">
                Welding Alloys Internal Platform
              </p>
            </div>

            {/* Description */}
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed px-4">
              Capture, catalog, and share industrial challenge solutions.
              Track our progress toward solving <span className="font-semibold text-wa-green-900">100,000 challenges by 2030</span>.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-8 sm:mt-12 px-4">
              <IOSSafeLink
                href="/dev-login"
                prefetch={false}
                className="w-full sm:w-auto px-8 py-4 bg-wa-green-900 text-white rounded-lg font-semibold hover:bg-wa-green-800 transition-all duration-200 shadow-xl hover:shadow-2xl hover:scale-105 text-base sm:text-lg"
              >
                Get Started
              </IOSSafeLink>
              <IOSSafeLink
                href="/dashboard"
                prefetch={false}
                className="w-full sm:w-auto px-8 py-4 border-2 border-wa-green-900 text-wa-green-900 rounded-lg font-semibold hover:bg-wa-green-50 transition-all duration-200 shadow-lg hover:shadow-xl text-base sm:text-lg"
              >
                View Dashboard
              </IOSSafeLink>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 lg:gap-12">
            {/* Feature 1 */}
            <div className="bg-white rounded-xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-wa-green-200">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-wa-green-900 rounded-lg flex items-center justify-center mb-4 sm:mb-6">
                <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">Document Solutions</h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                Create comprehensive case studies that capture your industrial welding challenges and solutions.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white rounded-xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-wa-green-200">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-wa-green-900 rounded-lg flex items-center justify-center mb-4 sm:mb-6">
                <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">Organize Library</h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                Build a searchable library of solutions that your team can access and learn from instantly.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white rounded-xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-wa-green-200">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-wa-green-900 rounded-lg flex items-center justify-center mb-4 sm:mb-6">
                <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">Track Progress</h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                Monitor your journey towards solving 100,000 industrial challenges by 2030.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 sm:py-12 px-4 sm:px-6 lg:px-8 border-t border-gray-200 bg-white/80">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-sm sm:text-base text-gray-600">
            &copy; {new Date().getFullYear()} Welding Alloys. All rights reserved.
          </p>
        </div>
      </footer>
    </main>
  );
}
