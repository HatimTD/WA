import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="max-w-4xl text-center space-y-8">
        <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
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
          <Link
            href="/login"
            className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/dashboard"
            className="px-8 py-3 border-2 border-blue-600 text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
          >
            View Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
