import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportAPI } from '../api';
import { useTranslation } from 'react-i18next';
import { 
  ChartBarIcon, 
  DocumentArrowDownIcon, 
  CalendarIcon,
  CurrencyDollarIcon,
  UsersIcon,
  CreditCardIcon
} from '@heroicons/react/24/outline';
import Loading from '../components/Common/Loading';
import { formatCurrency, formatDate } from '../utils/formatters';

const Reports = () => {
  const { t } = useTranslation();
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().slice(0, 10),
    end: new Date().toISOString().slice(0, 10),
  });

  const { data: portfolio, isLoading: portfolioLoading } = useQuery({
    queryKey: ['portfolio-report', dateRange],
    queryFn: () => reportAPI.getPortfolio(dateRange),
  });

  const { data: collections, isLoading: collectionsLoading } = useQuery({
    queryKey: ['collections-report', dateRange],
    queryFn: () => reportAPI.getCollections(dateRange),
  });

  if (portfolioLoading || collectionsLoading) return <Loading />;

  const stats = [
    {
      name: 'Total Portfolio',
      value: formatCurrency(portfolio?.data?.total_portfolio || 0),
      icon: CurrencyDollarIcon,
      color: 'bg-blue-500',
    },
    {
      name: 'Active Loans',
      value: portfolio?.data?.active_loans || 0,
      icon: CreditCardIcon,
      color: 'bg-green-500',
    },
    {
      name: 'Total Customers',
      value: portfolio?.data?.total_customers || 0,
      icon: UsersIcon,
      color: 'bg-purple-500',
    },
    {
      name: 'Collection Rate',
      value: `${portfolio?.data?.collection_rate || 0}%`,
      icon: ChartBarIcon,
      color: 'bg-orange-500',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Reports & Analytics</h1>
        <button className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">

          Export Report
        </button>
      </div>

      {/* Date Range Filter */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">

            Apply Filter
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.name}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="text-2xl font-semibold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>

                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detailed Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Collections Report */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Collections Overview</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Expected Collections</span>
              <span className="font-medium">{formatCurrency(collections?.data?.expected || 0)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Actual Collections</span>
              <span className="font-medium text-green-600">{formatCurrency(collections?.data?.actual || 0)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Collection Efficiency</span>
              <span className="font-medium text-blue-600">{collections?.data?.efficiency || 0}%</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-600">Overdue Amount</span>
              <span className="font-medium text-red-600">{formatCurrency(collections?.data?.overdue || 0)}</span>
            </div>
          </div>
        </div>

        {/* Portfolio Quality */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Portfolio Quality</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Performing Loans</span>
              <span className="font-medium text-green-600">{portfolio?.data?.performing || 0}%</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Overdue Loans</span>
              <span className="font-medium text-yellow-600">{portfolio?.data?.overdue_rate || 0}%</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Default Rate</span>
              <span className="font-medium text-red-600">{portfolio?.data?.default_rate || 0}%</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-600">PAR 30</span>
              <span className="font-medium text-orange-600">{portfolio?.data?.par_30 || 0}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Transactions</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Transaction
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {portfolio?.data?.recent_transactions?.map((transaction, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(transaction.date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {transaction.description}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatCurrency(transaction.amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full
                      ${transaction.type === 'disbursement' ? 'bg-blue-100 text-blue-800' : ''}
                      ${transaction.type === 'payment' ? 'bg-green-100 text-green-800' : ''}
                    `}>
                      {transaction.type}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;
