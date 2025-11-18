import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { cn } from '@shared/lib/utils';
import { DashboardHeader } from '@shared/components/layout/DashboardHeader';
import { DashboardSidebar } from '@shared/components/layout/DashboardSidebar';
import { Button } from '@shared/ui/button';
import { MenuIcon, X } from 'lucide-react';

interface DashboardLayoutProps {
  className?: string;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ className }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarCollapsed(true);
      } else {
        setMobileMenuOpen(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    const timer = setTimeout(() => setIsLoading(false), 500);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="space-y-4 text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="font-medium text-foreground">Loading AGI Platform...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'min-h-screen bg-background',
        'transition-all duration-300 ease-in-out',
        className
      )}
    >
      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Header */}
      <DashboardHeader
        onMenuClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        onSidebarToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        sidebarCollapsed={sidebarCollapsed}
      />

      <div className="relative flex">
        {/* Desktop Sidebar */}
        <aside
          className={cn(
            'hidden lg:fixed lg:inset-y-0 lg:top-16 lg:flex lg:flex-col',
            'border-r border-border bg-card/50 backdrop-blur-xl',
            'z-30 transition-all duration-300 ease-in-out',
            sidebarCollapsed ? 'lg:w-16' : 'lg:w-64'
          )}
        >
          <div className="flex min-h-0 flex-1 flex-col">
            <DashboardSidebar collapsed={sidebarCollapsed} />
          </div>

          {/* Sidebar Toggle Button */}
          <div className="border-t border-border p-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className={cn('w-full', sidebarCollapsed && 'px-0')}
              aria-label={
                sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'
              }
            >
              <MenuIcon
                className={cn(
                  'h-4 w-4 transition-transform duration-200',
                  sidebarCollapsed ? 'rotate-180' : ''
                )}
              />
              {!sidebarCollapsed && <span className="ml-2">Collapse</span>}
            </Button>
          </div>
        </aside>

        {/* Mobile Sidebar */}
        <aside
          className={cn(
            'fixed inset-y-0 left-0 z-50 w-64 lg:hidden',
            'border-r border-border bg-card backdrop-blur-xl',
            'transform transition-transform duration-300 ease-in-out',
            'flex flex-col shadow-2xl',
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <div className="flex flex-shrink-0 items-center justify-between border-b border-border p-4">
            <h2 className="text-lg font-semibold">AGI Platform</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <div className="flex-1 overflow-hidden">
            <DashboardSidebar collapsed={false} className="h-full" />
          </div>
        </aside>

        {/* Main Content */}
        <main
          className={cn(
            'relative z-10 flex-1',
            'transition-all duration-300 ease-in-out',
            'lg:pl-16',
            !sidebarCollapsed && 'lg:pl-64'
          )}
        >
          <div className="min-h-screen pt-16">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <Outlet />
            </div>
          </div>
        </main>
      </div>

      {/* Floating Action Button (Mobile) */}
      <div className="fixed bottom-6 right-6 z-40 pb-safe lg:hidden">
        <Button
          onClick={() => setMobileMenuOpen(true)}
          className="gradient-primary h-14 w-14 rounded-full text-white shadow-lg"
          aria-label="Open menu"
        >
          <MenuIcon className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
};

export { DashboardLayout };
