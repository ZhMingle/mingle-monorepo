import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = () => {
  const location = useLocation();

  const menuItems = [
    {
      path: '/',
      name: 'Car Wash Record',
      icon: '🚗',
    },
    {
      path: '/feedback',
      name: 'Feedback System',
      icon: '💬',
    },
    {
      path: '/sort',
      name: 'Sort Articles',
      icon: '📊',
    },
    {
      path: '/car-history',
      name: 'Vehicle History',
      icon: '📋',
    },
  ];

  return (
    <div className="w-64 bg-white dark:bg-gray-800 shadow-lg h-screen overflow-y-auto">
      <div className="p-6">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-8">React Learning</h2>

        <nav className="space-y-2">
          {menuItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-200 ${
                location.pathname === item.path
                  ? 'bg-green-600 text-white'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="font-medium">{item.name}</span>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;
