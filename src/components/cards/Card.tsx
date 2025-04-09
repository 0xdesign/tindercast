'use client';

import { cn } from "@/lib/utils";
import { useState } from 'react';
import { motion } from "framer-motion";

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
        "rounded-full px-3 py-1 text-sm font-medium flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-gray-200 shadow-sm",
        className
      )}
    >
      <span className="h-3 w-3 rounded-full bg-blue-500 flex-shrink-0"></span>
      <span>{label}</span>
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
  overlapPercentage?: number;
  commonTokens?: string[];
  onLike?: () => void;
  onDislike?: () => void;
  children?: React.ReactNode;
}

export default function Card({ 
  className, 
  image, 
  name, 
  overlapPercentage, 
  commonTokens = [], 
  onLike, 
  onDislike, 
  children 
}: CardProps) {
  const [imageError, setImageError] = useState(false);
  
  return (
    <div
      className={cn(
        "w-[350px] h-[500px] overflow-hidden bg-white rounded-2xl shadow-lg border border-gray-200/80",
        className
      )}
    >
      {/* Profile Image with Gradient Overlay */}
      <div className="relative h-[70%] w-full bg-gray-200">
        {image && !imageError ? (
          <>
            <img
              src={image}
              alt={name}
              className="h-full w-full object-cover"
              onError={() => setImageError(true)}
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/70" />
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="text-5xl font-bold text-gray-400">{name.charAt(0).toUpperCase()}</span>
            {/* Gradient overlay for placeholder */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/70" />
          </div>
        )}
        
        {/* Profile info overlay on image */}
        <div className="absolute bottom-0 left-0 w-full p-4 text-white">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">{name}</h2>
            {overlapPercentage !== undefined && (
              <span className="rounded-full bg-white/20 backdrop-blur-sm px-3 py-1 text-sm font-medium text-white">
                {overlapPercentage}% Overlap
              </span>
            )}
          </div>
          
          {/* Token Badges */}
          {commonTokens && commonTokens.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {commonTokens.map((token, index) => (
                <TokenBadge key={index} label={token} />
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Bio Content */}
      <div className="p-4">
        {children}
      </div>
      
      {/* Tinder-style Action Buttons */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-6">
        <motion.button
          onClick={onDislike}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500 text-white shadow-md"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <XIcon />
        </motion.button>
        
        <motion.button
          onClick={onLike}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-white shadow-md"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <HeartIcon />
        </motion.button>
      </div>
    </div>
  );
} 