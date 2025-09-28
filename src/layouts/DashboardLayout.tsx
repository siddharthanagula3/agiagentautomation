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

  // Handle responsive design
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
    
    // Simulate loading completion
    const timer = setTimeout(() => setIsLoading(false), 500);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
    };
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-300 font-medium">Loading AGI Platform...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={cn(
        "min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900",
        "transition-all duration-300 ease-in-out",
        className
      )}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.02"%3E%3Ccircle cx="30" cy="30" r="1"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>
      
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
            "bg-slate-800/50 backdrop-blur-xl border-r border-slate-700/50",
            "transition-all duration-300 ease-in-out z-30",
            "shadow-2xl shadow-slate-900/20",
            sidebarCollapsed ? "lg:w-16" : "lg:w-64"
          )}
        >
          <div className="flex-1 flex flex-col min-h-0">
            <DashboardSidebar collapsed={sidebarCollapsed} />
          </div>
          
          {/* Sidebar Toggle Button */}
          <div className="p-4 border-t border-slate-700/50">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className={cn(
                "w-full text-slate-300 hover:text-white hover:bg-slate-700/50",
                "transition-all duration-200",
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
            "bg-slate-800/95 backdrop-blur-xl border-r border-slate-700/50",
            "transform transition-transform duration-300 ease-in-out",
            "shadow-2xl shadow-slate-900/50",
            mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
            <h2 className="text-lg font-semibold text-white">AGI Platform</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(false)}
              className="text-slate-300 hover:text-white hover:bg-slate-700/50"
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
            "lg:pl-16", // Default for collapsed sidebar
            !sidebarCollapsed && "lg:pl-64" // Expanded sidebar
          )}
        >
          {/* Content Container */}
          <div className="min-h-screen pt-16">
            {/* Main Content Area */}
            <div className="p-4 sm:p-6 lg:p-8">
              {/* Content Background */}
              <div className={cn(
                "bg-slate-800/30 backdrop-blur-sm rounded-2xl",
                "border border-slate-700/30 shadow-xl shadow-slate-900/20",
                "min-h-[calc(100vh-8rem)]",
                "transition-all duration-300 ease-in-out"
              )}>
                <div className="p-6 lg:p-8">
                  <Outlet />
                </div>
              </div>
            </div>

            {/* Floating Action Button (Mobile) */}
            <div className="fixed bottom-6 right-6 lg:hidden z-40">
              <Button
                onClick={() => setMobileMenuOpen(true)}
                className={cn(
                  "w-14 h-14 rounded-full shadow-lg",
                  "bg-gradient-to-r from-blue-600 to-purple-600",
                  "hover:from-blue-700 hover:to-purple-700",
                  "text-white border-0",
                  "transition-all duration-200 hover:scale-105",
                  "shadow-blue-500/25"
                )}
                aria-label="Open menu"
              >
                <MenuIcon className="h-6 w-6" />
              </Button>
            </div>
          </div>
        </main>
      </div>

      {/* Loading Overlay for Page Transitions */}
      <div className={cn(
        "fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm",
        "flex items-center justify-center",
        "transition-all duration-300",
        "pointer-events-none opacity-0"
      )}>
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-300 text-sm">Loading...</p>
        </div>
      </div>
    </div>
  );
};

export { DashboardLayout };