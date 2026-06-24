import React, { useState } from 'react';
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
  Legend,
  ArcElement
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { formatCurrency } from '../../utils/formatters';
import Loading from '../Common/Loading';
import { reportAPI } from '../../api';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const ViewerDashboard = ({ user }) => {
  const { t } = useTranslation();
  const [dateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().slice(0, 10),
    end: new Date().toISOString().slice(0, 10),
  });

  const { data: portfolio, isLoading: portfolioLoading } = useQuery({
    queryKey: ['portfolio-report', dateRange],
    queryFn: () => reportAPI.getPortfolio(dateRange),
  });

  if (portfolioLoading) {
    return <Loading />;
  }

  const stats = [
    { name: 'Total Portfolio', value: formatCurrency(portfolio?.data?.total_portfolio || 0), color: '#0ea5e9' },
    { name: 'Active Loans', value: portfolio?.data?.active_loans || 0, color: '#22c55e' },
    { name: 'Total Customers', value: portfolio?.data?.total_customers || 0, color: '#8b5cf6' },
    { name: 'Collection Rate', value: `${portfolio?.data?.collection_rate || 0}%`, color: '#f59e0b' },
  ];

  // Bar Chart Data
  const barChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Disbursements',
        data: [12000000, 15000000, 18000000, 22000000, 25000000, 30000000],
        backgroundColor: 'rgba(14, 165, 233, 0.8)',
        borderColor: 'rgb(14, 165, 233)',
        borderWidth: 2,
      },
      {
        label: 'Collections',
        data: [8000000, 10000000, 12000000, 15000000, 18000000, 22000000],
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
        borderColor: 'rgb(34, 197, 94)',
        borderWidth: 2,
      },
    ],
  };

  // Doughnut Chart Data
  const doughnutData = {
    labels: ['Performing', 'Overdue', 'Defaulted'],
    datasets: [
      {
        data: [portfolio?.data?.performing || 75, portfolio?.data?.overdue_rate || 15, portfolio?.data?.default_rate || 10],
        backgroundColor: ['#22c55e', '#f59e0b', '#ef4444'],
        borderWidth: 0,
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

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          font: { size: 12 },
        },
      },
    },
  };

  const quickActions = [
    { name: 'View Reports', href: '/reports', color: '#0ea5e9' },
    { name: 'Dashboard', href: '/', color: '#3b82f6' },
    { name: 'Download Reports', href: '/reports/export', color: '#22c55e' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div style={{ background: 'linear-gradient(135deg, #4b5563, #374151)', borderRadius: '16px', padding: '24px', color: 'white' }}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h1 className="text-2xl font-bold">Welcome, {user?.first_name || user?.username}!</h1>
            <p style={{ opacity: 0.9, marginTop: '4px' }}>Viewer • Read-Only Access</p>
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <span style={{ padding: '4px 12px', background: 'rgba(255,255,255,0.2)', borderRadius: '20px', fontSize: '12px' }}>Viewer</span>
              <span style={{ padding: '4px 12px', background: 'rgba(255,255,255,0.2)', borderRadius: '20px', fontSize: '12px' }}>Read-Only</span>
            </div>
          </div>
          <div style={{ marginTop: '16px' }}>
            <button style={{ padding: '8px 16px', background: 'white', color: '#374151', borderRadius: '8px', border: 'none', fontWeight: '500', cursor: 'pointer' }}>
              Download Reports
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        {stats.map((stat) => (
          <div key={stat.name} style={{ background: 'white', borderRadius: '12px', padding: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb' }}>
            <p style={{ fontSize: '12px', fontWeight: '500', color: '#6b7280' }}>{stat.name}</p>
            <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937', marginTop: '4px' }}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>Quick Actions</h3>
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

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Bar Chart */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>System Performance</h3>
          <div style={{ height: '300px' }}>
            <Bar data={barChartData} options={barOptions} />
          </div>
        </div>

        {/* Doughnut Chart */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>Portfolio Quality</h3>
          <div style={{ height: '250px' }}>
            <Doughnut data={doughnutData} options={doughnutOptions} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginTop: '12px', textAlign: 'center' }}>
            <div><p style={{ fontWeight: '600', color: '#22c55e' }}>{portfolio?.data?.performing || 75}%</p><p style={{ fontSize: '12px', color: '#6b7280' }}>Performing</p></div>
            <div><p style={{ fontWeight: '600', color: '#f59e0b' }}>{portfolio?.data?.overdue_rate || 15}%</p><p style={{ fontSize: '12px', color: '#6b7280' }}>Overdue</p></div>
            <div><p style={{ fontWeight: '600', color: '#ef4444' }}>{portfolio?.data?.default_rate || 10}%</p><p style={{ fontSize: '12px', color: '#6b7280' }}>Defaulted</p></div>
          </div>
        </div>
      </div>

      {/* System Overview */}
      <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>System Overview</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          <div style={{ padding: '12px', background: '#f9fafb', borderRadius: '8px', textAlign: 'center' }}>
            <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>{portfolio?.data?.total_customers || 0}</p>
            <p style={{ fontSize: '12px', color: '#6b7280' }}>Total Clients</p>
          </div>
          <div style={{ padding: '12px', background: '#f9fafb', borderRadius: '8px', textAlign: 'center' }}>
            <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>{portfolio?.data?.active_loans || 0}</p>
            <p style={{ fontSize: '12px', color: '#6b7280' }}>Active Loans</p>
          </div>
          <div style={{ padding: '12px', background: '#f9fafb', borderRadius: '8px', textAlign: 'center' }}>
            <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>{formatCurrency(portfolio?.data?.total_portfolio || 0)}</p>
            <p style={{ fontSize: '12px', color: '#6b7280' }}>Total Portfolio</p>
          </div>
          <div style={{ padding: '12px', background: '#f9fafb', borderRadius: '8px', textAlign: 'center' }}>
            <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>{portfolio?.data?.collection_rate || 0}%</p>
            <p style={{ fontSize: '12px', color: '#6b7280' }}>Collection Rate</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewerDashboard;