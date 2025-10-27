'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth-store';
import Link from 'next/link';

interface Application {
  id: number;
  status: string;
  appliedAt: string;
  jobseeker?: {
    id: number;
    email: string;
    username?: string;
  };
  resume?: {
    id: number;
    title: string;
  };
  currentStage?: {
    id: number;
    stageName: string;
    stageOrder: number;
  };
  job?: {
    id: number;
    title: string;
    status: string;
    company?: {
      id: number;
      email: string;
      companyProfile?: {
        companyName: string;
      };
    };
  };
}

interface Job {
  id: number;
  title: string;
  description: string;
  employmentType?: string;
  salaryMin?: number;
  salaryMax?: number;
  status: string;
  createdAt: string;
  expiresAt: string;
  _count?: {
    applications: number;
  };
}

export default function Dashboard() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingApplications, setLoadingApplications] = useState(false);
  const [error, setError] = useState('');

  const isCompany = user?.userType === 'COMPANY';
  const isJobSeeker = user?.userType === 'PERSONAL';

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/dashboard');
      return;
    }

    if (isCompany) {
      loadJobs();
      loadApplications();
    } else if (isJobSeeker) {
      loadMyApplications();
    }
  }, [isAuthenticated, user]);

  const loadJobs = async () => {
    try {
      const data = await apiClient.getJobs();
      // Filter jobs by current user (company)
      const myJobs = data.jobs?.filter((job: Job) => job.status !== 'DELETED') || [];
      setJobs(myJobs);
    } catch (err: any) {
      setError('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  const loadApplications = async (jobId?: number) => {
    setLoadingApplications(true);
    try {
      const params = jobId ? { jobId } : {};
      const data = await apiClient.getApplications(params);
      setApplications(data.applications || []);
    } catch (err: any) {
      console.error('Failed to load applications:', err);
    } finally {
      setLoadingApplications(false);
    }
  };

  const loadMyApplications = async () => {
    try {
      const data = await apiClient.getApplications();
      setApplications(data.applications || []);
    } catch (err: any) {
      setError('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const handleViewApplications = (jobId: number) => {
    setSelectedJobId(jobId);
    loadApplications(jobId);
  };

  const handleUpdateStatus = async (applicationId: number, newStatus: string) => {
    try {
      await apiClient.updateApplication(applicationId, { status: newStatus });
      // Reload applications after update
      if (isCompany) {
        loadApplications(selectedJobId || undefined);
      } else {
        loadMyApplications();
      }
      alert('Application status updated successfully');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update application status');
    }
  };

  const handleWithdraw = async (applicationId: number) => {
    if (!confirm('Are you sure you want to withdraw this application?')) {
      return;
    }

    try {
      await apiClient.updateApplication(applicationId, { status: 'WITHDRAWN_BY_USER' });
      loadMyApplications();
      alert('Application withdrawn successfully');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to withdraw application');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'HIRED':
        return 'bg-blue-100 text-blue-800';
      case 'REJECTED_BY_COMPANY':
        return 'bg-red-100 text-red-800';
      case 'WITHDRAWN_BY_USER':
        return 'bg-gray-100 text-gray-600';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading dashboard...</div>
      </div>
    );
  }

  // Job Seeker Dashboard
  if (isJobSeeker) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-5xl mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">My Dashboard</h1>
            <p className="text-gray-600">Track your job applications</p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-500 p-4 rounded mb-6">
              {error}
            </div>
          )}

          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">My Applications</h2>
            </div>

            {applications.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-500 mb-4">You haven't applied to any jobs yet</p>
                <Link
                  href="/jobs"
                  className="text-blue-600 hover:underline"
                >
                  Browse available jobs
                </Link>
              </div>
            ) : (
              <div className="divide-y">
                {applications.map((application) => (
                  <div key={application.id} className="p-6 hover:bg-gray-50">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <Link
                          href={`/jobs/${application.job?.id}`}
                          className="text-lg font-semibold text-blue-600 hover:underline"
                        >
                          {application.job?.title}
                        </Link>
                        {application.job?.company && (
                          <p className="text-sm text-gray-600 mt-1">
                            {application.job.company.companyProfile?.companyName ||
                             application.job.company.email}
                          </p>
                        )}
                        <p className="text-sm text-gray-500 mt-1">
                          Applied {new Date(application.appliedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          application.status
                        )}`}
                      >
                        {application.status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    {application.currentStage && (
                      <div className="mb-3">
                        <span className="text-sm text-gray-600">
                          Current Stage: <span className="font-medium">{application.currentStage.stageName}</span>
                        </span>
                      </div>
                    )}

                    {application.resume && (
                      <div className="mb-3 text-sm text-gray-600">
                        Resume: {application.resume.title}
                      </div>
                    )}

                    {application.status === 'ACTIVE' && (
                      <div className="mt-3 pt-3 border-t">
                        <button
                          onClick={() => handleWithdraw(application.id)}
                          className="text-sm text-red-600 hover:text-red-700"
                        >
                          Withdraw Application
                        </button>
                      </div>
                    )}

                    {application.status === 'HIRED' && (
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-sm text-blue-600 font-medium">
                          Congratulations! You've been hired for this position.
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Company Dashboard
  if (isCompany) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Company Dashboard</h1>
            <p className="text-gray-600">Manage your job postings and applications</p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-500 p-4 rounded mb-6">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Jobs List */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">My Job Postings</h2>
                <Link
                  href="/jobs/new"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                >
                  + New Job
                </Link>
              </div>

              {jobs.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No job postings yet</p>
                  <Link
                    href="/jobs/new"
                    className="text-blue-600 hover:underline"
                  >
                    Create your first job posting
                  </Link>
                </div>
              ) : (
                <div className="space-y-4 max-h-[600px] overflow-y-auto">
                  {jobs.map((job) => (
                    <div
                      key={job.id}
                      className={`border rounded-lg p-4 cursor-pointer transition ${
                        selectedJobId === job.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleViewApplications(job.id)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-lg">{job.title}</h3>
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            job.status === 'ACTIVE'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {job.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {job.description}
                      </p>
                      <div className="flex justify-between items-center text-xs text-gray-500">
                        <span>Posted {new Date(job.createdAt).toLocaleDateString()}</span>
                        <span className="font-medium text-blue-600">
                          {job._count?.applications || 0} applications
                        </span>
                      </div>
                      <div className="mt-2 flex gap-2">
                        <Link
                          href={`/jobs/${job.id}`}
                          className="text-sm text-blue-600 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          View
                        </Link>
                        <Link
                          href={`/jobs/${job.id}/edit`}
                          className="text-sm text-blue-600 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Edit
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Applications List */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-6">
                {selectedJobId
                  ? `Applications for ${jobs.find((j) => j.id === selectedJobId)?.title}`
                  : 'All Applications'}
              </h2>

              {loadingApplications ? (
                <div className="text-center py-8 text-gray-500">Loading applications...</div>
              ) : applications.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">
                    {selectedJobId
                      ? 'No applications received yet for this job'
                      : 'No applications received yet'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[600px] overflow-y-auto">
                  {applications.map((application) => (
                    <div
                      key={application.id}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-medium">
                            {application.jobseeker?.username || application.jobseeker?.email}
                          </p>
                          <p className="text-sm text-gray-600">
                            Applied {new Date(application.appliedAt).toLocaleDateString()}
                          </p>
                          {!selectedJobId && application.job && (
                            <p className="text-sm text-gray-500 mt-1">
                              Job: {application.job.title}
                            </p>
                          )}
                        </div>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                            application.status
                          )}`}
                        >
                          {application.status.replace(/_/g, ' ')}
                        </span>
                      </div>

                      {application.resume && (
                        <div className="text-sm text-gray-600 mb-3">
                          Resume: {application.resume.title}
                        </div>
                      )}

                      {application.currentStage && (
                        <div className="text-sm text-gray-600 mb-3">
                          Stage: {application.currentStage.stageName}
                        </div>
                      )}

                      {application.status === 'ACTIVE' && (
                        <div className="flex gap-2 mt-3 pt-3 border-t">
                          <button
                            onClick={() => handleUpdateStatus(application.id, 'HIRED')}
                            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                          >
                            Hire
                          </button>
                          <button
                            onClick={() =>
                              handleUpdateStatus(application.id, 'REJECTED_BY_COMPANY')
                            }
                            className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Fallback for other user types
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Dashboard</h2>
        <p className="text-gray-600">Welcome to your dashboard</p>
      </div>
    </div>
  );
}
