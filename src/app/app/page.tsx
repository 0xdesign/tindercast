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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check authentication
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
    
    // Set authenticated state
    setIsAuthenticated(true);
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-16 w-16 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gray-50 p-4">
      {/* User header in top-right corner */}
      <UserHeader />

      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-gray-800">TinderCast</h1>
          <p className="text-sm text-gray-600">
            Discover and connect with users who share your onchain interests
          </p>
        </div>
        
        {/* Use CardStack with suggested follows */}
        <CardStack useSuggestedFollows={true} />
      </div>
    </div>
  );
} 