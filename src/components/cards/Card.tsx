'use client';

import { cn } from "@/lib/utils";
import { useState } from 'react';
import { motion } from "framer-motion";
import { X, Heart } from "lucide-react";

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
          <X className="h-8 w-8" />
        </motion.button>
        
        <motion.button
          onClick={onLike}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-white shadow-md"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <Heart className="h-8 w-8" />
        </motion.button>
      </div>
    </div>
  );
} 