import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentAPI } from '../../api';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';

const PaymentForm = ({ onClose, loans = [], selectedLoan: propSelectedLoan }) => {
  const [searchParams] = useSearchParams();
  const loanIdFromUrl = searchParams.get('loan');
  
  const [formData, setFormData] = useState({
    loan: propSelectedLoan?.id || loanIdFromUrl || '',
    amount_paid: '',
    payment_method: 'cash',
    payment_date: new Date().toISOString().slice(0, 16),
    notes: '',
  });

  const [selectedLoanDetails, setSelectedLoanDetails] = useState(propSelectedLoan || null);

  const queryClient = useQueryClient();

  // Find loan when ID changes
  useEffect(() => {
    if (formData.loan && loans && loans.length > 0) {
      const loan = loans.find(l => l.id === parseInt(formData.loan));
      if (loan) {
        setSelectedLoanDetails(loan);
      }
    }
  }, [formData.loan, loans]);

  // Handle loan from URL parameter
  useEffect(() => {
    if (loanIdFromUrl && loans && loans.length > 0) {
      const loan = loans.find(l => l.id === parseInt(loanIdFromUrl));
      if (loan) {
        setSelectedLoanDetails(loan);
        setFormData(prev => ({ ...prev, loan: loanIdFromUrl }));
      }
    }
  }, [loanIdFromUrl, loans]);

  const mutation = useMutation({
    mutationFn: (data) => {
      console.log('Sending payment data:', data);
      return paymentAPI.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['payments']);
      queryClient.invalidateQueries(['loans']);
      toast.success('Payment recorded successfully');
      onClose();
    },
    onError: (error) => {
      console.error('Payment error:', error);
      toast.error(error.response?.data?.error || 'Failed to record payment');
    },
  });

  const handleLoanChange = (e) => {
    const loanId = e.target.value;
    if (!loanId) {
      setSelectedLoanDetails(null);
      setFormData({ ...formData, loan: '' });
      return;
    }
    const loan = loans?.find(l => l.id === parseInt(loanId));
    setSelectedLoanDetails(loan || null);
    setFormData({ ...formData, loan: loanId });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.loan || !formData.amount_paid) {
      toast.error('Please select a loan and enter amount');
      return;
    }
    
    const amount = parseFloat(formData.amount_paid);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    
    // Check if amount exceeds outstanding balance
    if (selectedLoanDetails && amount > (selectedLoanDetails.outstanding_balance || 0)) {
      toast.error(`Amount exceeds outstanding balance of ${formatCurrency(selectedLoanDetails.outstanding_balance)}`);
      return;
    }
    
    mutation.mutate({
      ...formData,
      amount_paid: amount,
      loan: parseInt(formData.loan),
    });
  };

  // Safe formatting function
  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null || isNaN(amount)) {
      return 'TZS 0';
    }
    return `TZS ${Number(amount).toLocaleString()}`;
  };

  // Safe check for loan details
  const getOutstandingBalance = () => {
    if (!selectedLoanDetails) return 0;
    return selectedLoanDetails.outstanding_balance || 0;
  };

  const getPrincipal = () => {
    if (!selectedLoanDetails) return 0;
    return selectedLoanDetails.principal || 0;
  };

  const getInterestRate = () => {
    if (!selectedLoanDetails) return 0;
    return selectedLoanDetails.interest_rate || 0;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
        
        <div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Record Payment</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              Close
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Loan Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Loan *</label>
              <select
                required
                value={formData.loan}
                onChange={handleLoanChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Select Loan</option>
                {loans && loans.length > 0 ? (
                  loans.map((loan) => (
                    <option key={loan.id} value={loan.id}>
                      {loan.loan_no || 'N/A'} - {loan.customer?.first_name || 'Unknown'} {loan.customer?.last_name || ''} - 
                      Outstanding: {formatCurrency(loan.outstanding_balance)}
                    </option>
                  ))
                ) : (
                  <option value="" disabled>No active loans available</option>
                )}
              </select>
            </div>

            {/* Loan Details */}
            {selectedLoanDetails && (
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <h4 className="font-medium text-gray-900">Loan Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Outstanding Balance:</span>
                    <span className="ml-2 font-medium">{formatCurrency(getOutstandingBalance())}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Principal:</span>
                    <span className="ml-2 font-medium">{formatCurrency(getPrincipal())}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Interest Rate:</span>
                    <span className="ml-2 font-medium">{getInterestRate()}%</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Loan No:</span>
                    <span className="ml-2 font-medium">{selectedLoanDetails.loan_no || 'N/A'}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount Paid (TZS) *</label>
              <input
                type="number"
                required
                min="100"
                step="100"
                value={formData.amount_paid}
                onChange={(e) => setFormData({ ...formData, amount_paid: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Enter payment amount"
              />
              {selectedLoanDetails && (
                <p className="mt-1 text-sm text-gray-500">
                  Maximum: {formatCurrency(getOutstandingBalance())}
                </p>
              )}
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method *</label>
              <select
                required
                value={formData.payment_method}
                onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="cash">Cash</option>
                <option value="bank">Bank Transfer</option>
                <option value="mpesa">M-Pesa</option>
                <option value="airtel">Airtel Money</option>
                <option value="mixx">Mixx by Yas</option>
                <option value="cheque">Cheque</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Payment Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Date *</label>
              <input
                type="datetime-local"
                required
                value={formData.payment_date}
                onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Optional notes"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={mutation.isLoading}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
              >
                {mutation.isLoading ? 'Processing...' : 'Record Payment'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PaymentForm;