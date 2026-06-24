import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { formatCurrency } from '../../utils/formatters';
import Loading from '../Common/Loading';
import { loanAPI, customerAPI } from '../../api';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const OfficerDashboard = ({ user }) => {
  const { t } = useTranslation();

  const { data: loans, isLoading: loansLoading } = useQuery({
    queryKey: ['my-loans'],
    queryFn: () => loanAPI.getAll({ limit: 20 }),
  });

  const { data: customers, isLoading: customersLoading } = useQuery({
    queryKey: ['my-customers'],
    queryFn: () => customerAPI.getAll({ limit: 20 }),
  });

  if (loansLoading || customersLoading) {
    return <Loading />;
  }

  const myLoans = loans?.data?.results || [];
  const activeLoans = myLoans.filter(l => l.status === 'active');
  const pendingLoans = myLoans.filter(l => l.status === 'pending');

  const stats = [
    { name: t('My Active Loans'), value: activeLoans.length, color: '#3b82f6' },
    { name: t('My Clients'), value: customers?.data?.results?.length || 0, color: '#22c55e' },
    { name: t('Portfolio Managed'), value: formatCurrency(activeLoans.reduce((sum, l) => sum + l.principal, 0)), color: '#8b5cf6' },
    { name: t('Pending Applications'), value: pendingLoans.length, color: '#f59e0b' },
  ];

  const chartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: t('My Disbursements'),
        data: [2000000, 3000000, 2500000, 4000000, 3500000, 4500000],
        backgroundColor: 'rgba(14, 165, 233, 0.8)',
        borderColor: 'rgb(14, 165, 233)',
        borderWidth: 2,
      },
      {
        label: t('My Collections'),
        data: [1500000, 2000000, 2500000, 3000000, 3200000, 3800000],
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
        borderColor: 'rgb(34, 197, 94)',
        borderWidth: 2,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: { size: 12 },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return 'TZS ' + (value / 1000000).toFixed(0) + 'M';
          },
        },
      },
    },
  };

  const quickActions = [
    { name: t('New Application'), href: '/loans/new', color: '#0ea5e9' },
    { name: t('My Clients'), href: '/customers', color: '#3b82f6' },
    { name: t('Record Payment'), href: '/payments/new', color: '#22c55e' },
    { name: t('Schedule Visit'), href: '/schedule', color: '#8b5cf6' },
  ];

  return (
    <div className="space-y-6">
      <div style={{ background: 'linear-gradient(135deg, #2563eb, #0891b2)', borderRadius: '16px', padding: '24px', color: 'white' }}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h1 className="text-2xl font-bold">{t('Welcome')}, {user?.first_name || user?.username}!</h1>
            <p style={{ opacity: 0.9, marginTop: '4px' }}>{t('Loan Officer')} • {user?.branch_name || t('Branch')}</p>
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <span style={{ padding: '4px 12px', background: 'rgba(255,255,255,0.2)', borderRadius: '20px', fontSize: '12px' }}>{t('Officer')}</span>
              <span style={{ padding: '4px 12px', background: 'rgba(255,255,255,0.2)', borderRadius: '20px', fontSize: '12px' }}>{activeLoans.length} {t('Active Loans')}</span>
            </div>
          </div>
          <div style={{ marginTop: '16px' }}>
            <Link to="/loans/new" style={{ padding: '8px 16px', background: 'white', color: '#0891b2', borderRadius: '8px', textDecoration: 'none', fontWeight: '500' }}>
              {t('New Application')}
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>{t('My Performance')}</h3>
          <div style={{ height: '300px' }}>
            <Bar data={chartData} options={barOptions} />
          </div>
        </div>
        <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>{t('My Clients')}</h3>
          {customers?.data?.results?.slice(0, 5).map((customer) => (
            <div key={customer.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#f9fafb', borderRadius: '8px', marginBottom: '8px', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '600', color: '#0284c7' }}>
                  {customer.first_name?.[0]}{customer.last_name?.[0]}
                </div>
                <div>
                  <p style={{ fontWeight: '500', fontSize: '14px' }}>{customer.first_name} {customer.last_name}</p>
                  <p style={{ fontSize: '12px', color: '#6b7280' }}>{customer.phone}</p>
                </div>
              </div>
              <span style={{ padding: '2px 8px', fontSize: '11px', borderRadius: '20px', background: customer.status === 'active' ? '#dcfce7' : '#fef3c7', color: customer.status === 'active' ? '#166534' : '#92400e' }}>
                {t(customer.status)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600' }}>{t('My Active Loans')}</h3>
          <Link to="/loans" style={{ color: '#0284c7', fontSize: '14px' }}>{t('View All')} →</Link>
        </div>
        {activeLoans.slice(0, 5).map((loan) => (
          <div key={loan.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: '#f9fafb', borderRadius: '8px', marginBottom: '8px' }}>
            <div>
              <p style={{ fontWeight: '500', fontSize: '14px' }}>{loan.loan_no}</p>
              <p style={{ fontSize: '12px', color: '#6b7280' }}>{loan.customer_details?.first_name} {loan.customer_details?.last_name}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontWeight: '600', fontSize: '14px' }}>{formatCurrency(loan.principal)}</p>
              <p style={{ fontSize: '12px', color: '#6b7280' }}>{t('Balance')}: {formatCurrency(loan.outstanding_balance)}</p>
            </div>
          </div>
        ))}
        {activeLoans.length === 0 && (
          <p style={{ color: '#6b7280', fontSize: '14px', textAlign: 'center', padding: '16px' }}>{t('No active loans')}</p>
        )}
      </div>
    </div>
  );
};

export default OfficerDashboard;