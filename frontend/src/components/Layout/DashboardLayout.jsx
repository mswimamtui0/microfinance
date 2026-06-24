import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import ErrorBoundary from '../Common/ErrorBoundary';
import { useTranslation } from 'react-i18next';

const DashboardLayout = ({ children }) => {
  const { t } = useTranslation();
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex flex-col w-64">
          <Sidebar />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;