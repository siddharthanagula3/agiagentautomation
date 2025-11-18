import React from 'react';
import { Outlet } from 'react-router-dom';
import { PublicHeader } from '@shared/components/layout/PublicHeader';
import { PublicFooter } from '@shared/components/layout/PublicFooter';

const PublicLayout: React.FC = () => {
  return (
    <div className="flex min-h-screen w-full max-w-full flex-col overflow-x-hidden">
      <PublicHeader />
      <main className="w-full max-w-full flex-1 pt-20">
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  );
};

export { PublicLayout };
