import React from 'react';
import { Outlet } from 'react-router-dom';
import { PublicHeader } from '@shared/components/layout/PublicHeader';
import { PublicFooter } from '@shared/components/layout/PublicFooter';

const PublicLayout: React.FC = () => {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader />
      <main className="flex-1 pt-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </main>
      <PublicFooter />
    </div>
  );
};

export { PublicLayout };
