/**
 * Avatar with Fallback Component
 * Handles avatar loading with automatic fallback when DiceBear API fails
 */

import React, { useState, useCallback } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@shared/ui/avatar';
import { getFallbackForDiceBear, isDiceBearUrl } from '@shared/utils/avatar-utils';

interface AvatarWithFallbackProps {
  src?: string;
  alt?: string;
  fallback?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
  xl: 'h-16 w-16',
};

export function AvatarWithFallback({
  src,
  alt = 'Avatar',
  fallback,
  className = '',
  size = 'md',
}: AvatarWithFallbackProps) {
  const [imageError, setImageError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);

  const handleImageError = useCallback(() => {
    if (!imageError && currentSrc) {
      setImageError(true);

      // If it's a DiceBear URL, try fallback
      if (isDiceBearUrl(currentSrc)) {
        const fallbackUrl = getFallbackForDiceBear(currentSrc);
        setCurrentSrc(fallbackUrl);
        setImageError(false); // Reset error state to try fallback
      }
    }
  }, [imageError, currentSrc]);

  const handleImageLoad = useCallback(() => {
    setImageError(false);
  }, []);

  // Get initials for fallback
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Avatar className={`${sizeClasses[size]} ${className}`}>
      {currentSrc && !imageError && (
        <AvatarImage
          src={currentSrc}
          alt={alt}
          onError={handleImageError}
          onLoad={handleImageLoad}
        />
      )}
      <AvatarFallback className="bg-primary text-primary-foreground">
        {fallback ? getInitials(fallback) : alt ? getInitials(alt) : '??'}
      </AvatarFallback>
    </Avatar>
  );
}

export default AvatarWithFallback;
