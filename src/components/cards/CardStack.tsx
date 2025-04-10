'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Card from './Card';
import { Toaster } from 'react-hot-toast';

interface Profile {
  fid: number;
  username: string;
  displayName: string;
  description?: string;
  bio?: string;  // Added for compatibility with suggested follows API
  imageUrl: string;
  custodyAddress?: string;
  connectedAddresses?: string[];
  // Added fields for enhanced profile data
  enhancedSummary?: string;
  tradingArchetype?: string;
  // Added fields for portfolio overlap
  overlapCalculated?: boolean;
  overlapPercentage?: number;
  topCommonAssets?: {
    symbol: string;
    name?: string;
    logo?: string;
  }[];
}

interface CardStackProps {
  initialProfiles?: Profile[];
  useSuggestedFollows?: boolean;
}

export default function CardStack({ initialProfiles = [], useSuggestedFollows = true }: CardStackProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<'left' | 'right' | null>(null);
  const [exiting, setExiting] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>(initialProfiles);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [hasFetchedInitial, setHasFetchedInitial] = useState(false);

  // Memoize the fetchSuggestedFollows function to prevent recreating it on every render
  const fetchSuggestedFollows = useCallback(async () => {
    // Only fetch if we haven't already fetched to prevent duplicate calls
    if (hasFetchedInitial) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Get the current user FID
      const storedUser = localStorage.getItem('farcasterUser');
      if (!storedUser) {
        console.error('User not authenticated: No farcasterUser in localStorage');
        setError("Not authenticated. Please log in.");
        setIsLoading(false);
        return;
      }

      let userData;
      try {
        userData = JSON.parse(storedUser);
      } catch (e) {
        console.error('Failed to parse farcasterUser from localStorage:', e);
        setError("Authentication data is corrupted. Please log in again.");
        setIsLoading(false);
        return;
      }

      const { fid } = userData;
      if (!fid) {
        console.error('User FID missing from authentication data');
        setError("Authentication data is incomplete. Please log in again.");
        setIsLoading(false);
        return;
      }
      
      // Fetch suggested follows with portfolio overlap
      console.log(`Fetching suggested follows for FID: ${fid} (${new Date().toISOString()})`);
      
      try {
        const response = await fetch(`/api/suggested-follows-with-overlap?fid=${fid}&limit=10`);
        
        console.log('API response status:', response.status);
        
        if (!response.ok) {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            try {
              const errorData = await response.json();
              console.error('API error response:', errorData);
              throw new Error(errorData.error || `Failed to fetch suggested follows: ${response.status}`);
            } catch (e) {
              console.error('Failed to parse error response as JSON:', e);
              throw new Error(`API error: ${response.status}`);
            }
          } else {
            // Handle non-JSON responses like HTML error pages
            const text = await response.text();
            console.error('Received non-JSON response:', text.substring(0, 150) + '...');
            throw new Error(`Server error ${response.status}: Not a valid JSON response`);
          }
        }
        
        // Parse response as JSON safely
        let data;
        try {
          data = await response.json();
          console.log('API response data summary:', {
            userCount: data.users?.length || 0,
            totalCount: data.totalCount || 0,
            example: data.users?.[0] ? {
              fid: data.users[0].fid,
              username: data.users[0].username
            } : null
          });
        } catch (e) {
          console.error('Failed to parse JSON response:', e);
          throw new Error('Invalid JSON response from server');
        }
        
        if (!data.users || !Array.isArray(data.users)) {
          console.error('Invalid response format - missing users array:', data);
          throw new Error('Invalid response format - missing users array');
        }
        
        // Format profiles
        const suggestedProfiles = mapSuggestedFollowsToProfiles(data.users || []);
        
        if (suggestedProfiles.length === 0) {
          console.warn('No suggested profiles found');
        } else {
          console.log(`Found ${suggestedProfiles.length} suggested profiles`);
        }
        
        setProfiles(suggestedProfiles);
        setNextCursor(data.nextCursor || null);
        setHasFetchedInitial(true);
      } catch (error) {
        console.error('Failed to fetch API:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error fetching suggested follows:', error);
      setError(error instanceof Error ? error.message : 'Failed to load suggested follows');
    } finally {
      setIsLoading(false);
    }
  }, [hasFetchedInitial]);
  
  // Memoize the fetchMoreSuggestedFollows function 
  const fetchMoreSuggestedFollows = useCallback(async () => {
    if (!nextCursor || isFetchingMore) return;
    
    try {
      setIsFetchingMore(true);
      
      // Get the current user FID
      const storedUser = localStorage.getItem('farcasterUser');
      if (!storedUser) return;

      const { fid } = JSON.parse(storedUser);
      
      // Fetch more suggested follows with the cursor
      const response = await fetch(`/api/suggested-follows-with-overlap?fid=${fid}&limit=10&cursor=${nextCursor}`);
      
      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Failed to fetch more suggested follows: ${response.status}`);
        } else {
          // Handle non-JSON responses
          const text = await response.text();
          console.error('Received non-JSON response:', text.substring(0, 150) + '...');
          throw new Error(`Server error: ${response.status} - Not a valid JSON response`);
        }
      }
      
      // Parse response safely
      let data;
      try {
        data = await response.json();
      } catch (e) {
        console.error('Failed to parse JSON response:', e);
        throw new Error('Invalid JSON response from server');
      }
      
      // Format profiles and append to existing profiles
      const moreProfiles = mapSuggestedFollowsToProfiles(data.users || []);
      
      setProfiles(prev => [...prev, ...moreProfiles]);
      setNextCursor(data.nextCursor || null);
    } catch (error) {
      console.error('Error fetching more suggested follows:', error);
      // Don't set error state here to avoid disrupting the current UI
    } finally {
      setIsFetchingMore(false);
    }
  }, [nextCursor, isFetchingMore]);

  // Fetch profiles when component mounts
  useEffect(() => {
    if (initialProfiles.length > 0) {
      setProfiles(initialProfiles);
      setIsLoading(false);
      setHasFetchedInitial(true);
    } else if (useSuggestedFollows && !hasFetchedInitial) {
      fetchSuggestedFollows();
    }
  }, [initialProfiles, useSuggestedFollows, fetchSuggestedFollows, hasFetchedInitial]);

  // Fetch more profiles when we're close to the end
  useEffect(() => {
    // If we're 3 cards away from the end and have more to fetch
    if (
      useSuggestedFollows && 
      nextCursor && 
      !isFetchingMore && 
      profiles.length > 0 && 
      currentIndex >= profiles.length - 3
    ) {
      fetchMoreSuggestedFollows();
    }
  }, [currentIndex, profiles.length, nextCursor, isFetchingMore, useSuggestedFollows, fetchMoreSuggestedFollows]);
  
  // Map API response to profile format
  const mapSuggestedFollowsToProfiles = (users: any[]): Profile[] => {
    return users.map(user => ({
      fid: user.fid,
      username: user.username,
      displayName: user.displayName || user.username,
      description: user.bio || '',
      bio: user.bio || '',
      imageUrl: user.imageUrl || '',
      overlapCalculated: user.overlapCalculated,
      overlapPercentage: user.overlapPercentage || 0,
      topCommonAssets: user.topCommonAssets || [],
      tradingArchetype: user.tradingArchetype || null
    }));
  };

  const handleSwipe = (dir: 'left' | 'right') => {
    if (exiting) return;
    
    setDirection(dir);
    setExiting(true);
    
    // Wait for animation to complete before updating index
    setTimeout(() => {
      setCurrentIndex(prev => Math.min(prev + 1, profiles.length));
      setDirection(null);
      setExiting(false);
    }, 300);
  };

  if (isLoading) {
    return (
      <div className="relative h-[500px] w-full">
        <div className="flex h-full w-full items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"></div>
        </div>
        {/* Toast container */}
        <Toaster position="bottom-center" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative h-[500px] w-full">
        <div className="flex h-full w-full flex-col items-center justify-center rounded-xl border border-red-200 bg-red-50 p-6">
          <h3 className="text-lg font-medium text-red-800">Error loading profiles</h3>
          <p className="mt-2 text-sm text-red-600">{error}</p>
          <button
            onClick={fetchSuggestedFollows}
            className="mt-4 rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
          >
            Try Again
          </button>
        </div>
        {/* Toast container */}
        <Toaster position="bottom-center" />
      </div>
    );
  }

  if (currentIndex >= profiles.length) {
    return (
      <div className="relative h-[500px] w-full">
        <div className="flex h-full w-full flex-col items-center justify-center rounded-xl border border-gray-200 bg-white p-6 text-center shadow-lg">
          <h3 className="text-xl font-semibold text-gray-800">No more profiles</h3>
          <p className="mt-2 text-gray-500">You&apos;ve gone through all available profiles</p>
          <button
            onClick={() => setCurrentIndex(0)}
            className="mt-6 rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
          >
            Start Over
          </button>
        </div>
        {/* Toast container */}
        <Toaster position="bottom-center" />
      </div>
    );
  }

  if (profiles.length === 0) {
    return (
      <div className="relative h-[500px] w-full">
        <div className="flex h-full w-full flex-col items-center justify-center rounded-xl border border-gray-200 bg-white p-6 text-center shadow-lg">
          <h3 className="text-xl font-semibold text-gray-800">No profiles found</h3>
          <p className="mt-2 text-gray-500">We couldn&apos;t find any suggested profiles for you</p>
          <button
            onClick={fetchSuggestedFollows}
            className="mt-6 rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
          >
            Try Again
          </button>
        </div>
        {/* Toast container */}
        <Toaster position="bottom-center" />
      </div>
    );
  }

  const currentProfile = profiles[currentIndex];

  return (
    <div className="relative h-[500px] w-full">
      <AnimatePresence>
        <motion.div
          key={currentIndex}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ 
            x: direction === 'left' ? -300 : direction === 'right' ? 300 : 0,
            opacity: 0,
            transition: { duration: 0.3 }
          }}
          className="h-full w-full"
        >
          <Card
            fid={currentProfile.fid}
            image={currentProfile.imageUrl}
            name={currentProfile.displayName || currentProfile.username}
            overlapPercentage={currentProfile.overlapPercentage}
            topCommonAssets={currentProfile.topCommonAssets}
            commonTokens={currentProfile.topCommonAssets?.map(asset => asset.symbol) || []}
            tradingArchetype={currentProfile.tradingArchetype}
            onLike={() => handleSwipe('right')}
            onDislike={() => handleSwipe('left')}
          >
            <p className="text-sm text-gray-600">
              {currentProfile.bio || currentProfile.description || currentProfile.enhancedSummary || "No description available"}
            </p>
          </Card>
        </motion.div>
      </AnimatePresence>
      
      {/* Loading indicator for fetching more profiles */}
      {isFetchingMore && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 transform">
          <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"></div>
        </div>
      )}
      
      {/* Toast container */}
      <Toaster position="bottom-center" />
    </div>
  );
} 