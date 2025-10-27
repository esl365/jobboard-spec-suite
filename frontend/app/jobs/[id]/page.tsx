'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth-store';
import Link from 'next/link';

interface Job {
  id: number;
  title: string;
  description: string;
  employmentType?: string;
  salaryType?: string;
  salaryMin?: number;
  salaryMax?: number;
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

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [applying, setApplying] = useState(false);

  const jobId = params.id as string;

  useEffect(() => {
    loadJob();
  }, [jobId]);

  const loadJob = async () => {
    try {
      const data = await apiClient.getJob(parseInt(jobId));
      setJob(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load job');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/jobs/${jobId}`);
      return;
    }

    // Navigate to application page
    router.push(`/jobs/${jobId}/apply`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading job details...</div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4 text-red-600">Error</h2>
          <p className="text-gray-600 mb-4">{error || 'Job not found'}</p>
          <Link href="/jobs" className="text-blue-600 hover:underline">
            ← Back to jobs
          </Link>
        </div>
      </div>
    );
  }

  const isOwner = user?.id === job.company?.id;
  const canApply = isAuthenticated && user?.userType === 'PERSONAL' && !isOwner;
  const isExpired = new Date(job.expiresAt) < new Date();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Back Link */}
        <div className="mb-6">
          <Link href="/jobs" className="text-blue-600 hover:underline text-sm">
            ← Back to all jobs
          </Link>
        </div>

        {/* Job Card */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Header */}
          <div className="border-b pb-6 mb-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-3xl font-bold mb-2">{job.title}</h1>
                <p className="text-lg text-gray-600">
                  {job.company?.companyProfile?.companyName || job.company?.email}
                </p>
              </div>
              {job.status === 'ACTIVE' && !isExpired && (
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                  Active
                </span>
              )}
              {isExpired && (
                <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-medium">
                  Expired
                </span>
              )}
            </div>

            {/* Meta Info */}
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              {job.employmentType && (
                <div className="flex items-center gap-1">
                  <span className="font-medium">Type:</span>
                  <span>{job.employmentType}</span>
                </div>
              )}
              {job.salaryMin && job.salaryMax && (
                <div className="flex items-center gap-1">
                  <span className="font-medium">Salary:</span>
                  <span>
                    ₩{job.salaryMin.toLocaleString()} - ₩{job.salaryMax.toLocaleString()}
                    {job.salaryType && ` (${job.salaryType})`}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <span className="font-medium">Posted:</span>
                <span>{new Date(job.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="font-medium">Deadline:</span>
                <span className={isExpired ? 'text-red-600' : ''}>
                  {new Date(job.expiresAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Job Description</h2>
            <div className="prose max-w-none">
              <p className="whitespace-pre-wrap text-gray-700">{job.description}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-6 border-t">
            {canApply && !isExpired && (
              <button
                onClick={handleApply}
                disabled={applying}
                className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 font-medium"
              >
                Apply for this Position
              </button>
            )}

            {!isAuthenticated && !isExpired && (
              <button
                onClick={handleApply}
                className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 font-medium"
              >
                Sign in to Apply
              </button>
            )}

            {isExpired && (
              <div className="flex-1 bg-gray-100 text-gray-600 py-3 px-6 rounded-md text-center font-medium">
                This position has expired
              </div>
            )}

            {isOwner && (
              <>
                <Link
                  href={`/jobs/${jobId}/edit`}
                  className="px-6 py-3 border-2 border-blue-600 text-blue-600 rounded-md hover:bg-blue-50 text-center"
                >
                  Edit
                </Link>
                <button
                  className="px-6 py-3 border-2 border-red-600 text-red-600 rounded-md hover:bg-red-50"
                >
                  Delete
                </button>
              </>
            )}
          </div>

          {user?.userType === 'COMPANY' && !isOwner && (
            <p className="mt-4 text-sm text-gray-500 text-center">
              Only job seekers can apply to positions
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
