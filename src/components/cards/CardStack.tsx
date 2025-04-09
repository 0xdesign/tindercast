'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

interface WalletOverlapData {
  overlapPercentage: number;
  topCommonAssets: {
    symbol: string;
    name: string;
    logo?: string;
  }[];
}

interface CardStackProps {
  profiles: Profile[];
}

export default function CardStack({ profiles }: CardStackProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<'left' | 'right' | null>(null);
  const [exiting, setExiting] = useState(false);
  const [walletData, setWalletData] = useState<Record<number, WalletOverlapData>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Fetch wallet data for each profile
  useEffect(() => {
    const fetchWalletData = async () => {
      setIsLoading(true);
      
      // Get the current user FID
      const storedUser = localStorage.getItem('farcasterUser');
      if (!storedUser) return;

      const { fid } = JSON.parse(storedUser);
      const walletResults: Record<number, WalletOverlapData> = {};
      
      // Fetch wallet data for each profile
      for (const profile of profiles) {
        try {
          const response = await fetch('/api/wallet-overlap', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userFid: fid,
              targetFid: profile.fid
            }),
          });
          
          if (response.ok) {
            const data = await response.json();
            walletResults[profile.fid] = data;
          }
        } catch (error) {
          console.error(`Error fetching wallet data for ${profile.username}:`, error);
        }
      }
      
      setWalletData(walletResults);
      setIsLoading(false);
    };
    
    fetchWalletData();
  }, [profiles]);

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
          <p className="mt-2 text-gray-500">You&apos;ve gone through all available profiles</p>
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
  const commonTokens = overlap?.topCommonAssets.map((asset) => asset.symbol) || [];

  return (
    <div className="relative h-[500px] w-full">
      {isLoading ? (
        <div className="flex h-full w-full items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"></div>
        </div>
      ) : (
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
      )}
    </div>
  );
} 