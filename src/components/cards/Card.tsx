'use client';

import { cn } from "@/lib/utils";
import { useState } from 'react';
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { getSignerInfo, isSignerValid, storeSignerInfo, SignerInfo } from "@/utils/neynar";

interface TokenBadgeProps {
  label: string;
  className?: string;
}

const TokenBadge = ({ label, className }: TokenBadgeProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "rounded-full px-4 py-1.5 text-sm font-semibold flex items-center gap-2 bg-gray-100/90 backdrop-blur-sm border border-white/20 shadow-sm",
        className
      )}
    >
      <span className="h-3 w-3 rounded-full bg-blue-500 flex-shrink-0"></span>
      <span className="text-gray-800">{label}</span>
    </motion.div>
  );
};

// SVG icons
const XIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

const HeartIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
  </svg>
);

interface CardProps {
  className?: string;
  image?: string;
  name: string;
  fid: number;  // Added FID for following functionality
  overlapPercentage?: number;
  commonTokens?: string[];
  topCommonAssets?: {
    symbol: string;
    name?: string;
    imgUrl?: string;
    network?: string;
  }[];
  tradingArchetype?: string;
  onLike?: () => void;
  onDislike?: () => void;
  children?: React.ReactNode;
}

export default function Card({ 
  className, 
  image, 
  name, 
  fid,  // Added FID parameter
  overlapPercentage, 
  commonTokens = [], 
  topCommonAssets = [],
  tradingArchetype,
  onLike, 
  onDislike, 
  children 
}: CardProps) {
  const [imageError, setImageError] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [signerInfo, setSignerInfo] = useState<any>(null);
  
  // Handle the follow action
  const handleFollow = async () => {
    try {
      setIsProcessing(true);
      
      // Get current user FID from localStorage
      const storedUser = localStorage.getItem('farcasterUser');
      if (!storedUser) {
        toast.error('User not authenticated');
        return;
      }
      
      const { fid: userFid } = JSON.parse(storedUser);
      
      // 1. First check if we have a valid signer using the utility function
      const storedSigner = getSignerInfo(userFid);
      let signerUuid = storedSigner && isSignerValid(storedSigner) ? storedSigner.signer_uuid : null;
      
      // 2. If no signer exists or it's not approved, create a new one
      if (!signerUuid) {
        console.log('No valid signer found, creating a new one...');
        try {
          // Create a new signer
          const createResponse = await fetch('/api/signer', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ fid: userFid })
          });
          
          if (!createResponse.ok) {
            const errorData = await createResponse.json();
            throw new Error(errorData.error || 'Failed to create signer');
          }
          
          const signerData = await createResponse.json();
          signerUuid = signerData.signer_uuid;
          
          // Store signer info in state
          setSignerInfo(signerData);
          
          // Persist the signer info using the utility function
          storeSignerInfo(userFid, signerData as SignerInfo);
          
          console.log('Signer created:', signerData);
          
          // Show a toast with the approval link
          if (signerData.status !== 'approved' && signerData.signer_approval_url) {
            toast.error('Please approve the signer before following users');
            
            // Open the approval URL in a new tab
            window.open(signerData.signer_approval_url, '_blank');
            
            // Don't proceed with follow until signer is approved
            onLike?.();
            return;
          }
        } catch (error) {
          console.error('Error creating signer:', error);
          toast.error('Failed to create signer. Please try again later.');
          return;
        }
      }
      
      // 3. Check signer status if we have one
      try {
        const statusResponse = await fetch(`/api/signer?signer_uuid=${signerUuid}`);
        if (!statusResponse.ok) {
          const errorData = await statusResponse.json();
          throw new Error(errorData.error || 'Failed to check signer status');
        }
        
        const statusData = await statusResponse.json();
        
        // Store updated signer status
        storeSignerInfo(userFid, statusData as SignerInfo);
        
        console.log('Signer status:', statusData);
        
        // 4. If signer isn't approved, show approval toast
        if (statusData.status !== 'approved') {
          // Show error toast
          toast.error('Signer not approved');
          
          // Show approval link if available
          if (statusData.signer_approval_url) {
            // Open the approval URL in a new tab
            window.open(statusData.signer_approval_url, '_blank');
          }
          
          // Don't proceed with follow until signer is approved
          onLike?.();
          return;
        }
      } catch (error) {
        console.error('Error checking signer status:', error);
        toast.error('Failed to check signer status. Please try again later.');
        return;
      }
      
      // 5. Now follow the user
      try {
        const followResponse = await fetch('/api/follow', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            signerUuid,
            targetFid: fid
          })
        });
        
        if (!followResponse.ok) {
          const errorData = await followResponse.json();
          throw new Error(errorData.error || 'Failed to follow user');
        }
        
        // Success!
        setIsFollowing(true);
        toast.success(`Now following ${name}`);
        
        // Call the onLike callback to move to the next card
        onLike?.();
      } catch (error) {
        console.error('Error following user:', error);
        toast.error(error instanceof Error ? error.message : 'Failed to follow user');
      }
    } catch (error) {
      console.error('Error in follow process:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to complete follow action');
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <div
      className={cn(
        "relative w-[350px] h-[500px] overflow-visible bg-white rounded-2xl shadow-lg border border-gray-200/80",
        className
      )}
    >
      {/* Profile Image with Gradient Overlay */}
      <div className="relative h-[75%] w-full bg-gray-200">
        {image && !imageError ? (
          <>
            <img
              src={image}
              alt={name}
              className="h-full w-full object-cover"
              onError={() => setImageError(true)}
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/80" />
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="text-5xl font-bold text-gray-400">{name.charAt(0).toUpperCase()}</span>
            {/* Gradient overlay for placeholder */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/80" />
          </div>
        )}
        
        {/* Profile info overlay on image */}
        <div className="absolute bottom-0 left-0 w-full p-5 text-white">
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-3xl font-bold drop-shadow-sm truncate flex-1">{name}</h2>
            {overlapPercentage !== undefined && (
              <span className="rounded-full bg-white/30 backdrop-blur-sm px-3 py-1.5 text-sm font-semibold text-white drop-shadow-sm border border-white/20 flex-shrink-0 whitespace-nowrap">
                {overlapPercentage}% Overlap
              </span>
            )}
          </div>
          
          {/* Trading Archetype Badge - if available */}
          {tradingArchetype && (
            <div className="mb-3">
              <span className="rounded-full bg-white/20 backdrop-blur-sm px-3 py-1.5 text-sm font-semibold text-white drop-shadow-sm border border-white/20">
                {tradingArchetype}
              </span>
            </div>
          )}
          
          {/* Token Badges - Moved higher up to avoid gradient */}
          {(topCommonAssets.length > 0 || commonTokens.length > 0) && (
            <div className="mt-4 flex flex-wrap gap-2.5">
              {topCommonAssets.map((token, index) => (
                <TokenBadge key={`asset-${index}`} label={token.symbol} />
              ))}
              {topCommonAssets.length === 0 && commonTokens.map((token, index) => (
                <TokenBadge key={`token-${index}`} label={token} />
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Bio Content */}
      <div className="p-5 pb-10">
        {children}
      </div>
      
      {/* Tinder-style Action Buttons - positioned to hang off the bottom */}
      <div className="absolute -bottom-8 left-0 right-0 flex justify-center gap-10 z-10">
        <motion.button
          onClick={onDislike}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500 text-white shadow-[0_3px_10px_rgba(0,0,0,0.2)] border-2 border-white"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95, y: 5 }}
          disabled={isProcessing}
        >
          <XIcon />
        </motion.button>
        
        <motion.button
          onClick={isFollowing ? onLike : handleFollow}
          className={cn(
            "flex h-16 w-16 items-center justify-center rounded-full text-white shadow-[0_3px_10px_rgba(0,0,0,0.2)] border-2 border-white",
            isFollowing ? "bg-blue-500" : "bg-green-500",
            isProcessing && "opacity-70 cursor-not-allowed"
          )}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95, y: 5 }}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <span className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-white"></span>
          ) : (
            <HeartIcon />
          )}
        </motion.button>
      </div>
    </div>
  );
} 