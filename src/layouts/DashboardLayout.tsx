import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { DashboardHeader } from '../components/layout/DashboardHeader';
import { DashboardSidebar } from '../components/layout/DashboardSidebar';
import { Button } from '@/components/ui/button';
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-foreground font-medium">Loading AGI Platform...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={cn(
        "min-h-screen bg-background",
        "transition-all duration-300 ease-in-out",
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

      <div className="flex relative">
        {/* Desktop Sidebar */}
        <aside 
          className={cn(
            "hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:top-16",
            "bg-card/50 backdrop-blur-xl border-r border-border",
            "transition-all duration-300 ease-in-out z-30",
            sidebarCollapsed ? "lg:w-16" : "lg:w-64"
          )}
        >
          <div className="flex-1 flex flex-col min-h-0">
            <DashboardSidebar collapsed={sidebarCollapsed} />
          </div>
          
          {/* Sidebar Toggle Button */}
          <div className="p-4 border-t border-border">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className={cn(
                "w-full",
                sidebarCollapsed && "px-0"
              )}
              aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <MenuIcon className={cn(
                "h-4 w-4 transition-transform duration-200",
                sidebarCollapsed ? "rotate-180" : ""
              )} />
              {!sidebarCollapsed && <span className="ml-2">Collapse</span>}
            </Button>
          </div>
        </aside>

        {/* Mobile Sidebar */}
        <aside 
          className={cn(
            "fixed inset-y-0 left-0 z-50 w-64 lg:hidden",
            "bg-card backdrop-blur-xl border-r border-border",
            "transform transition-transform duration-300 ease-in-out",
            "shadow-2xl",
            mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="text-lg font-semibold">AGI Platform</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <div className="flex-1 flex flex-col min-h-0 pt-4">
            <DashboardSidebar collapsed={false} />
          </div>
        </aside>

        {/* Main Content */}
        <main 
          className={cn(
            "flex-1 relative z-10",
            "transition-all duration-300 ease-in-out",
            "lg:pl-16",
            !sidebarCollapsed && "lg:pl-64"
          )}
        >
          <div className="min-h-screen pt-16">
            <div className="px-6 lg:px-8">
              <Outlet />
            </div>
          </div>
        </main>
      </div>

      {/* Floating Action Button (Mobile) */}
      <div className="fixed bottom-6 right-6 lg:hidden z-40">
        <Button
          onClick={() => setMobileMenuOpen(true)}
          className="w-14 h-14 rounded-full shadow-lg gradient-primary text-white"
          aria-label="Open menu"
        >
          <MenuIcon className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
};

export { DashboardLayout };
