import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentAPI, loanAPI } from '../api';
import PaymentForm from '../components/Payments/PaymentForm';
import Loading from '../components/Common/Loading';
import { formatCurrency, formatDate } from '../utils/formatters';
import toast from 'react-hot-toast';

const Payments = () => {
  const [showForm, setShowForm] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);
  const [customerPayments, setCustomerPayments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const queryClient = useQueryClient();

  // Check URL params for loan ID
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const loanId = params.get('loan');
    if (loanId) {
      setSelectedLoan({ id: parseInt(loanId) });
      setShowForm(true);
    }
  }, []);

  // Fetch payments
  const { data: payments, isLoading, refetch } = useQuery({
    queryKey: ['payments', searchTerm, filterStatus],
    queryFn: () => paymentAPI.getAll({ search: searchTerm, status: filterStatus }),
  });

  // Fetch loans
  const { data: loans } = useQuery({
    queryKey: ['loans-for-payment'],
    queryFn: () => loanAPI.getAll({ status: 'active' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => paymentAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['payments']);
      toast.success('Payment deleted successfully');
      refetch();
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to delete payment');
    },
  });

  // Function to view customer payment details
  const viewCustomerPaymentDetails = async (payment) => {
    try {
      // Get the loan details to find customer
      const loanId = payment.loan;
      const loanResponse = await loanAPI.getById(loanId);
      const loanData = loanResponse.data;
      
      // Get all payments for this customer
      const allPayments = await paymentAPI.getAll({ customer: loanData.customer });
      const customerData = loanData.customer_details || loanData.customer;
      
      setSelectedCustomer(customerData);
      setCustomerPayments(allPayments.data?.results || []);
      setSelectedPayment(payment);
      setShowPaymentDetails(true);
    } catch (error) {
      console.error('Error fetching customer payments:', error);
      toast.error('Failed to load payment details');
    }
  };

  // Calculate totals safely
  const calculateTotal = (paymentsList) => {
    if (!paymentsList || paymentsList.length === 0) return 0;
    return paymentsList.reduce((sum, p) => sum + (parseFloat(p.amount_paid) || 0), 0);
  };

  const paymentList = payments?.data?.results || [];
  const totalCollected = calculateTotal(paymentList);
  const todayPayments = paymentList.filter(p => {
    const today = new Date().toDateString();
    return new Date(p.payment_date).toDateString() === today;
  });
  const completedPayments = paymentList.filter(p => p.status === 'completed');
  const pendingPayments = paymentList.filter(p => p.status === 'pending');

  if (isLoading) return <Loading />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Payment Management</h1>
        <button
          onClick={() => { setSelectedLoan(null); setShowForm(true); }}
          className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          New Payment
        </button>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search payments by reference or customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="">All Status</option>
          <option value="completed">Completed</option>
          <option value="partial">Partially Paid</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
          <option value="reversed">Reversed</option>
        </select>
      </div>

      {/* Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '16px'
      }}>
        <div style={{ background: 'white', borderRadius: '12px', padding: '16px', border: '1px solid #e5e7eb' }}>
          <p style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280' }}>Total Collected</p>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>
            {formatCurrency(totalCollected)}
          </p>
        </div>
        <div style={{ background: 'white', borderRadius: '12px', padding: '16px', border: '1px solid #e5e7eb' }}>
          <p style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280' }}>Today's Payments</p>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>
            {todayPayments.length}
          </p>
        </div>
        <div style={{ background: 'white', borderRadius: '12px', padding: '16px', border: '1px solid #e5e7eb' }}>
          <p style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280' }}>Completed</p>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#22c55e' }}>
            {completedPayments.length}
          </p>
        </div>
        <div style={{ background: 'white', borderRadius: '12px', padding: '16px', border: '1px solid #e5e7eb' }}>
          <p style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280' }}>Pending</p>
          <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#f59e0b' }}>
            {pendingPayments.length}
          </p>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loan</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paymentList.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {payment.transaction_ref}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {payment.loan?.loan_no || payment.loan_no || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {payment.customer?.first_name || payment.loan?.customer?.first_name || 'Unknown'} 
                    {payment.customer?.last_name || payment.loan?.customer?.last_name || ''}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatCurrency(payment.amount_paid)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                    {payment.payment_method}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      payment.status === 'completed' ? 'bg-green-100 text-green-800' :
                      payment.status === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                      payment.status === 'pending' ? 'bg-blue-100 text-blue-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {payment.status || 'Completed'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(payment.payment_date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => viewCustomerPaymentDetails(payment)}
                      className="text-blue-600 hover:text-blue-900 font-medium mr-3"
                    >
                      Details
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete this payment?')) {
                          deleteMutation.mutate(payment.id);
                        }
                      }}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Form Modal */}
      {showForm && (
        <PaymentForm
          onClose={() => { setShowForm(false); setSelectedLoan(null); }}
          loans={loans?.data?.results || []}
          selectedLoan={selectedLoan}
        />
      )}

      {/* Payment Details Modal */}
      {showPaymentDetails && selectedCustomer && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowPaymentDetails(false)}></div>
            <div className="relative bg-white rounded-xl shadow-xl max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Payment History - {selectedCustomer.first_name} {selectedCustomer.last_name}
                </h2>
                <button onClick={() => setShowPaymentDetails(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  Close
                </button>
              </div>

              {/* Customer Summary */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-600">Total Payments</p>
                  <p className="text-xl font-bold text-blue-700">{customerPayments.length}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-600">Total Paid</p>
                  <p className="text-xl font-bold text-green-700">
                    {formatCurrency(customerPayments.reduce((sum, p) => sum + (parseFloat(p.amount_paid) || 0), 0))}
                  </p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-600">Average Payment</p>
                  <p className="text-xl font-bold text-purple-700">
                    {formatCurrency(customerPayments.length > 0 ? 
                      customerPayments.reduce((sum, p) => sum + (parseFloat(p.amount_paid) || 0), 0) / customerPayments.length : 0)}
                  </p>
                </div>
              </div>

              {/* Payment History Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {customerPayments.map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{p.transaction_ref}</td>
                        <td className="px-4 py-3 text-sm font-bold text-green-600">{formatCurrency(p.amount_paid)}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 capitalize">{p.payment_method}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{formatDate(p.payment_date)}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            p.status === 'completed' ? 'bg-green-100 text-green-800' :
                            p.status === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {p.status || 'Completed'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Progress Summary */}
              <div className="mt-4 bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Payment Summary</h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Completed:</span>
                    <span className="ml-2 font-medium text-green-600">
                      {customerPayments.filter(p => p.status === 'completed').length}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Partial:</span>
                    <span className="ml-2 font-medium text-yellow-600">
                      {customerPayments.filter(p => p.status === 'partial').length}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Total:</span>
                    <span className="ml-2 font-medium">{customerPayments.length}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;