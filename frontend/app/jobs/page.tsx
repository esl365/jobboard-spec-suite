'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import Link from 'next/link';

interface Job {
  id: number;
  title: string;
  description: string;
  employmentType?: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryType?: string;
  status: string;
  createdAt: string;
  expiresAt: string;
  company?: {
    id: number;
    email: string;
    companyProfile?: {
      companyName: string;
    };
  };
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      const data = await apiClient.getJobs();
      setJobs(data.jobs || []);
    } catch (err: any) {
      setError('Failed to load jobs');
      console.error('Failed to load jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading jobs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Browse Jobs</h1>
          <p className="text-gray-600">
            {jobs.length === 0
              ? 'No active job postings at the moment'
              : `${jobs.length} ${jobs.length === 1 ? 'position' : 'positions'} available`}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Jobs Grid */}
        {jobs.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs available</h3>
            <p className="text-gray-500 mb-6">
              Be the first to know when new positions are posted
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {jobs.map((job) => {
              const isExpired = new Date(job.expiresAt) < new Date();
              const companyName =
                job.company?.companyProfile?.companyName || job.company?.email || 'Unknown Company';

              return (
                <Link
                  key={job.id}
                  href={`/jobs/${job.id}`}
                  className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow duration-200 overflow-hidden flex flex-col"
                >
                  <div className="p-6 flex-1">
                    {/* Title */}
                    <h3 className="text-xl font-semibold text-gray-900 mb-2 hover:text-blue-600 transition-colors">
                      {job.title}
                    </h3>

                    {/* Company */}
                    <p className="text-gray-600 text-sm mb-3">{companyName}</p>

                    {/* Description */}
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                      {job.description}
                    </p>

                    {/* Job Details */}
                    <div className="space-y-2 mb-4">
                      {job.employmentType && (
                        <div className="flex items-center text-sm text-gray-500">
                          <svg
                            className="w-4 h-4 mr-2"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          {job.employmentType}
                        </div>
                      )}

                      {job.salaryMin && job.salaryMax && (
                        <div className="flex items-center text-sm font-medium text-green-600">
                          <svg
                            className="w-4 h-4 mr-2"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          ₩{job.salaryMin.toLocaleString()} - ₩{job.salaryMax.toLocaleString()}
                          {job.salaryType && ` (${job.salaryType})`}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="px-6 py-4 bg-gray-50 border-t flex justify-between items-center">
                    <span className="text-xs text-gray-500">
                      Posted {new Date(job.createdAt).toLocaleDateString()}
                    </span>
                    {isExpired ? (
                      <span className="px-2 py-1 bg-gray-200 text-gray-600 rounded text-xs font-medium">
                        Expired
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                        Active
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
