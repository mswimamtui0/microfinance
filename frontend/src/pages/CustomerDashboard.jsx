import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { formatCurrency, formatDate } from '../utils/formatters';
import Loading from '../components/Common/Loading';
import { useAuth } from '../context/AuthContext';

const CustomerDashboard = () => {
  const { user } = useAuth();
  const [customerData, setCustomerData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch customer dashboard data
    const fetchDashboard = async () => {
      try {
        // Simulate API call
        setCustomerData({
          profile: {
            first_name: 'John',
            last_name: 'Doe',
            phone: '0712345678',
          },
          summary: {
            total_loans: 3,
            active_loans: 2,
            total_borrowed: 1500000,
            total_paid: 500000,
            total_outstanding: 1000000,
            next_payment: '2026-07-01',
            next_payment_amount: 50000,
          },
          recent_loans: [
            {
              id: 1,
              loan_no: 'LN-001',
              principal: 500000,
              outstanding_balance: 300000,
              status: 'active',
              maturity_date: '2026-12-01',
            },
            {
              id: 2,
              loan_no: 'LN-002',
              principal: 1000000,
              outstanding_balance: 700000,
              status: 'active',
              maturity_date: '2027-06-01',
            },
          ],
          upcoming_payments: [
            {
              loan_no: 'LN-001',
              due_date: '2026-07-01',
              amount: 50000,
            },
            {
              loan_no: 'LN-002',
              due_date: '2026-07-15',
              amount: 75000,
            },
          ],
          notifications: [
            {
              id: 1,
              title: 'Payment Reminder',
              message: 'Your payment of 50,000 TZS is due in 7 days',
              created_at: '2026-06-24',
            },
          ],
        });
      } catch (error) {
        console.error('Error fetching dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return <Loading />;
  }

  const data = customerData;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {data?.profile.first_name}!
          </h1>
          <p className="text-gray-600 mt-1">
            Customer Portal • {data?.profile.phone}
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Total Loans</p>
            <p className="text-2xl font-bold text-gray-900">{data?.summary.total_loans}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Active Loans</p>
            <p className="text-2xl font-bold text-green-600">{data?.summary.active_loans}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Total Borrowed</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(data?.summary.total_borrowed)}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <p className="text-sm text-gray-500">Next Payment</p>
            <p className="text-lg font-bold text-primary-600">
              {data?.summary.next_payment ? formatDate(data.summary.next_payment) : '-'}
            </p>
            <p className="text-sm text-gray-500">{formatCurrency(data?.summary.next_payment_amount)}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <Link
            to="/customer/apply-loan"
            className="flex flex-col items-center p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <span className="text-2xl mb-2">💰</span>
            <span className="text-sm font-medium text-blue-700">Apply for Loan</span>
          </Link>
          <Link
            to="/customer/track-application"
            className="flex flex-col items-center p-4 bg-yellow-50 border border-yellow-200 rounded-lg hover:bg-yellow-100 transition-colors"
          >
            <span className="text-2xl mb-2">📋</span>
            <span className="text-sm font-medium text-yellow-700">Track Application</span>
          </Link>
          <Link
            to="/customer/payments"
            className="flex flex-col items-center p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
          >
            <span className="text-2xl mb-2">💳</span>
            <span className="text-sm font-medium text-green-700">Payment History</span>
          </Link>
          <Link
            to="/customer/profile"
            className="flex flex-col items-center p-4 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors"
          >
            <span className="text-2xl mb-2">👤</span>
            <span className="text-sm font-medium text-purple-700">My Profile</span>
          </Link>
        </div>

        {/* Recent Loans */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">My Loans</h3>
            <Link to="/customer/loans" className="text-sm text-primary-600 hover:text-primary-700">
              View All →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Loan No</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Balance</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Maturity</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data?.recent_loans.map((loan) => (
                  <tr key={loan.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{loan.loan_no}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{formatCurrency(loan.principal)}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{formatCurrency(loan.outstanding_balance)}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        loan.status === 'active' ? 'bg-green-100 text-green-800' :
                        loan.status === 'paid' ? 'bg-gray-100 text-gray-800' :
                        loan.status === 'defaulted' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {loan.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{formatDate(loan.maturity_date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Upcoming Payments & Notifications */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upcoming Payments */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Payments</h3>
            {data?.upcoming_payments.length > 0 ? (
              <div className="space-y-3">
                {data.upcoming_payments.map((payment, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{payment.loan_no}</p>
                      <p className="text-xs text-gray-500">{formatDate(payment.due_date)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">{formatCurrency(payment.amount)}</p>
                      <span className="text-xs text-yellow-600">Due</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No upcoming payments</p>
            )}
          </div>

          {/* Notifications */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Notifications</h3>
            {data?.notifications.length > 0 ? (
              <div className="space-y-3">
                {data.notifications.map((notification) => (
                  <div key={notification.id} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm font-medium text-blue-900">{notification.title}</p>
                    <p className="text-xs text-blue-700">{notification.message}</p>
                    <p className="text-xs text-gray-500 mt-1">{formatDate(notification.created_at)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No notifications</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboard;