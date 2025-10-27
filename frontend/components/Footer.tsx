import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1">
            <h3 className="text-lg font-bold text-blue-600 mb-4">JobBoard</h3>
            <p className="text-sm text-gray-600">
              Fast, transparent, and affordable job matching platform for everyone.
            </p>
          </div>

          {/* For Job Seekers */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-4">For Job Seekers</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <Link href="/jobs" className="hover:text-blue-600 transition">
                  Browse Jobs
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-blue-600 transition">
                  Create Account
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-blue-600 transition">
                  My Applications
                </Link>
              </li>
            </ul>
          </div>

          {/* For Companies */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-4">For Companies</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <Link href="/jobs/new" className="hover:text-blue-600 transition">
                  Post a Job
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-blue-600 transition">
                  Manage Jobs
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-blue-600 transition">
                  Register Company
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-4">Resources</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <a href="#" className="hover:text-blue-600 transition">
                  About Us
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-blue-600 transition">
                  Help Center
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-blue-600 transition">
                  Contact
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t mt-8 pt-8 flex flex-col sm:flex-row justify-between items-center">
          <p className="text-sm text-gray-500">
            &copy; {currentYear} JobBoard. All rights reserved.
          </p>
          <div className="flex gap-6 mt-4 sm:mt-0">
            <a href="#" className="text-sm text-gray-500 hover:text-gray-700">
              Privacy Policy
            </a>
            <a href="#" className="text-sm text-gray-500 hover:text-gray-700">
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
