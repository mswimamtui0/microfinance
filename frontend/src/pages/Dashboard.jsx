import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { loanAPI } from '../api';
import { formatCurrency } from '../utils/formatters';

const Dashboard = () => {
  const { user } = useAuth();

  // Fetch loans directly
  const { data: loansData, isLoading } = useQuery({
    queryKey: ['dashboard-loans'],
    queryFn: () => loanAPI.getAll(),
    refetchOnWindowFocus: true,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const loans = loansData?.data?.results || [];
  const activeLoans = loans.filter(l => l.status === 'active' || l.status === 'disbursed');
  const overdueLoans = loans.filter(l => l.is_overdue);

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary-600 to-blue-600 rounded-2xl shadow-lg p-6 text-white">
        <h1 className="text-2xl font-bold">
          Welcome, {user?.first_name || user?.username}!
        </h1>
        <p className="text-primary-100 mt-1">
          {user?.role} • {user?.branch_name || 'All Branches'}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <p className="text-sm font-medium text-gray-600">Total Loans</p>
          <p className="text-2xl font-bold text-gray-900">{loans.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <p className="text-sm font-medium text-gray-600">Active Loans</p>
          <p className="text-2xl font-bold text-gray-900">{activeLoans.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <p className="text-sm font-medium text-gray-600">Overdue</p>
          <p className="text-2xl font-bold text-red-600">{overdueLoans.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <p className="text-sm font-medium text-gray-600">Total Portfolio</p>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(loans.reduce((sum, l) => sum + (l.principal || 0), 0))}
          </p>
        </div>
      </div>

      {/* Recent Loans Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Loans</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Loan No</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loans.slice(0, 5).map((loan) => (
                <tr key={loan.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{loan.loan_no}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {loan.customer_details?.first_name} {loan.customer_details?.last_name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{formatCurrency(loan.principal)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      loan.status === 'active' ? 'bg-green-100 text-green-800' :
                      loan.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                      loan.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {loan.status}
                    </span>
                  </td>
                </tr>
              ))}
              {loans.length === 0 && (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                    No loans found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;