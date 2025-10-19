import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface ChatLayoutProps {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  topBar?: React.ReactNode;
  sidebarOpen?: boolean;
}

export function ChatLayout({
  children,
  sidebar,
  topBar,
  sidebarOpen = true,
}: ChatLayoutProps) {
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Collapsible Sidebar */}
      <aside
        className={cn(
          'border-r border-gray-200 transition-all duration-300 ease-in-out dark:border-gray-700',
          sidebarOpen ? 'w-64' : 'w-12'
        )}
      >
        {sidebar}
      </aside>

      {/* Main Chat Area */}
      <main className="flex min-w-0 flex-1 flex-col">
        {/* Top bar with employee avatars + dashboard nav */}
        {topBar}

        {/* Message area with ScrollArea */}
        <div className="flex flex-1 flex-col">{children}</div>
      </main>
    </div>
  );
}
