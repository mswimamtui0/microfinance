import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { reportAPI, loanAPI, customerAPI, paymentAPI } from '../api';
import { Link } from 'react-router-dom';
import { 
  UsersIcon, 
  CreditCardIcon, 
  CurrencyDollarIcon, 
  ExclamationTriangleIcon,
  ChartBarIcon,
  BuildingOfficeIcon,
  UserGroupIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  PlusIcon,
  EyeIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline';
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
import Loading from '../components/Common/Loading';
import { formatCurrency, formatDate } from '../utils/formatters';

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

const HomeDashboard = () => {
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().slice(0, 10),
    end: new Date().toISOString().slice(0, 10),
  });

  // Fetch dashboard data
  const { data: portfolio, isLoading: portfolioLoading } = useQuery({
    queryKey: ['portfolio-report', dateRange],
    queryFn: () => reportAPI.getPortfolio(dateRange),
  });

  const { data: loans, isLoading: loansLoading } = useQuery({
    queryKey: ['recent-loans'],
    queryFn: () => loanAPI.getAll({ limit: 5 }),
  });

  const { data: customers, isLoading: customersLoading } = useQuery({
    queryKey: ['recent-customers'],
    queryFn: () => customerAPI.getAll({ limit: 5 }),
  });

  const { data: paymentSummary, isLoading: paymentLoading } = useQuery({
    queryKey: ['payment-summary'],
    queryFn: () => paymentAPI.getSummary(),
  });

  if (portfolioLoading || loansLoading || customersLoading || paymentLoading) {
    return <Loading />;
  }

  // Role-based welcome message
  const getWelcomeMessage = () => {
    const roleMessages = {
      admin: 'System Administrator',
      manager: 'Branch Manager',
      officer: 'Loan Officer',
      teller: 'Teller',
      viewer: 'Viewer',
    };
    return roleMessages[user?.role] || 'User';
  };

  // Role-based quick actions
  const getQuickActions = () => {
    const actions = {
      admin: [
        { name: 'Manage Users', icon: UserGroupIcon, href: '/admin/users', color: 'bg-purple-500' },
        { name: 'System Settings', icon: ChartBarIcon, href: '/admin/settings', color: 'bg-blue-500' },
        { name: 'Audit Logs', icon: EyeIcon, href: '/admin/audit', color: 'bg-gray-500' },
        { name: 'Export Reports', icon: DocumentArrowDownIcon, href: '/reports/export', color: 'bg-green-500' },
      ],
      manager: [
        { name: 'New Loan', icon: PlusIcon, href: '/loans/new', color: 'bg-primary-500' },
        { name: 'Approve Loans', icon: CheckCircleIcon, href: '/loans/pending', color: 'bg-green-500' },
        { name: 'View Reports', icon: ChartBarIcon, href: '/reports', color: 'bg-blue-500' },
        { name: 'Manage Branch', icon: BuildingOfficeIcon, href: '/branches', color: 'bg-purple-500' },
      ],
      officer: [
        { name: 'New Application', icon: PlusIcon, href: '/loans/new', color: 'bg-primary-500' },
        { name: 'My Clients', icon: UsersIcon, href: '/customers', color: 'bg-blue-500' },
        { name: 'Record Payment', icon: CurrencyDollarIcon, href: '/payments/new', color: 'bg-green-500' },
        { name: 'My Loans', icon: CreditCardIcon, href: '/loans', color: 'bg-purple-500' },
      ],
      teller: [
        { name: 'Record Payment', icon: CurrencyDollarIcon, href: '/payments/new', color: 'bg-primary-500' },
        { name: 'Today\'s Transactions', icon: ClockIcon, href: '/payments', color: 'bg-blue-500' },
        { name: 'Cash Summary', icon: ChartBarIcon, href: '/reports', color: 'bg-green-500' },
      ],
      viewer: [
        { name: 'View Reports', icon: ChartBarIcon, href: '/reports', color: 'bg-primary-500' },
        { name: 'Dashboard', icon: EyeIcon, href: '/', color: 'bg-blue-500' },
        { name: 'Download Reports', icon: DocumentArrowDownIcon, href: '/reports/export', color: 'bg-green-500' },
      ],
    };
    return actions[user?.role] || actions.viewer;
  };

  // Role-based statistics
  const getStats = () => {
    const baseStats = [
      {
        name: 'Total Portfolio',
        value: formatCurrency(portfolio?.data?.total_portfolio || 0),
        icon: CurrencyDollarIcon,
        change: '+12%',
        changeType: 'positive',
        color: 'bg-blue-500',
      },
      {
        name: 'Active Loans',
        value: portfolio?.data?.active_loans || 0,
        icon: CreditCardIcon,
        change: '+5%',
        changeType: 'positive',
        color: 'bg-green-500',
      },
      {
        name: 'Total Customers',
        value: portfolio?.data?.total_customers || 0,
        icon: UsersIcon,
        change: '+8%',
        changeType: 'positive',
        color: 'bg-purple-500',
      },
      {
        name: 'Collection Rate',
        value: `${portfolio?.data?.collection_rate || 0}%`,
        icon: ChartBarIcon,
        change: portfolio?.data?.collection_rate > 85 ? '+3%' : '-2%',
        changeType: portfolio?.data?.collection_rate > 85 ? 'positive' : 'negative',
        color: 'bg-orange-500',
      },
    ];

    // Add role-specific stats
    if (user?.role === 'admin' || user?.role === 'manager') {
      baseStats.push({
        name: 'Overdue Loans',
        value: portfolio?.data?.overdue_loans || 0,
        icon: ExclamationTriangleIcon,
        change: '-2%',
        changeType: portfolio?.data?.overdue_loans < 10 ? 'positive' : 'negative',
        color: 'bg-red-500',
      });
    }

    if (user?.role === 'teller') {
      baseStats.push({
        name: 'Today\'s Collections',
        value: formatCurrency(paymentSummary?.data?.today_collected || 0),
        icon: CurrencyDollarIcon,
        change: '+15%',
        changeType: 'positive',
        color: 'bg-green-500',
      });
    }

    if (user?.role === 'officer') {
      baseStats.push({
        name: 'My Active Loans',
        value: loans?.data?.results?.filter(l => l.status === 'active').length || 0,
        icon: CreditCardIcon,
        change: '+2%',
        changeType: 'positive',
        color: 'bg-primary-500',
      });
    }

    return baseStats;
  };

  // Chart data
  const chartData = {
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

  const quickActions = getQuickActions();
  const stats = getStats();

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back, {user?.first_name || user?.username}! 👋
            </h1>
            <p className="text-gray-600 mt-1">
              {getWelcomeMessage()} • {user?.branch_name || 'All Branches'}
            </p>
            <div className="flex items-center mt-2 space-x-2">
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-primary-100 text-primary-700">
                {user?.role}
              </span>
              {user?.is_superuser && (
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-700">
                  Super Admin
                </span>
              )}
            </div>
          </div>
          <div className="flex space-x-3 mt-4 md:mt-0">
            <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium">
              <PlusIcon className="w-4 h-4 inline mr-1" />
              New Loan
            </button>
            <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
              <DocumentArrowDownIcon className="w-4 h-4 inline mr-1" />
              Export Report
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.name}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  <div className="flex items-center mt-1">
                    <span className={`text-xs font-medium ${stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'}`}>
                      {stat.change}
                    </span>
                    <span className="text-xs text-gray-500 ml-1">vs last month</span>
                  </div>
                </div>
                <div className={`${stat.color} p-3 rounded-xl`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.name}
                to={action.href}
                className="flex flex-col items-center p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors group"
              >
                <div className={`${action.color} p-3 rounded-xl group-hover:scale-105 transition-transform`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-sm font-medium text-gray-700 mt-2">{action.name}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Financial Performance</h3>
            <select className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option>This Year</option>
              <option>Last Year</option>
              <option>Last 6 Months</option>
            </select>
          </div>
          <Bar 
            data={chartData} 
            options={{ 
              responsive: true,
              plugins: {
                legend: {
                  position: 'top',
                },
              },
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: {
                    callback: function(value) {
                      return 'TZS ' + (value / 1000000).toFixed(0) + 'M';
                    }
                  }
                }
              }
            }} 
          />
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Portfolio Quality</h3>
          <div className="relative" style={{ height: '250px' }}>
            <Doughnut 
              data={doughnutData} 
              options={{ 
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                  },
                },
              }} 
            />
          </div>
          <div className="grid grid-cols-3 gap-2 mt-4 text-center">
            <div>
              <p className="text-sm font-medium text-green-600">{portfolio?.data?.performing || 75}%</p>
              <p className="text-xs text-gray-500">Performing</p>
            </div>
            <div>
              <p className="text-sm font-medium text-yellow-600">{portfolio?.data?.overdue_rate || 15}%</p>
              <p className="text-xs text-gray-500">Overdue</p>
            </div>
            <div>
              <p className="text-sm font-medium text-red-600">{portfolio?.data?.default_rate || 10}%</p>
              <p className="text-xs text-gray-500">Defaulted</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Loans */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Loans</h3>
            <Link to="/loans" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              View All →
            </Link>
          </div>
          <div className="space-y-3">
            {loans?.data?.results?.slice(0, 5).map((loan) => (
              <div key={loan.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {loan.loan_no}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {loan.customer_details?.first_name} {loan.customer_details?.last_name}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{formatCurrency(loan.principal)}</p>
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full
                    ${loan.status === 'active' ? 'bg-green-100 text-green-800' : ''}
                    ${loan.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                    ${loan.status === 'draft' ? 'bg-gray-100 text-gray-800' : ''}
                    ${loan.status === 'defaulted' ? 'bg-red-100 text-red-800' : ''}
                    ${loan.status === 'paid' ? 'bg-blue-100 text-blue-800' : ''}
                  `}>
                    {loan.status}
                  </span>
                </div>
              </div>
            ))}
            {(!loans?.data?.results || loans.data.results.length === 0) && (
              <p className="text-gray-500 text-sm text-center py-4">No recent loans</p>
            )}
          </div>
        </div>

        {/* Recent Customers */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Customers</h3>
            <Link to="/customers" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              View All →
            </Link>
          </div>
          <div className="space-y-3">
            {customers?.data?.results?.slice(0, 5).map((customer) => (
              <div key={customer.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-primary-600">
                      {customer.first_name?.[0]}{customer.last_name?.[0]}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {customer.first_name} {customer.last_name}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{customer.phone}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full
                    ${customer.status === 'active' ? 'bg-green-100 text-green-800' : ''}
                    ${customer.status === 'inactive' ? 'bg-gray-100 text-gray-800' : ''}
                    ${customer.status === 'blacklisted' ? 'bg-red-100 text-red-800' : ''}
                  `}>
                    {customer.status}
                  </span>
                </div>
              </div>
            ))}
            {(!customers?.data?.results || customers.data.results.length === 0) && (
              <p className="text-gray-500 text-sm text-center py-4">No recent customers</p>
            )}
          </div>
        </div>
      </div>

      {/* System Status (Admin/Manager only) */}
      {(user?.role === 'admin' || user?.role === 'manager') && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">System Status</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-600">API: Online</span>
            </div>
            <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-600">Database: Connected</span>
            </div>
            <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Backup: 2 hours ago</span>
            </div>
            <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Users Online: 12</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomeDashboard;