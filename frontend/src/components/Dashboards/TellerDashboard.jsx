import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '../../utils/formatters';
import Loading from '../Common/Loading';
import { paymentAPI } from '../../api';

const TellerDashboard = ({ user }) => {
  const { t } = useTranslation();

  const { data: payments, isLoading: paymentsLoading } = useQuery({
    queryKey: ['today-payments'],
    queryFn: () => paymentAPI.getAll({ limit: 20 }),
  });

  const { data: summary } = useQuery({
    queryKey: ['payment-summary'],
    queryFn: () => paymentAPI.getSummary(),
  });

  if (paymentsLoading) {
    return <Loading />;
  }

  const todayPayments = payments?.data?.results || [];
  const completedPayments = todayPayments.filter(p => p.status === 'completed');
  const pendingPayments = todayPayments.filter(p => p.status === 'pending');

  const stats = [
    { name: t("Today's Collections"), value: formatCurrency(summary?.data?.today_collected || 0), color: '#22c55e' },
    { name: t('Transactions Today'), value: todayPayments.length, color: '#3b82f6' },
    { name: t('Completed'), value: completedPayments.length, color: '#22c55e' },
    { name: t('Pending'), value: pendingPayments.length, color: '#f59e0b' },
  ];

  const paymentMethods = {
    cash: { count: 0, total: 0 },
    mpesa: { count: 0, total: 0 },
    airtel: { count: 0, total: 0 },
    bank: { count: 0, total: 0 },
  };

  todayPayments.forEach(p => {
    if (paymentMethods[p.payment_method]) {
      paymentMethods[p.payment_method].count++;
      paymentMethods[p.payment_method].total += p.amount_paid;
    }
  });

  const quickActions = [
    { name: t('Record Payment'), href: '/payments/new', color: '#0ea5e9' },
    { name: t("Today's Transactions"), href: '/payments', color: '#3b82f6' },
    { name: t('Cash Summary'), href: '/reports', color: '#22c55e' },
  ];

  return (
    <div className="space-y-6">
      <div style={{ background: 'linear-gradient(135deg, #16a34a, #0d9488)', borderRadius: '16px', padding: '24px', color: 'white' }}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h1 className="text-2xl font-bold">{t('Welcome')}, {user?.first_name || user?.username}!</h1>
            <p style={{ opacity: 0.9, marginTop: '4px' }}>{t('Teller')} • {user?.branch_name || t('Branch')}</p>
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <span style={{ padding: '4px 12px', background: 'rgba(255,255,255,0.2)', borderRadius: '20px', fontSize: '12px' }}>{t('Teller')}</span>
              <span style={{ padding: '4px 12px', background: 'rgba(255,255,255,0.2)', borderRadius: '20px', fontSize: '12px' }}>{todayPayments.length} {t('Transactions Today')}</span>
            </div>
          </div>
          <div style={{ marginTop: '16px' }}>
            <Link to="/payments/new" style={{ padding: '8px 16px', background: 'white', color: '#0d9488', borderRadius: '8px', textDecoration: 'none', fontWeight: '500' }}>
              {t('Record Payment')}
            </Link>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        {stats.map((stat) => (
          <div key={stat.name} style={{ background: 'white', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb' }}>
            <p style={{ fontSize: '12px', fontWeight: '500', color: '#6b7280' }}>{stat.name}</p>
            <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937', marginTop: '4px' }}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        {Object.entries(paymentMethods).map(([method, data]) => (
          <div key={method} style={{ background: 'white', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb' }}>
            <p style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280', textTransform: 'capitalize' }}>{t(method)}</p>
            <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937' }}>{data.count}</p>
            <p style={{ fontSize: '12px', color: '#6b7280' }}>{formatCurrency(data.total)}</p>
          </div>
        ))}
      </div>

      <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>{t('Quick Actions')}</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px' }}>
          {quickActions.map((action) => (
            <Link key={action.name} to={action.href} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px', border: '1px solid #e5e7eb', borderRadius: '12px', textDecoration: 'none', color: '#374151', background: 'white' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: action.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '18px' }}>
                {action.name.charAt(0)}
              </div>
              <span style={{ fontSize: '12px', fontWeight: '500', marginTop: '8px', textAlign: 'center' }}>{action.name}</span>
            </Link>
          ))}
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600' }}>{t("Today's Transactions")}</h3>
          <Link to="/payments" style={{ color: '#0284c7', fontSize: '14px' }}>{t('View All')} →</Link>
        </div>
        {todayPayments.slice(0, 10).map((payment) => (
          <div key={payment.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#f9fafb', borderRadius: '8px', marginBottom: '8px', alignItems: 'center' }}>
            <div>
              <p style={{ fontWeight: '500', fontSize: '14px' }}>{payment.transaction_ref}</p>
              <p style={{ fontSize: '12px', color: '#6b7280' }}>{payment.loan?.customer?.first_name} {payment.loan?.customer?.last_name}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontWeight: '600', fontSize: '14px' }}>{formatCurrency(payment.amount_paid)}</p>
              <p style={{ fontSize: '12px', color: '#6b7280', textTransform: 'capitalize' }}>{t(payment.payment_method)}</p>
            </div>
          </div>
        ))}
        {todayPayments.length === 0 && (
          <p style={{ color: '#6b7280', fontSize: '14px', textAlign: 'center', padding: '16px' }}>{t('No transactions today')}</p>
        )}
      </div>
    </div>
  );
};

export default TellerDashboard;