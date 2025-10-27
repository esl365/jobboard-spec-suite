'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth-store';
import Link from 'next/link';
import Head from 'next/head';
import BookmarkButton from '@/components/BookmarkButton';
import ShareButton from '@/components/ShareButton';

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
  location?: string;
  remote?: boolean;
  skills?: string[];
  company?: {
    id: number;
    email: string;
    companyProfile?: {
      companyName: string;
      logoUrl?: string;
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

  // Update meta tags for SEO
  useEffect(() => {
    if (!job) return;

    const companyName = job.company?.companyProfile?.companyName || job.company?.email || 'Unknown Company';
    const title = `${job.title} at ${companyName} | Job Board`;
    const description = job.description.slice(0, 155) + (job.description.length > 155 ? '...' : '');
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const imageUrl = job.company?.companyProfile?.logoUrl || '';

    // Update title
    document.title = title;

    // Update or create meta tags
    const updateMetaTag = (name: string, content: string, property = false) => {
      const attribute = property ? 'property' : 'name';
      let element = document.querySelector(`meta[${attribute}="${name}"]`) as HTMLMetaElement;

      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, name);
        document.head.appendChild(element);
      }

      element.content = content;
    };

    // Basic meta tags
    updateMetaTag('description', description);

    // Open Graph tags
    updateMetaTag('og:title', title, true);
    updateMetaTag('og:description', description, true);
    updateMetaTag('og:type', 'website', true);
    updateMetaTag('og:url', url, true);
    if (imageUrl) {
      updateMetaTag('og:image', imageUrl, true);
    }

    // Twitter Card tags
    updateMetaTag('twitter:card', 'summary');
    updateMetaTag('twitter:title', title);
    updateMetaTag('twitter:description', description);
    if (imageUrl) {
      updateMetaTag('twitter:image', imageUrl);
    }

    // Cleanup function to reset title on unmount
    return () => {
      document.title = 'Job Board';
    };
  }, [job]);

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

  // Generate JobPosting Schema.org structured data
  const generateJobPostingSchema = () => {
    const companyName = job.company?.companyProfile?.companyName || job.company?.email || 'Unknown Company';
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'JobPosting',
      title: job.title,
      description: job.description,
      datePosted: job.createdAt,
      validThrough: job.expiresAt,
      employmentType: job.employmentType || 'FULL_TIME',
      hiringOrganization: {
        '@type': 'Organization',
        name: companyName,
        ...(job.company?.companyProfile?.logoUrl && {
          logo: job.company.companyProfile.logoUrl.startsWith('http')
            ? job.company.companyProfile.logoUrl
            : `${baseUrl}${job.company.companyProfile.logoUrl}`
        })
      },
      jobLocation: job.location ? {
        '@type': 'Place',
        address: {
          '@type': 'PostalAddress',
          addressLocality: job.location
        }
      } : undefined,
      ...(job.salaryMin && job.salaryMax && {
        baseSalary: {
          '@type': 'MonetaryAmount',
          currency: 'KRW',
          value: {
            '@type': 'QuantitativeValue',
            minValue: job.salaryMin,
            maxValue: job.salaryMax,
            unitText: job.salaryType || 'YEAR'
          }
        }
      }),
      ...(job.skills && job.skills.length > 0 && {
        skills: job.skills.join(', ')
      }),
      ...(job.remote && {
        jobLocationType: 'TELECOMMUTE'
      })
    };

    return schema;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      {/* SEO: JobPosting Schema.org structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(generateJobPostingSchema())
        }}
      />

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
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2">{job.title}</h1>
                <p className="text-lg text-gray-600">
                  {job.company?.companyProfile?.companyName || job.company?.email}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <ShareButton jobId={job.id} jobTitle={job.title} size="lg" />
                {!isOwner && <BookmarkButton jobId={job.id} size="lg" />}
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
            </div>

            {/* Meta Info */}
            <div className="space-y-3">
              <div className="flex flex-wrap gap-4 text-sm">
                {job.employmentType && (
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span className="text-gray-700 font-medium">{job.employmentType}</span>
                  </div>
                )}

                {job.location && (
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-gray-700">{job.location}</span>
                  </div>
                )}

                {job.remote && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-full">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    <span className="font-medium">Remote OK</span>
                  </div>
                )}
              </div>

              {job.salaryMin && job.salaryMax && (
                <div className="flex items-center gap-2 text-lg">
                  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-semibold text-gray-900">
                    ₩{job.salaryMin.toLocaleString()} - ₩{job.salaryMax.toLocaleString()}
                  </span>
                  {job.salaryType && (
                    <span className="text-sm text-gray-500">/ {job.salaryType}</span>
                  )}
                </div>
              )}

              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>Posted {new Date(job.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className={isExpired ? 'text-red-600 font-medium' : ''}>
                    Deadline: {new Date(job.expiresAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Skills */}
              {job.skills && job.skills.length > 0 && (
                <div className="pt-2">
                  <div className="flex flex-wrap gap-2">
                    {job.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-50 text-blue-700 text-sm font-medium rounded-full"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
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
