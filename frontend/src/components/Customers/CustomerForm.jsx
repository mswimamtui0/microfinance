import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { customerAPI } from '../../api';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

const CustomerForm = ({ onClose, customer }) => {
  const { t } = useTranslation();
  const isEditing = !!customer;
  
  const [formData, setFormData] = useState({
    first_name: customer?.first_name || '',
    middle_name: customer?.middle_name || '',
    last_name: customer?.last_name || '',
    gender: customer?.gender || 'M',
    date_of_birth: customer?.date_of_birth || '',
    nida_number: customer?.nida_number || '',
    phone: customer?.phone || '',
    email: customer?.email || '',
    region: customer?.region || '',
    district: customer?.district || '',
    ward: customer?.ward || '',
    street: customer?.street || '',
    occupation: customer?.occupation || '',
    monthly_income: customer?.monthly_income || '',
    risk_level: customer?.risk_level || 'medium',
    status: customer?.status || 'active',
  });

  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data) => {
      if (isEditing) {
        return customerAPI.update(customer.id, data);
      }
      return customerAPI.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['customers']);
      toast.success(isEditing ? t('Mteja amesasishwa kikamilifu') : t('Mteja ameundwa kikamilifu'));
      onClose();
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || t('Operesheni imeshindwa'));
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
        
        <div className="relative bg-white rounded-xl shadow-xl max-w-3xl w-full p-6 max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6 sticky top-0 bg-white z-10 pb-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              {isEditing ? t('Hariri Mteja') : t('Mteja Mpya')}
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              {t('Funga')}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('Jina la Kwanza')} *</label>
                <input
                  type="text"
                  required
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('Jina la Kati')}</label>
                <input
                  type="text"
                  value={formData.middle_name}
                  onChange={(e) => setFormData({ ...formData, middle_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('Jina la Mwisho')} *</label>
                <input
                  type="text"
                  required
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('Jinsia')} *</label>
                <select
                  required
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="M">{t('Mwanamume')}</option>
                  <option value="F">{t('Mwanamke')}</option>
                  <option value="O">{t('Nyingine')}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('Tarehe ya Kuzaliwa')} *</label>
                <input
                  type="date"
                  required
                  value={formData.date_of_birth}
                  onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('Nambari ya NIDA')}</label>
                <input
                  type="text"
                  value={formData.nida_number}
                  onChange={(e) => setFormData({ ...formData, nida_number: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder={t('Si lazima')}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('Simu')} *</label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="0712345678"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('Barua pepe')}</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder={t('Si lazima')}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('Kazi')} *</label>
              <input
                type="text"
                required
                value={formData.occupation}
                onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder={t('Mfano: Mkulima, Mfanyabiashara, Mwalimu')}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('Mapato ya Mwezi')} (TZS) *</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="1000"
                  value={formData.monthly_income}
                  onChange={(e) => setFormData({ ...formData, monthly_income: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('Kiwango cha Hatari')}</label>
                <select
                  value={formData.risk_level}
                  onChange={(e) => setFormData({ ...formData, risk_level: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="low">{t('Hatari ya Chini')}</option>
                  <option value="medium">{t('Hatari ya Wastani')}</option>
                  <option value="high">{t('Hatari ya Juu')}</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('Mkoa')} *</label>
                <input
                  type="text"
                  required
                  value={formData.region}
                  onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder={t('Mfano: Dar es Salaam')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('Wilaya')} *</label>
                <input
                  type="text"
                  required
                  value={formData.district}
                  onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder={t('Mfano: Kinondoni')}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('Kata')}</label>
                <input
                  type="text"
                  value={formData.ward}
                  onChange={(e) => setFormData({ ...formData, ward: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder={t('Si lazima')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('Mtaa')}</label>
                <input
                  type="text"
                  value={formData.street}
                  onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder={t('Si lazima')}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('Hali')}</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="active">{t('Inaendelea')}</option>
                <option value="inactive">{t('Haifanyi kazi')}</option>
                <option value="blacklisted">{t('Orodha Nyeusi')}</option>
              </select>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                {t('Ghairi')}
              </button>
              <button type="submit" disabled={mutation.isLoading} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50">
                {mutation.isLoading ? t('Inahifadhi...') : isEditing ? t('Sasisha') : t('Hifadhi')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CustomerForm;