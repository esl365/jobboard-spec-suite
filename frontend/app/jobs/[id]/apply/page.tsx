'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth-store';
import Link from 'next/link';

interface Resume {
  id: number;
  title: string;
  isDefault: boolean;
  updatedAt: string;
}

export default function ApplyPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();

  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<number | null>(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const jobId = params.id as string;

  // Redirect if not authenticated or not a job seeker
  useEffect(() => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/jobs/${jobId}/apply`);
      return;
    }

    if (user?.userType !== 'PERSONAL') {
      router.push(`/jobs/${jobId}`);
      return;
    }

    loadResumes();
  }, [isAuthenticated, user]);

  const loadResumes = async () => {
    try {
      // Note: This would need an API endpoint to fetch user's resumes
      // For now, we'll simulate it
      // const data = await apiClient.getMyResumes();
      // setResumes(data);

      // Simulated data - in reality this would come from API
      setResumes([]);
      setLoading(false);
    } catch (err: any) {
      setError('Failed to load resumes');
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedResumeId && resumes.length > 0) {
      setError('Please select a resume');
      return;
    }

    setSubmitting(true);

    try {
      // For MVP, we'll use resumeId = 1 as a placeholder if no resumes exist
      const resumeIdToUse = selectedResumeId || 1;

      await apiClient.applyToJob(
        parseInt(jobId),
        resumeIdToUse,
        coverLetter || undefined
      );

      // Show success message and redirect
      alert('Application submitted successfully!');
      router.push(`/jobs/${jobId}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <div className="mb-6">
          <Link href={`/jobs/${jobId}`} className="text-blue-600 hover:underline text-sm">
            ← Back to job details
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow p-8">
          <h1 className="text-3xl font-bold mb-2">Apply for Position</h1>
          <p className="text-gray-600 mb-6">
            Submit your application for this role
          </p>

          {error && (
            <div className="bg-red-50 text-red-500 p-3 rounded mb-6 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Resume Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Select Resume {resumes.length > 0 && <span className="text-red-500">*</span>}
              </label>

              {resumes.length > 0 ? (
                <div className="space-y-3">
                  {resumes.map((resume) => (
                    <label
                      key={resume.id}
                      className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition ${
                        selectedResumeId === resume.id
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <input
                        type="radio"
                        name="resume"
                        value={resume.id}
                        checked={selectedResumeId === resume.id}
                        onChange={() => setSelectedResumeId(resume.id)}
                        className="mt-1 mr-3"
                      />
                      <div className="flex-1">
                        <div className="font-medium">{resume.title}</div>
                        <div className="text-sm text-gray-500">
                          Updated {new Date(resume.updatedAt).toLocaleDateString()}
                          {resume.isDefault && (
                            <span className="ml-2 text-blue-600">(Default)</span>
                          )}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <p className="text-gray-600 mb-4">
                    You haven't uploaded any resumes yet
                  </p>
                  <p className="text-sm text-gray-500 mb-4">
                    For this MVP, you can submit without a resume
                  </p>
                  <Link
                    href="/profile/resumes"
                    className="text-blue-600 hover:underline text-sm"
                  >
                    Upload a resume →
                  </Link>
                </div>
              )}
            </div>

            {/* Cover Letter */}
            <div>
              <label htmlFor="coverLetter" className="block text-sm font-medium text-gray-700 mb-1">
                Cover Letter <span className="text-gray-500">(Optional)</span>
              </label>
              <textarea
                id="coverLetter"
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                rows={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Tell the employer why you're a great fit for this position..."
              />
              <p className="mt-1 text-xs text-gray-500">
                {coverLetter.length} characters
              </p>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {submitting ? 'Submitting Application...' : 'Submit Application'}
              </button>
              <Link
                href={`/jobs/${jobId}`}
                className="px-6 py-3 border-2 border-gray-300 rounded-md hover:bg-gray-50 text-center"
              >
                Cancel
              </Link>
            </div>

            <p className="text-xs text-gray-500 text-center">
              By submitting, you agree that the employer can view your application
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
