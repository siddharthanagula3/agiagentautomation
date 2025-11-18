/**
 * Animated Avatar Component with Fallbacks
 * Handles avatar loading with graceful fallbacks
 */

import React, { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@shared/ui/avatar';
import { cn } from '@shared/lib/utils';

interface AnimatedAvatarProps {
  src?: string;
  alt: string;
  fallback?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showFallbackOnError?: boolean;
}

const sizeClasses = {
  sm: 'h-8 w-8',
  md: 'h-12 w-12',
  lg: 'h-16 w-16',
  xl: 'h-20 w-20',
};

const fallbackSizeClasses = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
  xl: 'text-lg',
};

export const AnimatedAvatar: React.FC<AnimatedAvatarProps> = ({
  src,
  alt,
  fallback,
  className,
  size = 'md',
  showFallbackOnError = true,
}) => {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(!!src);

  // Reset error state when src changes
  useEffect(() => {
    if (src) {
      setImageError(false);
      setIsLoading(true);
    } else {
      // If no src, immediately show fallback (not loading)
      setIsLoading(false);
      setImageError(false);
    }
  }, [src]);

  const handleImageLoad = () => {
    setIsLoading(false);
    setImageError(false);
  };

  const handleImageError = () => {
    console.warn(`[AnimatedAvatar] Failed to load image: ${src}`);
    setImageError(true);
    setIsLoading(false);
  };

  // Generate fallback text from alt
  const getFallbackText = () => {
    if (fallback) return fallback;

    // Handle empty or missing alt text
    if (!alt || alt.trim() === '') return '??';

    // Extract initials from alt text
    const words = alt.trim().split(/\s+/);
    if (words.length >= 2) {
      return `${words[0][0]}${words[1][0]}`.toUpperCase();
    }
    // For single word or short text, take first 2 characters
    return alt.trim().slice(0, 2).toUpperCase();
  };

  // Determine what to show
  const shouldShowImage = src && !imageError && !isLoading;
  const shouldShowFallback = !src || imageError || !showFallbackOnError;

  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      {shouldShowImage && (
        <AvatarImage
          src={src}
          alt={alt}
          onLoad={handleImageLoad}
          onError={handleImageError}
          className="object-cover transition-opacity duration-300"
        />
      )}

      {shouldShowFallback && (
        <AvatarFallback
          className={cn(
            'bg-gradient-to-br from-blue-500 to-purple-600 font-semibold text-white',
            fallbackSizeClasses[size],
            isLoading && 'animate-pulse'
          )}
        >
          {isLoading ? '...' : getFallbackText()}
        </AvatarFallback>
      )}
    </Avatar>
  );
};

export default AnimatedAvatar;
