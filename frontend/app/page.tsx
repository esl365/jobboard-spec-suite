import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold mb-8 text-center">
          Job Board Platform
        </h1>
        <p className="text-xl mb-8 text-center text-gray-600">
          Fast, transparent, and affordable job matching
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link
            href="/register"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
          >
            Get Started
          </Link>
          <Link
            href="/login"
            className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
          >
            Sign In
          </Link>
          <Link
            href="/jobs"
            className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:border-gray-400 transition"
          >
            Browse Jobs
          </Link>
        </div>
      </div>
    </main>
  );
}
