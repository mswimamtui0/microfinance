import React from 'react';
import { useTranslation } from 'react-i18next';

const Loading = () => {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="flex flex-col items-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        <p className="text-gray-500 text-sm">Loading...</p>
      </div>
    </div>
  );
};

export default Loading;