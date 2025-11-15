import { IOSSafeLink } from '@/components/ios-safe-link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Home',
  description: 'Welcome to Welding Alloys Case Study Builder. Capture, catalog, and share industrial challenge solutions. Track progress toward solving 100,000 challenges by 2030.',
  openGraph: {
    title: 'Case Study Builder - Home',
    description: 'Capture and share industrial welding solutions',
  },
};

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gradient-to-br from-wa-green-50 to-purple-50">
      <div className="max-w-4xl text-center space-y-8">
        <h1 className="text-6xl font-bold bg-gradient-to-r from-wa-green-600 to-purple-600 bg-clip-text text-transparent">
          Case Study Builder
        </h1>
        <p className="text-2xl text-gray-600">
          Welding Alloys Internal Platform
        </p>
        <p className="text-lg text-gray-500 max-w-2xl mx-auto">
          Capture, catalog, and share industrial challenge solutions.
          Track our progress toward solving 100,000 challenges by 2030.
        </p>
        <div className="flex gap-4 justify-center mt-8">
          <IOSSafeLink
            href="/dev-login"
            prefetch={false}
            className="px-8 py-3 bg-wa-green-600 text-white rounded-lg font-semibold hover:bg-wa-green-700 transition-colors inline-block"
          >
            Sign In
          </IOSSafeLink>
          <IOSSafeLink
            href="/dashboard"
            prefetch={false}
            className="px-8 py-3 border-2 border-wa-green-600 text-wa-green-600 rounded-lg font-semibold hover:bg-wa-green-50 transition-colors inline-block"
          >
            View Dashboard
          </IOSSafeLink>
        </div>
      </div>
    </main>
  );
}
