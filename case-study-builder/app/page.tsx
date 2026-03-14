import { IOSSafeLink } from '@/components/ios-safe-link';
import { ThemeToggle } from '@/components/theme-toggle';
import Image from 'next/image';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Welding Alloys - Industrial Challenges App',
  description: 'Welcome to Welding Alloys Industrial Challenges App (ICA). Capture, catalogue, and share industrial challenge solutions. Track progress toward solving 10,000 challenges.',
  openGraph: {
    title: 'Welding Alloys - Industrial Challenges App',
    description: 'Capture and share industrial welding solutions',
  },
};

export default function Home() {
  return (
    <main className="min-h-screen bg-white dark:bg-gray-950">
      {/* Header Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-gray-950/95 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <div className="flex items-center gap-3">
              <Image
                src="/welding_alloys_logo.png"
                alt="Welding Alloys Logo"
                width={44}
                height={44}
                className="w-10 h-10 sm:w-11 sm:h-11 object-contain"
              />
              <div className="hidden sm:block">
                <h2 className="text-base font-semibold text-gray-900 dark:text-white leading-tight">Welding Alloys</h2>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-tight">Industrial Challenges App</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <IOSSafeLink
                href="/login"
                prefetch={false}
                className="px-5 py-2 bg-wa-green-900 text-white rounded-lg font-medium hover:bg-wa-green-800 transition-all duration-200 text-sm shadow-sm"
              >
                Sign In
              </IOSSafeLink>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-28 sm:pt-36 pb-20 sm:pb-28 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 bg-gradient-to-b from-wa-green-50/40 via-white to-white dark:from-gray-900 dark:via-gray-950 dark:to-gray-950" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-wa-green-100/20 dark:bg-wa-green-900/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />

        <div className="relative max-w-5xl mx-auto text-center">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <Image
              src="/welding_alloys_logo.png"
              alt="Welding Alloys Logo"
              width={96}
              height={96}
              className="w-20 h-20 sm:w-24 sm:h-24 object-contain"
            />
          </div>

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-wa-green-50 dark:bg-wa-green-950/50 border border-wa-green-200 dark:border-wa-green-800 rounded-full text-sm text-wa-green-800 dark:text-wa-green-300 font-medium mb-6">
            <span className="w-2 h-2 bg-wa-green-500 rounded-full animate-pulse" />
            Enterprise Platform
          </div>

          {/* Title */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white tracking-tight leading-[1.1] mb-5">
            Capture & Share Industrial
            <br />
            <span className="text-wa-green-900 dark:text-wa-green-400">Challenge Solutions</span>
          </h1>

          {/* Description */}
          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed mb-10">
            The central platform for Welding Alloys engineers to document solutions,
            build a knowledge library, and track progress toward
            <span className="font-semibold text-gray-900 dark:text-white"> 10,000 challenges</span>.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <IOSSafeLink
              href="/login"
              prefetch={false}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-wa-green-900 text-white rounded-lg font-semibold hover:bg-wa-green-800 transition-all duration-200 shadow-lg shadow-wa-green-900/20 hover:shadow-xl hover:shadow-wa-green-900/30 text-base"
            >
              Get Started
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </IOSSafeLink>
            <IOSSafeLink
              href="/library"
              prefetch={false}
              className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-400 transition-all duration-200 text-base"
            >
              Browse Library
            </IOSSafeLink>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-y border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-3xl sm:text-4xl font-bold text-wa-green-900">10,000</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Challenge Goal</p>
            </div>
            <div>
              <p className="text-3xl sm:text-4xl font-bold text-wa-green-900">135+</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Features Delivered</p>
            </div>
            <div>
              <p className="text-3xl sm:text-4xl font-bold text-wa-green-900">30+</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Subsidiaries</p>
            </div>
            <div>
              <p className="text-3xl sm:text-4xl font-bold text-wa-green-900">6</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Integrations</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Everything You Need
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              A complete toolkit for capturing industrial welding challenges and building a shared knowledge base.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: 'Document Solutions', desc: 'Create structured case studies with multi-step workflows, welding procedures, and cost analysis.', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
              { title: 'Search & Compare', desc: 'Find solutions instantly with full-text search, filters by industry, and side-by-side case comparison.', icon: 'M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z' },
              { title: 'Track Progress', desc: 'Monitor your BHAG goal with leaderboards, regional analytics, and gamification badges.', icon: 'M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z' },
            ].map((feature) => (
              <div key={feature.title} className="group p-7 rounded-2xl border border-gray-200 dark:border-gray-700 hover:border-wa-green-300 dark:hover:border-wa-green-700 hover:shadow-lg transition-all duration-300 bg-white dark:bg-gray-900">
                <div className="w-11 h-11 bg-wa-green-900 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d={feature.icon} />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-gray-50/70 dark:bg-gray-900/70">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              How It Works
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              From field challenge to shared knowledge in four simple steps.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { step: '01', title: 'Identify', desc: 'Encounter an industrial welding challenge in the field.' },
              { step: '02', title: 'Document', desc: 'Create a case study with photos, specs, and WPS data.' },
              { step: '03', title: 'Review', desc: 'Submit for technical approval by senior engineers.' },
              { step: '04', title: 'Share', desc: 'Approved solutions join the global knowledge library.' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-wa-green-900 text-white text-lg font-bold mb-4">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { title: 'Enterprise Security', desc: 'GDPR compliant, SSO via Google, role-based access control', icon: 'M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z' },
              { title: 'Global Access', desc: 'Multi-language support, offline-capable PWA, mobile-first design', icon: 'M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418' },
              { title: 'AI-Powered', desc: 'Smart suggestions, auto-translation, and image recognition built in', icon: 'M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z' },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-4 p-5 rounded-xl bg-gray-50 dark:bg-gray-900">
                <div className="flex-shrink-0 w-10 h-10 bg-wa-green-100 dark:bg-wa-green-900/30 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-wa-green-700" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                  </svg>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white text-sm">{item.title}</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 sm:py-10 px-4 sm:px-6 lg:px-8 border-t border-gray-100 dark:border-gray-800">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Image src="/welding_alloys_logo.png" alt="WA" width={24} height={24} className="w-6 h-6 object-contain" />
            <span className="text-sm text-gray-500 dark:text-gray-400">Welding Alloys Group</span>
          </div>
          <p className="text-sm text-gray-400">
            &copy; {new Date().getFullYear()} Welding Alloys. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <IOSSafeLink href="/compliance" prefetch={false} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
              Compliance
            </IOSSafeLink>
            <IOSSafeLink href="/compliance/gdpr" prefetch={false} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
              Privacy
            </IOSSafeLink>
          </div>
        </div>
      </footer>
    </main>
  );
}
