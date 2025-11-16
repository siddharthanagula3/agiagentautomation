import React from 'react';
import { VibeTopNav } from './VibeTopNav';

interface VibeLayoutProps {
  children: React.ReactNode;
}

/**
 * Standalone layout for VIBE (no main sidebar)
 * This layout is inspired by MGX and provides a focused workspace
 */
export function VibeLayout({ children }: VibeLayoutProps) {
  return (
    <div className="h-screen w-screen flex flex-col bg-background overflow-hidden">
      {/* Top Navigation - NO MAIN SIDEBAR */}
      <VibeTopNav />

      {/* Main Content - Full Width */}
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  );
}
