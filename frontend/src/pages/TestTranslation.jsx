import React from 'react';
import { useTranslation } from 'react-i18next';

const TestTranslation = () => {
  const { t } = useTranslation();
  return (
    <div>
      <h1>{t('Welcome')}</h1>
      <p>{t('Dashboard')}</p>
      <p>{t('Customers')}</p>
      <p>Current language: {localStorage.getItem('language') || 'sw'}</p>
    </div>
  );
};

export default TestTranslation;