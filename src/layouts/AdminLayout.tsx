import React from 'react';
import { Outlet } from 'react-router-dom';
import { DashboardHeader } from '../components/layout/DashboardHeader';
import { DashboardSidebar } from '../components/layout/DashboardSidebar';

const AdminLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      <div className="flex">
        <DashboardSidebar />
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export { AdminLayout };