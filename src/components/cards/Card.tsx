'use client';

import { cn } from "@/lib/utils";
import { useState } from 'react';

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
      {/* Profile Image */}
      <div className="relative h-[60%] w-full bg-gray-200">
        {image && !imageError ? (
          <img
            src={image}
            alt={name}
            className="h-full w-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="text-3xl font-bold text-gray-400">{name.charAt(0).toUpperCase()}</span>
          </div>
        )}
      </div>
      
      {/* Profile Info */}
      <div className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800">{name}</h2>
          {overlapPercentage !== undefined && (
            <span className="rounded-full bg-gray-200 px-2 py-1 text-sm font-medium text-gray-700">
              {overlapPercentage}% Overlap
            </span>
          )}
        </div>
        
        {/* Token Badges */}
        {commonTokens && commonTokens.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {commonTokens.map((token, index) => (
              <span
                key={index}
                className="flex items-center rounded-full bg-gray-300 px-3 py-1 text-sm font-medium text-gray-700"
              >
                <span className="mr-1 h-2 w-2 rounded-full bg-gray-500"></span>
                {token}
              </span>
            ))}
          </div>
        )}
        
        {children}
      </div>
      
      {/* Action Buttons */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-8">
        <button
          onClick={onDislike}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-md hover:bg-gray-100"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <button
          onClick={onLike}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-md hover:bg-gray-100"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>
      </div>
    </div>
  );
} 