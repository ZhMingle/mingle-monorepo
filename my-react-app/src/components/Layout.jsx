import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const Layout = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      <div className="hidden md:block">
        <Sidebar />
      </div>
      <div className="flex-1 pl-4 md:pl-8 pt-4 md:pt-8">
        <main className="p-4 md:p-6 pb-24">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
