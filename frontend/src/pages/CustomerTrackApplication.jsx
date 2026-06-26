import React from 'react';
import { Link } from 'react-router-dom';
import { formatDate } from '../utils/formatters';

const CustomerTrackApplication = () => {
  // Sample data - will be replaced with real API data
  const applications = [
    {
      id: 1,
      product_name: 'Biashara Loan',
      amount: 500000,
      term_months: 6,
      status: 'pending',
      submitted_at: '2026-06-20',
    },
    {
      id: 2,
      product_name: 'Emergency Loan',
      amount: 200000,
      term_months: 3,
      status: 'approved',
      submitted_at: '2026-06-10',
    },
  ];

  const getStatusColor = (status) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      submitted: 'bg-blue-100 text-blue-800',
      pending: 'bg-yellow-100 text-yellow-800',
      under_review: 'bg-purple-100 text-purple-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      disbursed: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Track Applications</h1>
            <Link to="/customer/dashboard" className="text-sm text-primary-600 hover:text-primary-700">
              ← Back to Dashboard
            </Link>
          </div>

          <div className="space-y-4">
            {applications.map((app) => (
              <div key={app.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-gray-900">{app.product_name}</h3>
                    <p className="text-sm text-gray-600">Amount: TZS {app.amount.toLocaleString()}</p>
                    <p className="text-sm text-gray-600">Term: {app.term_months} months</p>
                    <p className="text-sm text-gray-500">Submitted: {formatDate(app.submitted_at)}</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(app.status)}`}>
                      {app.status}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">Application #{app.id}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerTrackApplication;