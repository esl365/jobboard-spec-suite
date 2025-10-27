'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { getRelativeTime, formatDeadline } from '@/lib/date-utils';
import Link from 'next/link';
import Image from 'next/image';
import BookmarkButton from '@/components/BookmarkButton';
import ShareButton from '@/components/ShareButton';

interface Job {
  id: number;
  title: string;
  description: string;
  employmentType?: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryType?: string;
  location?: string;
  remote?: boolean;
  skills?: string[];
  status: string;
  createdAt: string;
  expiresAt: string;
  company?: {
    id: number;
    email: string;
    companyName?: string;
    logoUrl?: string;
  };
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');

  // Filter states
  const [filters, setFilters] = useState({
    location: '',
    remote: undefined as boolean | undefined,
    employmentType: '',
  });

  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadJobs();
  }, [searchQuery, filters]);

  const loadJobs = async () => {
    setLoading(true);
    try {
      const params: any = {};

      if (searchQuery) params.search = searchQuery;
      if (filters.location) params.location = filters.location;
      if (filters.remote !== undefined) params.remote = filters.remote;
      if (filters.employmentType) params.employmentType = filters.employmentType;

      const data = await apiClient.getJobs(params);
      setJobs(data.data || []);
    } catch (err: any) {
      setError('Failed to load jobs');
      console.error('Failed to load jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchInput);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearchQuery('');
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleClearFilters = () => {
    setFilters({
      location: '',
      remote: undefined,
      employmentType: '',
    });
  };

  const hasActiveFilters = filters.location || filters.remote !== undefined || filters.employmentType;

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

        {/* Search Form */}
        <form onSubmit={handleSearch} className="mb-6">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search jobs by title, company, or description..."
                className="w-full px-4 py-3 pl-11 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Search
            </button>
            {searchQuery && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="px-4 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
          {searchQuery && (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-sm text-gray-600">
                Searching for: <span className="font-semibold text-gray-900">"{searchQuery}"</span>
              </span>
            </div>
          )}
        </form>

        {/* Filter Toggle Button */}
        <div className="mb-4 flex items-center justify-between">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              />
            </svg>
            <span className="font-medium">Filters</span>
            {hasActiveFilters && (
              <span className="ml-1 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                Active
              </span>
            )}
          </button>

          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Clear all filters
            </button>
          )}
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="mb-6 bg-white border border-gray-200 rounded-lg p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Location Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  value={filters.location}
                  onChange={(e) => handleFilterChange('location', e.target.value)}
                  placeholder="e.g., Seoul, Busan"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>

              {/* Remote Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Work Type
                </label>
                <select
                  value={filters.remote === undefined ? '' : filters.remote ? 'remote' : 'onsite'}
                  onChange={(e) => {
                    const value = e.target.value;
                    handleFilterChange('remote', value === '' ? undefined : value === 'remote');
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="">All</option>
                  <option value="remote">Remote</option>
                  <option value="onsite">On-site</option>
                </select>
              </div>

              {/* Employment Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Employment Type
                </label>
                <select
                  value={filters.employmentType}
                  onChange={(e) => handleFilterChange('employmentType', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="">All Types</option>
                  <option value="FULL_TIME">Full-time</option>
                  <option value="PART_TIME">Part-time</option>
                  <option value="CONTRACT">Contract</option>
                  <option value="INTERNSHIP">Internship</option>
                  <option value="FREELANCE">Freelance</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Jobs List */}
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
          <div className="space-y-4">
            {jobs.map((job) => {
              const isExpired = new Date(job.expiresAt) < new Date();
              const companyName = job.company?.companyName || job.company?.email || 'Unknown Company';
              const deadline = formatDeadline(job.expiresAt);

              return (
                <div
                  key={job.id}
                  className="relative block bg-white rounded-lg border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all duration-200"
                >
                  {/* Action Buttons - Absolute positioned */}
                  <div className="absolute top-4 right-4 z-10 flex gap-2">
                    <ShareButton jobId={job.id} jobTitle={job.title} size="md" />
                    <BookmarkButton jobId={job.id} size="md" />
                  </div>

                  <Link href={`/jobs/${job.id}`} className="block">
                    <div className="p-6 pr-16">
                      <div className="flex gap-4">
                        {/* Company Logo */}
                        <div className="flex-shrink-0">
                        {job.company?.logoUrl ? (
                          <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                            <Image
                              src={job.company.logoUrl}
                              alt={`${companyName} logo`}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                            <span className="text-white text-xl font-bold">
                              {companyName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Job Info */}
                      <div className="flex-1 min-w-0">
                        {/* Title and Company */}
                        <h3 className="text-xl font-bold text-gray-900 mb-1 hover:text-blue-600 transition-colors">
                          {job.title}
                        </h3>
                        <p className="text-gray-600 mb-3">{companyName}</p>

                        {/* Location and Remote */}
                        <div className="flex flex-wrap items-center gap-3 mb-3">
                          {job.location && (
                            <span className="inline-flex items-center text-sm text-gray-600">
                              <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              {job.location}
                            </span>
                          )}
                          {job.remote && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Remote OK
                            </span>
                          )}
                        </div>

                        {/* Salary and Employment Type */}
                        <div className="flex flex-wrap items-center gap-4 mb-3">
                          {job.salaryMin && job.salaryMax && (
                            <span className="inline-flex items-center text-sm font-semibold text-green-600">
                              <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              ₩{job.salaryMin.toLocaleString()} - ₩{job.salaryMax.toLocaleString()}
                              {job.salaryType && <span className="text-gray-500 ml-1">/ {job.salaryType.toLowerCase()}</span>}
                            </span>
                          )}
                          {job.employmentType && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {job.employmentType}
                            </span>
                          )}
                        </div>

                        {/* Skills */}
                        {job.skills && job.skills.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-3">
                            {job.skills.slice(0, 5).map((skill, index) => (
                              <span
                                key={index}
                                className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded border border-gray-200"
                              >
                                {skill}
                              </span>
                            ))}
                            {job.skills.length > 5 && (
                              <span className="inline-block px-2 py-1 text-gray-500 text-xs">
                                +{job.skills.length - 5} more
                              </span>
                            )}
                          </div>
                        )}

                        {/* Footer */}
                        <div className="flex items-center justify-between text-sm text-gray-500 pt-3 border-t border-gray-100">
                          <span>{getRelativeTime(job.createdAt)}</span>
                          <div className="flex items-center gap-3">
                            {isExpired ? (
                              <span className="px-2 py-1 bg-gray-200 text-gray-600 rounded text-xs font-medium">
                                Expired
                              </span>
                            ) : deadline.startsWith('D-') && parseInt(deadline.split('-')[1]) <= 7 ? (
                              <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs font-medium">
                                {deadline} (Closing Soon)
                              </span>
                            ) : (
                              <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                                {deadline}
                              </span>
                            )}
                          </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
