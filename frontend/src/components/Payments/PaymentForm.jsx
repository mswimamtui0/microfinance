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

  const getTotalPayable = () => {
    if (!selectedLoanDetails) return 0;
    return selectedLoanDetails.total_payable || 0;
  };

  const getInterest = () => {
    if (!selectedLoanDetails) return 0;
    return selectedLoanDetails.total_interest || 0;
  };

  const getAmountPaid = () => {
    if (!selectedLoanDetails) return 0;
    return selectedLoanDetails.amount_paid || 0;
  };

  const getRemainingBalance = () => {
    if (!selectedLoanDetails) return 0;
    return selectedLoanDetails.outstanding_balance || 0;
  };

  const getPaymentStatus = () => {
    if (!selectedLoanDetails) return 'No loan selected';
    const balance = selectedLoanDetails.outstanding_balance || 0;
    const total = selectedLoanDetails.total_payable || 0;
    if (balance <= 0) return 'Fully Paid ✅';
    if (selectedLoanDetails.amount_paid > 0) return 'Partially Paid';
    return 'Not Paid';
  };

  const getProgressPercentage = () => {
    if (!selectedLoanDetails) return 0;
    const total = selectedLoanDetails.total_payable || 0;
    const paid = selectedLoanDetails.amount_paid || 0;
    if (total <= 0) return 0;
    return Math.round((paid / total) * 100);
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Loan *</label>
              <select
                required
                value={formData.loan}
                onChange={handleLoanChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">-- Select a Loan --</option>
                {loans && loans.length > 0 ? (
                  loans.map((loan) => (
                    <option key={loan.id} value={loan.id}>
                      {loan.loan_no} - {loan.customer?.first_name || 'Unknown'} {loan.customer?.last_name || ''} 
                      (Balance: {formatCurrency(loan.outstanding_balance)})
                    </option>
                  ))
                ) : (
                  <option value="" disabled>No active loans available</option>
                )}
              </select>
            </div>

            {/* Loan Details - Complete Summary */}
            {selectedLoanDetails && (
              <div className="bg-gray-50 rounded-lg p-4 space-y-3 border border-gray-200">
                <h4 className="font-semibold text-gray-900 text-lg">Loan Summary</h4>
                
                {/* Customer & Loan Info */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">Loan No:</span>
                    <span className="ml-2 font-medium text-gray-900">{selectedLoanDetails.loan_no || 'N/A'}</span>
                  </div>
                  <div>
  <span className="text-gray-500">Customer:</span>
  <span className="ml-2 font-medium text-gray-900">
    {(() => {
      // Try multiple ways to get customer name
      const customer = selectedLoanDetails.customer || selectedLoanDetails.customer_details;
      if (customer) {
        return `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || 'Unknown';
      }
      // Check if customer name is directly in loan object
      if (selectedLoanDetails.customer_name) {
        return selectedLoanDetails.customer_name;
      }
      return 'Unknown';
    })()}
  </span>
</div>
                  <div>
                    <span className="text-gray-500">Product:</span>
                    <span className="ml-2 font-medium text-gray-900">{selectedLoanDetails.product_details?.product_name || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Status:</span>
                    <span className={`ml-2 font-medium px-2 py-0.5 rounded-full text-xs ${
                      selectedLoanDetails.status === 'active' ? 'bg-green-100 text-green-800' :
                      selectedLoanDetails.status === 'paid' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {selectedLoanDetails.status || 'N/A'}
                    </span>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-3">
                  {/* Principal & Interest Breakdown */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-500">Principal:</span>
                      <span className="ml-2 font-medium text-gray-900">{formatCurrency(getPrincipal())}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Interest:</span>
                      <span className="ml-2 font-medium text-gray-900">{formatCurrency(getInterest())}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-500">Total Payable:</span>
                      <span className="ml-2 font-bold text-gray-900">{formatCurrency(getTotalPayable())}</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-3">
                  {/* Payment Progress */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-500">Amount Paid:</span>
                      <span className="ml-2 font-medium text-green-600">{formatCurrency(getAmountPaid())}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Remaining:</span>
                      <span className="ml-2 font-medium text-red-600">{formatCurrency(getRemainingBalance())}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-500">Payment Status:</span>
                      <span className={`ml-2 font-medium px-2 py-0.5 rounded-full text-xs ${
                        getRemainingBalance() <= 0 ? 'bg-green-100 text-green-800' :
                        getAmountPaid() > 0 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {getPaymentStatus()}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className="bg-primary-600 h-2.5 rounded-full transition-all duration-500"
                          style={{ width: `${getProgressPercentage()}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 text-right">{getProgressPercentage()}% Paid</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount to Pay (TZS) *</label>
              <input
  type="number"
  required
  min="0.01"
  step="0.01"
  value={formData.amount_paid}
  onChange={(e) => setFormData({ ...formData, amount_paid: e.target.value })}
  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
  placeholder="Enter payment amount (e.g., 28884.66)"
/>
              {selectedLoanDetails && (
                <p className="mt-1 text-sm text-gray-500">
                  Maximum: {formatCurrency(getRemainingBalance())}
                </p>
              )}
              {selectedLoanDetails && parseFloat(formData.amount_paid) > 0 && (
                <p className="mt-1 text-sm text-green-600">
                  After payment, new balance: {formatCurrency(getRemainingBalance() - parseFloat(formData.amount_paid))}
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
                rows="2"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Optional notes or reference"
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