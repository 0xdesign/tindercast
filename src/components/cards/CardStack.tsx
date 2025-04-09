'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import Card from './Card';

interface Profile {
  fid: number;
  username: string;
  displayName: string;
  description: string;
  imageUrl: string;
  custodyAddress?: string;
  connectedAddresses?: string[];
}

interface CardStackProps {
  profiles: Profile[];
}

export default function CardStack({ profiles }: CardStackProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<'left' | 'right' | null>(null);
  const [walletData, setWalletData] = useState<Record<number, any>>({});
  const [loading, setLoading] = useState<Record<number, boolean>>({});
  const [exiting, setExiting] = useState(false);

  // Fetch wallet overlap data for the visible profiles
  useEffect(() => {
    const visibleProfiles = profiles.slice(currentIndex, currentIndex + 3);
    
    visibleProfiles.forEach(profile => {
      if (!walletData[profile.fid] && !loading[profile.fid]) {
        fetchWalletOverlap(profile.fid);
      }
    });
  }, [profiles, currentIndex, walletData, loading]);

  const fetchWalletOverlap = async (profileFid: number) => {
    try {
      setLoading(prev => ({ ...prev, [profileFid]: true }));
      
      // Get current user from localStorage
      const userData = JSON.parse(localStorage.getItem('farcasterUser') || '{}');
      
      if (!userData.fid) return;
      
      const response = await fetch('/api/wallet-overlap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userFid: userData.fid,
          profileFid
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch wallet overlap');
      }
      
      const data = await response.json();
      setWalletData(prev => ({ ...prev, [profileFid]: data }));
    } catch (error) {
      console.error('Error fetching wallet overlap:', error);
    } finally {
      setLoading(prev => ({ ...prev, [profileFid]: false }));
    }
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

  if (currentIndex >= profiles.length) {
    return (
      <div className="flex h-[500px] w-full items-center justify-center rounded-xl border border-gray-200 bg-white p-6 text-center shadow-lg">
        <div>
          <h3 className="text-xl font-semibold text-gray-800">No more profiles</h3>
          <p className="mt-2 text-gray-500">You've gone through all available profiles</p>
          <button
            onClick={() => setCurrentIndex(0)}
            className="mt-6 rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
          >
            Start Over
          </button>
        </div>
      </div>
    );
  }

  const currentProfile = profiles[currentIndex];
  const overlap = walletData[currentProfile.fid];
  const commonTokens = overlap?.topCommonAssets.map((asset: any) => asset.symbol) || [];

  return (
    <div className="relative h-[500px] w-full">
      {/* Background cards (stacked appearance) */}
      {profiles.slice(currentIndex + 1, currentIndex + 3).map((profile, idx) => {
        const index = idx + 1; // Start from 1 since currentIndex is 0
        
        return (
          <div
            key={profile.fid}
            className="absolute left-1/2 top-0 -translate-x-1/2"
            style={{
              zIndex: -index,
              transform: `translateX(-50%) translateY(${index * 15}px) scale(${1 - index * 0.05})`,
              opacity: 1 - index * 0.2
            }}
          >
            <div className="w-[350px] h-[500px] rounded-2xl border border-gray-200 bg-gray-100 shadow-md"></div>
          </div>
        );
      })}

      {/* Current card with swipe animation */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentProfile.fid}
          className="absolute left-1/2 top-0 -translate-x-1/2"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1, x: 0, rotate: 0 }}
          exit={direction === 'left' 
            ? { x: -500, rotate: -20, opacity: 0 }
            : { x: 500, rotate: 20, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        >
          <Card
            image={currentProfile.imageUrl}
            name={currentProfile.displayName || currentProfile.username}
            overlapPercentage={overlap?.overlapPercentage}
            commonTokens={commonTokens}
            onLike={() => handleSwipe('right')}
            onDislike={() => handleSwipe('left')}
          >
            <p className="text-sm text-gray-600">{currentProfile.description}</p>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  );
} 