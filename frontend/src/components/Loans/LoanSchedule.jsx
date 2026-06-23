import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { loanAPI } from '../../api';
import Loading from '../Common/Loading';
import { formatCurrency, formatDate } from '../../utils/formatters';

const LoanSchedule = ({ loanId, onClose }) => {
  const [realTimeStatus, setRealTimeStatus] = useState(null);

  const { data: schedule, isLoading: scheduleLoading } = useQuery({
    queryKey: ['loan-schedule', loanId],
    queryFn: () => loanAPI.getSchedule(loanId),
    enabled: !!loanId,
  });

  const { data: loanDetails, isLoading: loanLoading } = useQuery({
    queryKey: ['loan-details', loanId],
    queryFn: () => loanAPI.getById(loanId),
    enabled: !!loanId,
  });

  // Fetch real-time status
  useEffect(() => {
    if (!loanId) return;

    const fetchRealTimeStatus = async () => {
      try {
        const response = await loanAPI.getById(loanId);
        setRealTimeStatus(response.data);
      } catch (error) {
        console.error('Error fetching real-time status:', error);
      }
    };

    fetchRealTimeStatus();
    const interval = setInterval(fetchRealTimeStatus, 10000);
    return () => clearInterval(interval);
  }, [loanId]);

  if (scheduleLoading || loanLoading) return <Loading />;

  const loan = loanDetails?.data;
  const schedules = schedule?.data || [];

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-green-100 text-green-800',
      overdue: 'bg-red-100 text-red-800',
      partial: 'bg-blue-100 text-blue-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
        
        <div className="relative bg-white rounded-xl shadow-xl max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Repayment Schedule - {loan?.loan_no}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>

          {/* Loan Summary */}
          {loan && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500">Customer</p>
                <p className="font-medium">{loan.customer_details?.first_name} {loan.customer_details?.last_name}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500">Principal</p>
                <p className="font-medium">{formatCurrency(loan.principal)}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500">Interest Rate</p>
                <p className="font-medium">{loan.interest_rate}%</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500">Status</p>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(loan.status)}`}>
                  {loan.status}
                </span>
              </div>
            </div>
          )}

          {/* Real-Time Status */}
          {realTimeStatus && (
            <div className="bg-blue-50 rounded-lg p-4 mb-6 border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-3">Real-Time Status</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-blue-700">Per Second:</span>
                  <span className="ml-2 font-medium text-blue-900">{formatCurrency(realTimeStatus.per_second || 0)}</span>
                </div>
                <div>
                  <span className="text-blue-700">Per Minute:</span>
                  <span className="ml-2 font-medium text-blue-900">{formatCurrency(realTimeStatus.per_minute || 0)}</span>
                </div>
                <div>
                  <span className="text-blue-700">Per Hour:</span>
                  <span className="ml-2 font-medium text-blue-900">{formatCurrency(realTimeStatus.per_hour || 0)}</span>
                </div>
                <div>
                  <span className="text-blue-700">Per Day:</span>
                  <span className="ml-2 font-medium text-blue-900">{formatCurrency(realTimeStatus.per_day || 0)}</span>
                </div>
              </div>
              {realTimeStatus.is_overdue && (
                <div className="mt-3 pt-3 border-t border-blue-200 text-red-600 font-medium">
                  Overdue by {realTimeStatus.days_overdue} days | Penalty: {formatCurrency(realTimeStatus.penalty || 0)}
                </div>
              )}
            </div>
          )}

          {/* Schedule Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Principal</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Interest</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Penalty</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Due</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {schedules.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">{item.installment_no}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{formatDate(item.due_date)}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{formatCurrency(item.principal_amount)}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{formatCurrency(item.interest_amount)}</td>
                    <td className="px-4 py-3 text-sm text-red-600">{formatCurrency(item.penalty_amount)}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{formatCurrency(item.total_due)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          {loan && (
            <div className="mt-6 pt-4 border-t border-gray-200 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Total Principal:</span>
                <span className="ml-2 font-medium">{formatCurrency(loan.principal)}</span>
              </div>
              <div>
                <span className="text-gray-500">Total Interest:</span>
                <span className="ml-2 font-medium">{formatCurrency(loan.total_interest)}</span>
              </div>
              <div>
                <span className="text-gray-500">Total Payable:</span>
                <span className="ml-2 font-medium">{formatCurrency(loan.total_payable)}</span>
              </div>
              <div>
                <span className="text-gray-500">Total Paid:</span>
                <span className="ml-2 font-medium">{formatCurrency(loan.amount_paid)}</span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoanSchedule;