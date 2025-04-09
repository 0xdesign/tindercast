'use client';

import { useState, useRef, useCallback } from 'react';
import { SignInButton, useProfile } from '@farcaster/auth-kit';

// Don't use router in this component - let parent handle redirects
export default function ConnectButton() {
  const { isAuthenticated, profile } = useProfile();
  const [isLoading, setIsLoading] = useState(false);
  const signInButtonRef = useRef<HTMLDivElement>(null);
  
  // Only handle click on button
  const handleConnectClick = useCallback(() => {
    if (!isAuthenticated && !isLoading) {
      setIsLoading(true);
      
      // Programmatically click the SignInButton
      if (signInButtonRef.current) {
        const signInButton = signInButtonRef.current.querySelector('button');
        if (signInButton) {
          signInButton.click();
        }
      }
    }
  }, [isAuthenticated, isLoading]);
  
  // On success, just clear loading state and persist user data
  const handleSuccess = useCallback(() => {
    setIsLoading(false);
    
    // Store in localStorage for persistence if authenticated
    if (isAuthenticated && profile) {
      localStorage.setItem('farcasterUser', JSON.stringify({
        username: profile.username,
        fid: profile.fid,
        displayName: profile.displayName || profile.username,
        imageUrl: profile.pfpUrl // Use pfpUrl instead of pfp
      }));
    }
  }, [isAuthenticated, profile]);

  return (
    <div>
      <button
        className="w-full rounded-lg bg-gray-400 py-3 text-center font-medium text-white transition-colors hover:bg-gray-500 disabled:opacity-70"
        onClick={handleConnectClick}
        disabled={isLoading || isAuthenticated}
      >
        {isLoading ? 'Connecting...' : 'Connect'}
      </button>
      
      {/* Hidden SignInButton that gets triggered by our custom button */}
      <div ref={signInButtonRef} className="hidden">
        <SignInButton onSuccess={handleSuccess} />
      </div>
    </div>
  );
} 