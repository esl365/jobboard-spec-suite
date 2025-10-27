'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth-store';
import Link from 'next/link';

export default function JobsPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated, user, logout } = useAuthStore();

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      const data = await apiClient.getJobs();
      setJobs(data.data || []);
    } catch (error) {
      console.error('Failed to load jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading jobs...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Job Listings</h1>
            <p className="text-sm text-gray-600 mt-1">
              {jobs.length} {jobs.length === 1 ? 'job' : 'jobs'} available
            </p>
          </div>
          <div className="flex gap-4 items-center">
            {isAuthenticated ? (
              <>
                <span className="text-sm text-gray-600">
                  {user?.email} ({user?.userType})
                </span>
                <button
                  onClick={logout}
                  className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4">
        {jobs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No jobs available yet.</p>
            <p className="text-gray-400 text-sm mt-2">Check back soon!</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {jobs.map((job: any) => (
              <div key={job.id} className="bg-white p-6 rounded-lg shadow hover:shadow-md transition">
                <h3 className="text-xl font-semibold mb-2">{job.title}</h3>
                <p className="text-gray-600 mb-2">
                  {job.company?.companyName || job.company?.email}
                </p>
                <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                  {job.description}
                </p>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm text-gray-500">{job.employmentType}</span>
                  {job.salaryMin && job.salaryMax && (
                    <span className="text-sm font-medium text-green-600">
                      ₩{job.salaryMin?.toLocaleString()} - ₩{job.salaryMax?.toLocaleString()}
                    </span>
                  )}
                </div>
                <button className="mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition">
                  View Details
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
