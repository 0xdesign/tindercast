'use client';

import { useEffect, useState } from 'react';

export default function Home() {
  const [isChecking, setIsChecking] = useState(true);
  
  // Simple redirect logic
  useEffect(() => {
    // Only run once
    if (isChecking) {
      setIsChecking(false);
      
      try {
        // Check if user is already logged in
        const storedUser = localStorage.getItem('farcasterUser');
        
        // Use setTimeout to ensure this executes after the component is fully mounted
        setTimeout(() => {
          // Use window.location for a full page navigation
          if (storedUser) {
            window.location.href = '/app';
          } else {
            window.location.href = '/login';
          }
        }, 300);
      } catch (e) {
        // In case of any error, default to login page
        window.location.href = '/login';
      }
    }
  }, [isChecking]);
  
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md p-6 bg-white rounded-xl shadow-lg">
        <h1 className="text-3xl font-bold text-center mb-8">Tindercast</h1>
        <p className="text-gray-600 text-center">
          Redirecting...
        </p>
      </div>
    </div>
  );
}
