import React, { useState } from 'react';
import { cn } from '@shared/lib/utils';

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
    <div className="flex h-[100dvh] bg-background text-foreground">
      {/* Collapsible Sidebar */}
      <aside
        className={cn(
          'border-r border-gray-200 transition-all duration-300 ease-in-out dark:border-gray-700',
          sidebarOpen ? 'w-full sm:w-64 md:w-80' : 'w-12'
        )}
      >
        {sidebar}
      </aside>

      {/* Main Chat Area */}
      <main className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        {topBar}

        {/* Message area */}
        <div className="flex flex-1 flex-col">{children}</div>
      </main>
    </div>
  );
}
