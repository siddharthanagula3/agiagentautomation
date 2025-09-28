/**
 * Enhanced Dashboard Layout
 * Integrates the new sidebar and provides a cohesive layout experience
 */

import React from 'react';
import { Outlet } from 'react-router-dom';
import { SidebarEnhanced } from '@/components/navigation/SidebarEnhanced';
import { useSidebar } from '@/stores/ui-store';
import { cn } from '@/lib/utils';

export const DashboardLayoutEnhanced: React.FC = () => {
  const { sidebarOpen, sidebarCollapsed } = useSidebar();

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <SidebarEnhanced />
      
      {/* Main Content */}
      <div
        className={cn(
          'flex-1 flex flex-col transition-all duration-300',
          sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64',
          sidebarOpen && 'ml-64'
        )}
      >
        {/* Top Bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background px-6">
          <div className="flex items-center space-x-4">
            <h1 className="text-lg font-semibold">AGI Agent Automation</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Notifications, user menu, etc. can go here */}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
