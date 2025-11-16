/**
 * VibeLayout - Overall layout wrapper for the VIBE interface
 * Provides a clean, focused layout with sidebar and main content area
 */

import React from 'react';

interface VibeLayoutProps {
  children: React.ReactNode;
}

const VibeLayout: React.FC<VibeLayoutProps> = ({ children }) => {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {children}
    </div>
  );
};

export default VibeLayout;
