import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentAPI, loanAPI } from '../api';
import PaymentForm from '../components/Payments/PaymentForm';
import Loading from '../components/Common/Loading';
import { formatCurrency, formatDate } from '../utils/formatters';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

const Payments = () => {
  const { t } = useTranslation();
  const [showForm, setShowForm] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const queryClient = useQueryClient();

  // Check URL params for loan ID
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const loanId = params.get('loan');
    if (loanId) {
      setSelectedLoan({ id: parseInt(loanId) });
      setShowForm(true);
    }
  }, []);

  const { data: payments, isLoading } = useQuery({
    queryKey: ['payments', searchTerm, filterStatus],
    queryFn: () => paymentAPI.getAll({ search: searchTerm, status: filterStatus }),
  });

  const { data: loans } = useQuery({
    queryKey: ['loans-for-payment'],
    queryFn: () => loanAPI.getAll({ status: 'active' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => paymentAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['payments']);
      toast.success(t('Payment deleted successfully'));
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || t('Failed to delete payment'));
    },
  });

  if (isLoading) return <Loading />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">{t('Payment Management')}</h1>
        <button
          onClick={() => { setSelectedLoan(null); setShowForm(true); }}
          className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          {t('New Payment')}
        </button>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder={t('Search payments by reference or customer...')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="">{t('All Status')}</option>
          <option value="completed">{t('Completed')}</option>
          <option value="pending">{t('Pending')}</option>
          <option value="failed">{t('Failed')}</option>
          <option value="reversed">{t('Reversed')}</option>
        </select>
      </div>

      {/* Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '16px'
      }}>
        <div style={{ background: 'white', borderRadius: '12px', padding: '16px', border: '1px solid #e5e7eb' }}>
          <p style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280' }}>{t('Total Collected')}</p>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>
            {formatCurrency(payments?.data?.results?.reduce((sum, p) => sum + p.amount_paid, 0) || 0)}
          </p>
        </div>
        <div style={{ background: 'white', borderRadius: '12px', padding: '16px', border: '1px solid #e5e7eb' }}>
          <p style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280' }}>{t("Today's Payments")}</p>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>
            {payments?.data?.results?.filter(p => new Date(p.payment_date).toDateString() === new Date().toDateString()).length || 0}
          </p>
        </div>
        <div style={{ background: 'white', borderRadius: '12px', padding: '16px', border: '1px solid #e5e7eb' }}>
          <p style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280' }}>{t('Completed')}</p>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#22c55e' }}>
            {payments?.data?.results?.filter(p => p.status === 'completed').length || 0}
          </p>
        </div>
        <div style={{ background: 'white', borderRadius: '12px', padding: '16px', border: '1px solid #e5e7eb' }}>
          <p style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280' }}>{t('Pending')}</p>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#f59e0b' }}>
            {payments?.data?.results?.filter(p => p.status === 'pending').length || 0}
          </p>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('Reference')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('Loan')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('Customer')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('Amount')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('Method')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('Status')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('Date')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('Actions')}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payments?.data?.results?.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {payment.transaction_ref}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {payment.loan?.loan_no}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {payment.loan?.customer?.first_name} {payment.loan?.customer?.last_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatCurrency(payment.amount_paid)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                    {t(payment.payment_method)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      payment.status === 'completed' ? 'bg-green-100 text-green-800' :
                      payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {t(payment.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(payment.payment_date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => {
                        if (window.confirm(t('Are you sure you want to delete this payment?'))) {
                          deleteMutation.mutate(payment.id);
                        }
                      }}
                      className="text-red-600 hover:text-red-900"
                    >
                      {t('Delete')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Form Modal */}
      {showForm && (
        <PaymentForm
          onClose={() => { setShowForm(false); setSelectedLoan(null); }}
          loans={loans?.data?.results || []}
          selectedLoan={selectedLoan}
        />
      )}
    </div>
  );
};

export default Payments;