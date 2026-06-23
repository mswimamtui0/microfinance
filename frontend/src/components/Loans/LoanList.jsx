import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { loanAPI } from '../../api';
import Loading from '../Common/Loading';
import { formatCurrency } from '../../utils/formatters';
import toast from 'react-hot-toast';

const LoanList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedLoan, setSelectedLoan] = useState(null);
  const queryClient = useQueryClient();

  const { data: loans, isLoading } = useQuery({
    queryKey: ['loans', searchTerm, statusFilter],
    queryFn: () => loanAPI.getAll({ 
      search: searchTerm, 
      status: statusFilter || undefined 
    }),
  });

  const approveMutation = useMutation({
    mutationFn: (id) => loanAPI.approve(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['loans']);
      toast.success('Loan approved successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to approve loan');
    },
  });

  const disburseMutation = useMutation({
    mutationFn: (id) => loanAPI.disburse(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['loans']);
      toast.success('Loan disbursed successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to disburse loan');
    },
  });

  if (isLoading) return <Loading />;

  const allLoans = loans?.data?.results || [];

  const getStatusColor = (status) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-blue-100 text-blue-800',
      disbursed: 'bg-purple-100 text-purple-800',
      active: 'bg-green-100 text-green-800',
      paid: 'bg-gray-100 text-gray-800',
      defaulted: 'bg-red-100 text-red-800',
      rejected: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-4">
      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search loans by number or customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="">All Status</option>
          <option value="draft">Draft</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="disbursed">Disbursed</option>
          <option value="active">Active</option>
          <option value="paid">Paid</option>
          <option value="defaulted">Defaulted</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Loans Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loan No</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Principal</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {allLoans.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                    No loans found. Click "New Loan" to create one.
                  </td>
                </tr>
              ) : (
                allLoans.map((loan) => (
                  <tr key={loan.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {loan.loan_no}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {loan.customer_details?.first_name} {loan.customer_details?.last_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {loan.product_details?.product_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(loan.principal)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(loan.status)}`}>
                        {loan.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(loan.outstanding_balance)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => setSelectedLoan(loan)}
                        className="text-primary-600 hover:text-primary-900 font-medium mr-2"
                      >
                        View
                      </button>
                      {loan.status === 'draft' && (
                        <button
                          onClick={() => approveMutation.mutate(loan.id)}
                          className="text-green-600 hover:text-green-900 font-medium"
                        >
                          Submit for Approval
                        </button>
                      )}
                      {loan.status === 'pending' && (
                        <button
                          onClick={() => approveMutation.mutate(loan.id)}
                          className="text-green-600 hover:text-green-900 font-medium mr-2"
                        >
                          Approve
                        </button>
                      )}
                      {loan.status === 'approved' && (
                        <button
                          onClick={() => disburseMutation.mutate(loan.id)}
                          className="text-blue-600 hover:text-blue-900 font-medium mr-2"
                        >
                          Disburse
                        </button>
                      )}
                      {loan.status === 'active' && (
                        <button
                          onClick={() => window.location.href = `/payments/new?loan=${loan.id}`}
                          className="text-purple-600 hover:text-purple-900 font-medium"
                        >
                          Receive Payment
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Loan Details Modal would go here */}
      {selectedLoan && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Modal content */} 
          <button onClick={() => setSelectedLoan(null)}>Close</button>
        </div>
      )}
    </div>
  );
};

export default LoanList;