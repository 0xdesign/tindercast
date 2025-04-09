'use client';

import { useEffect, useState } from 'react';
import ConnectButton from '@/components/auth/ConnectButton';

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(true);

  // Check for authentication and handle redirect
  useEffect(() => {
    const checkAuth = () => {
      // Only access localStorage once per check
      const storedUser = localStorage.getItem('farcasterUser');
      
      if (storedUser) {
        // Use window.location for a full page navigation
        window.location.href = '/app';
        return true;
      }
      return false;
    };

    // Check on initial load
    if (!checkAuth()) {
      setIsLoading(false);
    }
    
    // Set up interval to check auth status (will be cleared on unmount)
    const intervalId = setInterval(() => {
      checkAuth();
    }, 500);
    
    return () => clearInterval(intervalId);
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="w-full max-w-md animate-pulse">
          <div className="mx-auto h-96 w-full max-w-md rounded-lg bg-gray-200"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-xl">
        {/* Card with gray placeholder area */}
        <div className="flex h-96 flex-col items-center justify-center bg-gray-200 p-4">
          <h1 className="mb-2 text-2xl font-bold text-gray-800">Tindercast</h1>
          <p className="text-center text-gray-600">Sign in to get started</p>
        </div>
        
        {/* Connect button at bottom */}
        <div className="p-4">
          <ConnectButton />
        </div>
      </div>
    </div>
  );
} 