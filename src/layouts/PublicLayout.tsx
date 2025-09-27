import React from 'react';
import { Outlet } from 'react-router-dom';
import { PublicHeader } from '../components/layout/PublicHeader';
import { PublicFooter } from '../components/layout/PublicFooter';

const PublicLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />
      <main>
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  );
};

export { PublicLayout };