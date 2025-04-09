'use client';

import { useState, useEffect } from 'react';
import { useProfile } from '@farcaster/auth-kit';

export default function UserHeader() {
  const { isAuthenticated, profile } = useProfile();
  const [userData, setUserData] = useState<{
    username: string;
    fid: number;
    displayName?: string;
    imageUrl?: string;
  } | null>(null);
  const [imageError, setImageError] = useState(false);

  // Get user data from localStorage when component mounts
  useEffect(() => {
    const storedUser = localStorage.getItem('farcasterUser');
    if (storedUser) {
      try {
        setUserData(JSON.parse(storedUser));
      } catch (e) {
        console.error('Error parsing stored user data:', e);
      }
    } else if (isAuthenticated && profile) {
      // If authenticated but no local storage, set from profile
      setUserData({
        username: profile.username || '',
        fid: profile.fid || 0,
        displayName: profile.displayName || profile.username || ''
      });
    }
  }, [isAuthenticated, profile]);

  // Handle user disconnect
  const handleDisconnect = () => {
    // Remove user data from localStorage
    localStorage.removeItem('farcasterUser');
    setUserData(null);
    // Redirect to login page - using window.location for a clean navigation
    window.location.href = '/login';
  };

  if (!userData) {
    return null;
  }

  return (
    <div className="absolute right-4 top-4 flex items-center gap-2 rounded-full bg-white px-2 py-1 shadow-md">
      {userData.imageUrl && !imageError ? (
        <div className="h-8 w-8 overflow-hidden rounded-full">
          <img
            src={userData.imageUrl}
            alt={userData.username}
            className="h-full w-full object-cover"
            onError={() => setImageError(true)}
          />
        </div>
      ) : (
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200">
          {userData.username.charAt(0).toUpperCase()}
        </div>
      )}
      <span className="text-sm font-medium text-gray-800">{userData.username}</span>
      <button
        onClick={handleDisconnect}
        className="text-xs text-gray-500 hover:text-gray-700"
      >
        Disconnect
      </button>
    </div>
  );
} 