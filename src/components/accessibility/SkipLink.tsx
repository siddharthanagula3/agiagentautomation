import React from 'react';
import { useKeyboardNavigation } from '@/hooks/useAccessibility';

interface SkipLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

const SkipLink: React.FC<SkipLinkProps> = ({
  href,
  children,
  className = '',
}) => {
  const { handleEnter } = useKeyboardNavigation();

  const handleKeyDown = (event: React.KeyboardEvent<HTMLAnchorElement>) => {
    handleEnter(event, () => {
      const target = document.querySelector(href);
      if (target) {
        (target as HTMLElement).focus();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  };

  return (
    <a
      href={href}
      className={`sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${className}`}
      onKeyDown={handleKeyDown}
    >
      {children}
    </a>
  );
};

export default SkipLink;
