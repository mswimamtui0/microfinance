import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { formatCurrency } from '../../utils/formatters';
import Loading from '../Common/Loading';
import { reportAPI, loanAPI, customerAPI, paymentAPI } from '../../api';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

const AdminDashboard = ({ user }) => {
  const [dateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().slice(0, 10),
    end: new Date().toISOString().slice(0, 10),
  });

  const { data: portfolio, isLoading: portfolioLoading } = useQuery({
    queryKey: ['portfolio-report', dateRange],
    queryFn: () => reportAPI.getPortfolio(dateRange),
  });

  const { data: loans, isLoading: loansLoading } = useQuery({
    queryKey: ['recent-loans'],
    queryFn: () => loanAPI.getAll({ limit: 10 }),
  });

  const { data: customers, isLoading: customersLoading } = useQuery({
    queryKey: ['recent-customers'],
    queryFn: () => customerAPI.getAll({ limit: 10 }),
  });

  const { data: paymentSummary } = useQuery({
    queryKey: ['payment-summary'],
    queryFn: () => paymentAPI.getSummary(),
  });

  if (portfolioLoading || loansLoading || customersLoading) {
    return <Loading />;
  }

  // Stats data
  const stats = [
    {
      name: 'Total Portfolio',
      value: formatCurrency(portfolio?.data?.total_portfolio || 0),
      change: '+12.5%',
      changeType: 'positive',
      color: '#0ea5e9',
    },
    {
      name: 'Active Loans',
      value: portfolio?.data?.active_loans || 0,
      change: '+5.2%',
      changeType: 'positive',
      color: '#22c55e',
    },
    {
      name: 'Total Customers',
      value: portfolio?.data?.total_customers || 0,
      change: '+8.1%',
      changeType: 'positive',
      color: '#8b5cf6',
    },
    {
      name: 'Total Branches',
      value: 5,
      change: '0%',
      changeType: 'neutral',
      color: '#f59e0b',
    },
    {
      name: 'Collection Rate',
      value: `${portfolio?.data?.collection_rate || 0}%`,
      change: portfolio?.data?.collection_rate > 85 ? '+3.2%' : '-2.1%',
      changeType: portfolio?.data?.collection_rate > 85 ? 'positive' : 'negative',
      color: '#6366f1',
    },
    {
      name: 'Overdue Loans',
      value: portfolio?.data?.overdue_loans || 0,
      change: '-2.5%',
      changeType: 'positive',
      color: '#ef4444',
    },
  ];

  // Bar Chart Data - Financial Performance
  const barChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      {
        label: 'Disbursements',
        data: [12000000, 15000000, 18000000, 22000000, 25000000, 30000000, 28000000, 35000000, 32000000, 38000000, 40000000, 45000000],
        backgroundColor: 'rgba(14, 165, 233, 0.8)',
        borderColor: 'rgb(14, 165, 233)',
        borderWidth: 2,
      },
      {
        label: 'Collections',
        data: [8000000, 10000000, 12000000, 15000000, 18000000, 22000000, 25000000, 28000000, 30000000, 32000000, 35000000, 38000000],
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
        borderColor: 'rgb(34, 197, 94)',
        borderWidth: 2,
      },
    ],
  };

  // Doughnut Chart Data - Portfolio Quality
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

  // Line Chart Data - Growth Metrics
  const lineData = {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    datasets: [
      {
        label: 'New Customers',
        data: [12, 19, 15, 22],
        borderColor: 'rgb(14, 165, 233)',
        backgroundColor: 'rgba(14, 165, 233, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'New Loans',
        data: [8, 12, 10, 18],
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  // Bar Chart Options
  const barOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: {
            size: 12,
          },
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

  // Doughnut Chart Options
  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          font: {
            size: 12,
          },
        },
      },
    },
  };

  // Line Chart Options
  const lineOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: {
            size: 12,
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const quickActions = [
    { name: 'Manage Users', href: '/admin/users', color: '#8b5cf6' },
    { name: 'System Settings', href: '/admin/settings', color: '#6b7280' },
    { name: 'Audit Logs', href: '/admin/audit', color: '#6b7280' },
    { name: 'Export Reports', href: '/reports/export', color: '#22c55e' },
    { name: 'Manage Branches', href: '/admin/branches', color: '#0ea5e9' },
    { name: 'New Loan', href: '/loans/new', color: '#0ea5e9' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div style={{
        background: 'linear-gradient(135deg, #0284c7, #0369a1)',
        borderRadius: '16px',
        padding: '24px',
        color: 'white'
      }}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h1 className="text-2xl font-bold">
              Welcome, {user?.first_name || user?.username}!
            </h1>
            <p style={{ opacity: 0.9, marginTop: '4px' }}>
              System Administrator • Full System Access
            </p>
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <span style={{ padding: '4px 12px', background: 'rgba(255,255,255,0.2)', borderRadius: '20px', fontSize: '12px' }}>
                Super Admin
              </span>
              <span style={{ padding: '4px 12px', background: 'rgba(255,255,255,0.2)', borderRadius: '20px', fontSize: '12px' }}>
                All Branches
              </span>
            </div>
          </div>
          <div style={{ marginTop: '16px', display: 'flex', gap: '12px' }}>
            <button style={{ padding: '8px 16px', background: 'white', color: '#0369a1', borderRadius: '8px', border: 'none', fontWeight: '500', cursor: 'pointer' }}>
              Export System Report
            </button>
          </div>
        </div>
      </div>
// In AdminDashboard.jsx, add this section after the stats

{/* Loan Products Quick Access */}
<div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
  <div className="flex justify-between items-center mb-4">
    <h3 className="text-lg font-semibold text-gray-900">Loan Products</h3>
    <Link to="/admin/loan-products" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
      Manage Products →
    </Link>
  </div>
  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
    <Link to="/admin/loan-products/add" className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
      <span className="text-2xl mr-2">➕</span>
      <span className="text-sm font-medium">Add Product</span>
    </Link>
    <Link to="/admin/loan-products" className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
      <span className="text-2xl mr-2">📋</span>
      <span className="text-sm font-medium">View Products</span>
    </Link>
    <Link to="/admin/customers" className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
      <span className="text-2xl mr-2">👥</span>
      <span className="text-sm font-medium">Manage Customers</span>
    </Link>
    <Link to="/admin/loans" className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
      <span className="text-2xl mr-2">💰</span>
      <span className="text-sm font-medium">Manage Loans</span>
    </Link>
  </div>
</div>
      {/* Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '16px'
      }}>
        {stats.map((stat) => (
          <div key={stat.name} style={{
            background: 'white',
            borderRadius: '12px',
            padding: '16px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: '1px solid #e5e7eb'
          }}>
            <p style={{ fontSize: '12px', fontWeight: '500', color: '#6b7280' }}>{stat.name}</p>
            <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937', marginTop: '4px' }}>
              {stat.value}
            </p>
            <span style={{
              fontSize: '11px',
              color: stat.changeType === 'positive' ? '#22c55e' : stat.changeType === 'negative' ? '#ef4444' : '#6b7280'
            }}>
              {stat.change}
            </span>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        border: '1px solid #e5e7eb'
      }}>
        <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>Quick Actions</h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: '12px'
        }}>
          {quickActions.map((action) => (
            <Link key={action.name} to={action.href} style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '16px',
              border: '1px solid #e5e7eb',
              borderRadius: '12px',
              textDecoration: 'none',
              color: '#374151',
              background: 'white',
              transition: 'background 0.2s'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: action.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '18px'
              }}>
                {action.name.charAt(0)}
              </div>
              <span style={{ fontSize: '12px', fontWeight: '500', marginTop: '8px', textAlign: 'center' }}>{action.name}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Charts Section */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: '24px'
      }}>
        {/* Bar Chart */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600' }}>Financial Performance</h3>
            <select style={{ padding: '4px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px' }}>
              <option>This Year</option>
              <option>Last Year</option>
              <option>Last 6 Months</option>
            </select>
          </div>
          <div style={{ height: '300px' }}>
            <Bar data={barChartData} options={barOptions} />
          </div>
        </div>

        {/* Doughnut Chart */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>Portfolio Quality</h3>
          <div style={{ height: '250px' }}>
            <Doughnut data={doughnutData} options={doughnutOptions} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginTop: '12px', textAlign: 'center' }}>
            <div>
              <p style={{ fontWeight: '600', color: '#22c55e' }}>{portfolio?.data?.performing || 75}%</p>
              <p style={{ fontSize: '12px', color: '#6b7280' }}>Performing</p>
            </div>
            <div>
              <p style={{ fontWeight: '600', color: '#f59e0b' }}>{portfolio?.data?.overdue_rate || 15}%</p>
              <p style={{ fontSize: '12px', color: '#6b7280' }}>Overdue</p>
            </div>
            <div>
              <p style={{ fontWeight: '600', color: '#ef4444' }}>{portfolio?.data?.default_rate || 10}%</p>
              <p style={{ fontSize: '12px', color: '#6b7280' }}>Defaulted</p>
            </div>
          </div>
        </div>
      </div>

      {/* Line Chart - Growth Metrics */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        border: '1px solid #e5e7eb'
      }}>
        <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>Growth Metrics</h3>
        <div style={{ height: '250px' }}>
          <Line data={lineData} options={lineOptions} />
        </div>
      </div>

      {/* Recent Activity */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '24px'
      }}>
        {/* Recent Loans */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600' }}>Recent Loans</h3>
            <Link to="/loans" style={{ color: '#0284c7', fontSize: '14px' }}>View All →</Link>
          </div>
          {loans?.data?.results?.slice(0, 5).map((loan) => (
            <div key={loan.id} style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '12px',
              background: '#f9fafb',
              borderRadius: '8px',
              marginBottom: '8px'
            }}>
              <div>
                <p style={{ fontWeight: '500', fontSize: '14px' }}>{loan.loan_no}</p>
                <p style={{ fontSize: '12px', color: '#6b7280' }}>
                  {loan.customer_details?.first_name} {loan.customer_details?.last_name}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontWeight: '600', fontSize: '14px' }}>{formatCurrency(loan.principal)}</p>
                <span style={{
                  padding: '2px 8px',
                  fontSize: '11px',
                  borderRadius: '20px',
                  background: loan.status === 'active' ? '#dcfce7' : '#fef3c7',
                  color: loan.status === 'active' ? '#166534' : '#92400e'
                }}>
                  {loan.status}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Customers */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600' }}>Recent Customers</h3>
            <Link to="/customers" style={{ color: '#0284c7', fontSize: '14px' }}>View All →</Link>
          </div>
          {customers?.data?.results?.slice(0, 5).map((customer) => (
            <div key={customer.id} style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '12px',
              background: '#f9fafb',
              borderRadius: '8px',
              marginBottom: '8px',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: '#e0f2fe',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '600',
                  color: '#0284c7',
                  fontSize: '14px'
                }}>
                  {customer.first_name?.[0]}{customer.last_name?.[0]}
                </div>
                <div>
                  <p style={{ fontWeight: '500', fontSize: '14px' }}>{customer.first_name} {customer.last_name}</p>
                  <p style={{ fontSize: '12px', color: '#6b7280' }}>{customer.phone}</p>
                </div>
              </div>
              <span style={{
                padding: '2px 8px',
                fontSize: '11px',
                borderRadius: '20px',
                background: customer.status === 'active' ? '#dcfce7' : '#fef3c7',
                color: customer.status === 'active' ? '#166534' : '#92400e'
              }}>
                {customer.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* System Status */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        border: '1px solid #e5e7eb'
      }}>
        <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>System Status</h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#22c55e', display: 'inline-block' }}></span>
            <span style={{ fontSize: '14px', fontWeight: '500' }}>API: Online</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#22c55e', display: 'inline-block' }}></span>
            <span style={{ fontSize: '14px', fontWeight: '500' }}>Database: Connected</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', background: '#fefce8', borderRadius: '8px', border: '1px solid #fde68a' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }}></span>
            <span style={{ fontSize: '14px', fontWeight: '500' }}>Backup: 2 hours ago</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#22c55e', display: 'inline-block' }}></span>
            <span style={{ fontSize: '14px', fontWeight: '500' }}>Users Online: 12</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;