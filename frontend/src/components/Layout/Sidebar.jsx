import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const Sidebar = () => {
  const { t } = useTranslation();

  const navigation = [
    { name: t('Dashboard'), href: '/app' },
    { name: t('Customers'), href: '/customers' },
    { name: t('Loans'), href: '/loans' },
    { name: t('Payments'), href: '/payments' },
    { name: t('Collections'), href: '/collections' },
    { name: t('Reports'), href: '/reports' },
  ];

  return (
    <div className="flex flex-col h-full bg-black border-r border-gray-800">
      {/* Logo Section - Black Background */}
      <div className="flex items-center h-16 px-4 border-b border-gray-800">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">M</span>
          </div>
          <span className="text-xl font-bold text-white">MicroFinance</span>
        </div>
      </div>
      
      {/* Navigation - Black Background */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              `block px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-150 ${
                isActive
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`
            }
          >
            {item.name}
          </NavLink>
        ))}
      </nav>
      
      {/* User Profile - Black Background */}
      <div className="px-2 py-4 border-t border-gray-800">
        <div className="flex items-center px-3 py-2.5 text-sm text-gray-300">
          <div className="flex-shrink-0 w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-white">JD</span>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-white">John Doe</p>
            <p className="text-xs text-gray-400">{t('Loan Officer')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;