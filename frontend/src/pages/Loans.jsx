import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { loanAPI, productAPI, customerAPI } from '../api';
import LoanApplication from '../components/Loans/LoanApplication';
import LoanDetails from '../components/Loans/LoanDetails';
import Loading from '../components/Common/Loading';
import toast from 'react-hot-toast';
import { formatCurrency } from '../utils/formatters';

const Loans = () => {
  const [showApplication, setShowApplication] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [viewMode, setViewMode] = useState('all');

  const queryClient = useQueryClient();

  // Fetch ALL loans - ensure we get data
  const { data: loans, isLoading: loansLoading, refetch, error } = useQuery({
    queryKey: ['loans', searchTerm, statusFilter],
    queryFn: () => {
      console.log('Fetching loans...');
      return loanAPI.getAll({ 
        search: searchTerm, 
        status: statusFilter || undefined 
      });
    },
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  // Log the data
  console.log('Loans data:', loans);

  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: () => productAPI.getAll(),
  });

  const { data: customers } = useQuery({
    queryKey: ['customers'],
    queryFn: () => customerAPI.getAll({ limit: 1000 }),
  });

  // Get all loans
  const allLoans = loans?.data?.results || [];
  
  console.log('All loans count:', allLoans.length);

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

  // Filter loans based on view mode
  const filteredLoans = allLoans.filter(loan => {
    if (viewMode === 'pending') return loan.status === 'pending';
    if (viewMode === 'approved') return loan.status === 'approved';
    if (viewMode === 'active') return loan.status === 'active';
    if (viewMode === 'draft') return loan.status === 'draft';
    return true;
  });

  const counts = {
    all: allLoans.length,
    draft: allLoans.filter(l => l.status === 'draft').length,
    pending: allLoans.filter(l => l.status === 'pending').length,
    approved: allLoans.filter(l => l.status === 'approved').length,
    active: allLoans.filter(l => l.status === 'active').length,
  };

  const approveMutation = useMutation({
    mutationFn: (id) => loanAPI.approve(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['loans']);
      toast.success('Loan approved successfully');
      refetch();
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
      refetch();
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to disburse loan');
    },
  });

  if (loansLoading) return <Loading />;

  if (error) {
    console.error('Error fetching loans:', error);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Loan Management</h1>
        <button
          onClick={() => setShowApplication(true)}
          className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          New Loan
        </button>
      </div>

      {/* View Tabs with Counts */}
      <div style={{
        display: 'flex',
        gap: '8px',
        background: 'white',
        padding: '8px',
        borderRadius: '12px',
        border: '1px solid #e5e7eb',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={() => setViewMode('all')}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            background: viewMode === 'all' ? '#0284c7' : 'transparent',
            color: viewMode === 'all' ? 'white' : '#4b5563',
            cursor: 'pointer',
            fontWeight: '500',
            fontSize: '14px'
          }}
        >
          All Loans ({counts.all})
        </button>
        <button
          onClick={() => setViewMode('draft')}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            background: viewMode === 'draft' ? '#9ca3af' : 'transparent',
            color: viewMode === 'draft' ? 'white' : '#4b5563',
            cursor: 'pointer',
            fontWeight: '500',
            fontSize: '14px'
          }}
        >
          Draft ({counts.draft})
        </button>
        <button
          onClick={() => setViewMode('pending')}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            background: viewMode === 'pending' ? '#f59e0b' : 'transparent',
            color: viewMode === 'pending' ? 'white' : '#4b5563',
            cursor: 'pointer',
            fontWeight: '500',
            fontSize: '14px'
          }}
        >
          Pending ({counts.pending})
        </button>
        <button
          onClick={() => setViewMode('approved')}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            background: viewMode === 'approved' ? '#3b82f6' : 'transparent',
            color: viewMode === 'approved' ? 'white' : '#4b5563',
            cursor: 'pointer',
            fontWeight: '500',
            fontSize: '14px'
          }}
        >
          Approved ({counts.approved})
        </button>
        <button
          onClick={() => setViewMode('active')}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            background: viewMode === 'active' ? '#22c55e' : 'transparent',
            color: viewMode === 'active' ? 'white' : '#4b5563',
            cursor: 'pointer',
            fontWeight: '500',
            fontSize: '14px'
          }}
        >
          Active ({counts.active})
        </button>
      </div>

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
              {filteredLoans.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                    No loans found. Click "New Loan" to create one.
                  </td>
                </tr>
              ) : (
                filteredLoans.map((loan) => (
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

      {/* Loan Application Modal */}
      {showApplication && (
        <LoanApplication
          onClose={() => {
            setShowApplication(false);
            refetch();
          }}
          products={products?.data?.results || []}
          customers={customers?.data?.results || []}
        />
      )}

      {/* Loan Details Modal */}
      {selectedLoan && (
        <LoanDetails
          loan={selectedLoan}
          onClose={() => setSelectedLoan(null)}
        />
      )}
    </div>
  );
};

export default Loans;