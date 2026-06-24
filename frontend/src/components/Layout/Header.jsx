import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';

const Header = () => {
  const { logout } = useAuth();
  const { t, i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'sw' ? 'en' : 'sw';
    i18n.changeLanguage(newLang);
    localStorage.setItem('language', newLang);
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <div className="flex-1 flex items-center">
        <div className="w-full max-w-lg lg:max-w-xs">
          <div className="relative">
            <input
              type="search"
              placeholder={t('Search...') || 'Search...'}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            />
          </div>
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        {/* Language Switcher Button */}
        <button
          onClick={toggleLanguage}
          className="px-3 py-1.5 text-sm font-medium border border-primary-600 text-primary-600 rounded-lg hover:bg-primary-600 hover:text-white transition-colors"
        >
          {i18n.language === 'sw' ? 'English' : 'Kiswahili'}
        </button>
        
        <button className="p-2 text-gray-400 hover:text-gray-500 rounded-lg hover:bg-gray-100 transition-colors">
          🔔
        </button>
        
        <div className="relative">
          <button
            onClick={logout}
            className="px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
          >
            {t('Logout') || 'Logout'}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;