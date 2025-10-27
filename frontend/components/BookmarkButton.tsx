'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth-store';

interface BookmarkButtonProps {
  jobId: number;
  initialBookmarked?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export default function BookmarkButton({
  jobId,
  initialBookmarked = false,
  size = 'md',
  showLabel = false,
}: BookmarkButtonProps) {
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated } = useAuthStore();

  // Check bookmark status on mount
  useEffect(() => {
    if (isAuthenticated) {
      checkBookmarkStatus();
    }
  }, [jobId, isAuthenticated]);

  const checkBookmarkStatus = async () => {
    try {
      const data = await apiClient.checkBookmark(jobId);
      setBookmarked(data.bookmarked);
    } catch (error) {
      console.error('Failed to check bookmark status:', error);
    }
  };

  const toggleBookmark = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation if inside a Link
    e.stopPropagation();

    if (!isAuthenticated) {
      // Redirect to login
      window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
      return;
    }

    setLoading(true);
    try {
      const data = await apiClient.toggleBookmark(jobId);
      setBookmarked(data.bookmarked);
    } catch (error) {
      console.error('Failed to toggle bookmark:', error);
    } finally {
      setLoading(false);
    }
  };

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  const iconSizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <button
      onClick={toggleBookmark}
      disabled={loading}
      className={`${sizeClasses[size]} flex items-center justify-center rounded-full transition-all duration-200 ${
        bookmarked
          ? 'bg-red-50 text-red-600 hover:bg-red-100'
          : 'bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600'
      } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
      aria-label={bookmarked ? 'Remove from bookmarks' : 'Add to bookmarks'}
      title={bookmarked ? 'Remove from bookmarks' : 'Add to bookmarks'}
    >
      <svg
        className={iconSizeClasses[size]}
        fill={bookmarked ? 'currentColor' : 'none'}
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
      {showLabel && (
        <span className="ml-2 text-sm font-medium">
          {bookmarked ? 'Saved' : 'Save'}
        </span>
      )}
    </button>
  );
}
