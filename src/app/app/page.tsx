'use client';

import { useEffect, useState } from 'react';
import UserHeader from '@/components/auth/UserHeader';
import CardStack from '@/components/cards/CardStack';

// Describe the profile type
interface Profile {
  fid: number;
  username: string;
  displayName: string;
  description: string;
  imageUrl: string;
  custodyAddress?: string;
  connectedAddresses?: string[];
}

export default function AppPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Check authentication and fetch following profiles
  useEffect(() => {
    const checkAuth = () => {
      const storedUser = localStorage.getItem('farcasterUser');
      if (!storedUser) {
        // If not authenticated, redirect to login using full page navigation
        window.location.href = '/login';
        return false;
      }
      return JSON.parse(storedUser);
    };

    // Initial auth check
    const userData = checkAuth();
    if (!userData) return;
    
    // Fetch following profiles
    fetchFollowingProfiles(userData.fid);
    
    // No need for redirecting state or router
  }, []);

  // Fetch following profiles from API
  const fetchFollowingProfiles = async (fid: number) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/following', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fid })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch profiles');
      }
      
      const data = await response.json();
      setProfiles(data.following || []);
    } catch (err) {
      console.error('Error fetching following profiles:', err);
      setError(err instanceof Error ? err.message : 'Failed to load profiles');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gray-50 p-4">
      {/* User header in top-right corner */}
      <UserHeader />

      <div className="w-full max-w-md">
        {isLoading ? (
          <div className="flex h-[500px] w-full items-center justify-center">
            <div className="h-16 w-16 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="rounded-lg bg-red-50 p-6 text-center">
            <h3 className="text-lg font-medium text-red-800">{error}</h3>
            <button 
              onClick={() => {
                const userData = JSON.parse(localStorage.getItem('farcasterUser') || '{}');
                fetchFollowingProfiles(userData.fid);
              }}
              className="mt-4 rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
            >
              Try Again
            </button>
          </div>
        ) : profiles.length === 0 ? (
          <div className="rounded-lg bg-white p-6 text-center shadow-lg">
            <h3 className="text-lg font-medium">No profiles found</h3>
            <p className="mt-2 text-gray-500">Try following more people on Farcaster</p>
          </div>
        ) : (
          <CardStack profiles={profiles} />
        )}
      </div>
    </div>
  );
} 