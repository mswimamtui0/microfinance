import React, { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { loanAPI, customerAPI, productAPI } from '../../api';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

const LoanApplication = ({ onClose }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    customer: '',
    product: '',
    principal: '',
    term_months: '',
  });

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [calculations, setCalculations] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const queryClient = useQueryClient();

  // Fetch customers
  const { data: customers, isLoading: customersLoading } = useQuery({
    queryKey: ['customers-for-loan'],
    queryFn: () => customerAPI.getAll(),
  });

  // Fetch loan products
  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ['products-for-loan'],
    queryFn: () => productAPI.getAll(),
  });

  const createLoanMutation = useMutation({
    mutationFn: async (data) => {
      console.log('Sending loan data:', data);
      const response = await loanAPI.create(data);
      return response;
    },
    onSuccess: (response) => {
      console.log('Loan created successfully:', response.data);
      queryClient.invalidateQueries(['loans']);
      toast.success('Loan application submitted successfully');
      onClose();
    },
    onError: (error) => {
      console.error('Loan creation error:', error);
      console.error('Error response:', error.response);
      console.error('Error data:', error.response?.data);
      
      let errorMessage = 'Failed to create loan. Please try again.';
      const errorData = error.response?.data;
      
      if (errorData) {
        if (typeof errorData === 'string') {
          errorMessage = errorData;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.detail) {
          errorMessage = errorData.detail;
        } else {
          const fieldErrors = [];
          Object.keys(errorData).forEach(key => {
            if (Array.isArray(errorData[key])) {
              fieldErrors.push(`${key}: ${errorData[key].join(', ')}`);
            } else if (typeof errorData[key] === 'string') {
              fieldErrors.push(`${key}: ${errorData[key]}`);
            }
          });
          if (fieldErrors.length > 0) {
            errorMessage = fieldErrors.join('; ');
            setValidationErrors(errorData);
          }
        }
      }
      
      toast.error(errorMessage);
    },
  });

  const handleProductChange = (e) => {
    const productId = parseInt(e.target.value);
    const product = products?.data?.results?.find(p => p.id === productId);
    setSelectedProduct(product);
    setFormData({ ...formData, product: productId });
    setValidationErrors({});
    calculateLoan(product);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setValidationErrors({});
    
    // Recalculate when principal or term changes
    if (name === 'principal' || name === 'term_months') {
      calculateLoan(selectedProduct);
    }
  };

  const calculateLoan = (product) => {
    if (!product || !formData.principal || !formData.term_months) {
      setCalculations(null);
      return;
    }

    const principal = parseFloat(formData.principal);
    const term = parseInt(formData.term_months);
    
    if (isNaN(principal) || isNaN(term) || principal <= 0 || term <= 0) {
      setCalculations(null);
      return;
    }

    // Calculate interest
    let totalInterest = 0;
    if (product.interest_method === 'flat') {
      totalInterest = principal * (product.interest_rate / 100) * term;
    } else {
      // Declining balance (simplified)
      const monthlyRate = product.interest_rate / 100 / 12;
      const monthlyPayment = principal * monthlyRate * Math.pow(1 + monthlyRate, term);
      const totalPayment = monthlyPayment / (Math.pow(1 + monthlyRate, term) - 1) * term;
      totalInterest = totalPayment - principal;
    }

    const totalPayable = principal + totalInterest;
    const totalDays = term * 30;
    const dailyAmount = totalPayable / totalDays;
    const weeklyAmount = dailyAmount * 7;
    const monthlyAmount = dailyAmount * 30;
    const hourlyAmount = dailyAmount / 24;
    const minuteAmount = hourlyAmount / 60;
    const secondAmount = minuteAmount / 60;
    
    // Get frequency details
    const frequencyMap = {
      daily: { label: 'Daily', period: 1, payment: dailyAmount },
      weekly: { label: 'Weekly', period: 7, payment: weeklyAmount },
      monthly: { label: 'Monthly', period: 30, payment: monthlyAmount },
      custom: { label: 'Custom', period: product.custom_frequency_days || 30, payment: dailyAmount * (product.custom_frequency_days || 30) }
    };
    
    const freq = frequencyMap[product.repayment_frequency] || frequencyMap.monthly;
    const paymentAmount = freq.payment;
    const totalPayments = Math.ceil(totalPayable / paymentAmount);

    setCalculations({
      totalInterest: totalInterest.toFixed(2),
      totalPayable: totalPayable.toFixed(2),
      dailyAmount: dailyAmount.toFixed(2),
      weeklyAmount: weeklyAmount.toFixed(2),
      monthlyAmount: monthlyAmount.toFixed(2),
      hourlyAmount: hourlyAmount.toFixed(2),
      minuteAmount: minuteAmount.toFixed(2),
      secondAmount: secondAmount.toFixed(4),
      paymentAmount: paymentAmount.toFixed(2),
      totalPayments: totalPayments,
      frequency: freq.label,
      period: freq.period,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setValidationErrors({});
    
    const errors = {};
    
    if (!formData.customer) {
      errors.customer = 'Please select a customer';
    }
    if (!formData.product) {
      errors.product = 'Please select a loan product';
    }
    if (!formData.principal || parseFloat(formData.principal) <= 0) {
      errors.principal = 'Please enter a valid principal amount';
    }
    if (!formData.term_months || parseInt(formData.term_months) <= 0) {
      errors.term_months = 'Please enter a valid term';
    }

    if (selectedProduct && formData.principal) {
      const principal = parseFloat(formData.principal);
      if (principal < selectedProduct.min_amount) {
        errors.principal = `Minimum amount is TZS ${selectedProduct.min_amount.toLocaleString()}`;
      }
      if (principal > selectedProduct.max_amount) {
        errors.principal = `Maximum amount is TZS ${selectedProduct.max_amount.toLocaleString()}`;
      }
    }

    if (selectedProduct && formData.term_months) {
      const term = parseInt(formData.term_months);
      if (term < selectedProduct.min_term_months) {
        errors.term_months = `Minimum term is ${selectedProduct.min_term_months} months`;
      }
      if (term > selectedProduct.max_term_months) {
        errors.term_months = `Maximum term is ${selectedProduct.max_term_months} months`;
      }
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      const firstError = Object.values(errors)[0];
      toast.error(firstError);
      return;
    }

    const loanData = {
      customer: parseInt(formData.customer),
      product: parseInt(formData.product),
      principal: parseFloat(formData.principal),
      term_months: parseInt(formData.term_months),
    };

    console.log('Submitting loan data:', loanData);
    createLoanMutation.mutate(loanData);
  };

  if (customersLoading || productsLoading) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen px-4">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
          <div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full p-6">
            <div className="text-center py-8">Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
        
        <div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">New Loan Application</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Customer Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer *
              </label>
              <select
                required
                name="customer"
                value={formData.customer}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  validationErrors.customer ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select Customer</option>
                {customers?.data?.results?.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.first_name} {customer.last_name} - {customer.customer_no}
                  </option>
                ))}
              </select>
              {validationErrors.customer && (
                <p className="mt-1 text-sm text-red-500">{validationErrors.customer}</p>
              )}
            </div>

            {/* Product Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Loan Product *
              </label>
              <select
                required
                name="product"
                value={formData.product}
                onChange={handleProductChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  validationErrors.product ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select Product</option>
                {products?.data?.results?.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.product_name} - {product.interest_rate}% ({product.interest_method})
                  </option>
                ))}
              </select>
              {validationErrors.product && (
                <p className="mt-1 text-sm text-red-500">{validationErrors.product}</p>
              )}
            </div>

            {/* Product Details */}
            {selectedProduct && (
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <h4 className="font-medium text-gray-900">Product Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Min Amount:</span>
                    <span className="ml-2 font-medium">TZS {selectedProduct.min_amount.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Max Amount:</span>
                    <span className="ml-2 font-medium">TZS {selectedProduct.max_amount.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Interest Rate:</span>
                    <span className="ml-2 font-medium">{selectedProduct.interest_rate}%</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Term Range:</span>
                    <span className="ml-2 font-medium">{selectedProduct.min_term_months} - {selectedProduct.max_term_months} months</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Frequency:</span>
                    <span className="ml-2 font-medium capitalize">{selectedProduct.repayment_frequency}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Penalty Rate:</span>
                    <span className="ml-2 font-medium">{selectedProduct.penalty_rate}%</span>
                  </div>
                </div>
              </div>
            )}

            {/* Principal Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Principal Amount (TZS) *
              </label>
              <input
                type="number"
                required
                name="principal"
                min="1000"
                step="1000"
                value={formData.principal}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  validationErrors.principal ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter loan amount"
              />
              {validationErrors.principal && (
                <p className="mt-1 text-sm text-red-500">{validationErrors.principal}</p>
              )}
              {selectedProduct && !validationErrors.principal && (
                <p className="mt-1 text-sm text-gray-500">
                  Amount must be between TZS {selectedProduct.min_amount.toLocaleString()} and TZS {selectedProduct.max_amount.toLocaleString()}
                </p>
              )}
            </div>

            {/* Term */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Term (Months) *
              </label>
              <input
                type="number"
                required
                name="term_months"
                min="1"
                max="36"
                value={formData.term_months}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                  validationErrors.term_months ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter loan term in months"
              />
              {validationErrors.term_months && (
                <p className="mt-1 text-sm text-red-500">{validationErrors.term_months}</p>
              )}
              {selectedProduct && !validationErrors.term_months && (
                <p className="mt-1 text-sm text-gray-500">
                  Term must be between {selectedProduct.min_term_months} and {selectedProduct.max_term_months} months
                </p>
              )}
            </div>

            {/* Real-Time Calculations */}
            {calculations && (
              <div className="bg-blue-50 rounded-lg p-4 space-y-2 border border-blue-200">
                <h4 className="font-medium text-blue-900">Loan Calculations</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-blue-700">Total Interest:</span>
                    <span className="ml-2 font-medium text-blue-900">TZS {calculations.totalInterest}</span>
                  </div>
                  <div>
                    <span className="text-blue-700">Total Payable:</span>
                    <span className="ml-2 font-medium text-blue-900">TZS {calculations.totalPayable}</span>
                  </div>
                  <div className="col-span-2 border-t border-blue-200 pt-2 mt-2">
                    <span className="text-blue-700 font-medium">Repayment Details:</span>
                  </div>
                  <div>
                    <span className="text-blue-700">Frequency:</span>
                    <span className="ml-2 font-medium text-blue-900">{calculations.frequency}</span>
                  </div>
                  <div>
                    <span className="text-blue-700">Payment Amount:</span>
                    <span className="ml-2 font-medium text-blue-900">TZS {calculations.paymentAmount}</span>
                  </div>
                  <div>
                    <span className="text-blue-700">Total Payments:</span>
                    <span className="ml-2 font-medium text-blue-900">{calculations.totalPayments}</span>
                  </div>
                  <div>
                    <span className="text-blue-700">Period:</span>
                    <span className="ml-2 font-medium text-blue-900">{calculations.period} days</span>
                  </div>
                  <div className="col-span-2 border-t border-blue-200 pt-2 mt-2">
                    <span className="text-blue-700 font-medium">Real-Time Breakdown:</span>
                  </div>
                  <div>
                    <span className="text-blue-700">Per Second:</span>
                    <span className="ml-2 font-medium text-blue-900">TZS {calculations.secondAmount}</span>
                  </div>
                  <div>
                    <span className="text-blue-700">Per Minute:</span>
                    <span className="ml-2 font-medium text-blue-900">TZS {calculations.minuteAmount}</span>
                  </div>
                  <div>
                    <span className="text-blue-700">Per Hour:</span>
                    <span className="ml-2 font-medium text-blue-900">TZS {calculations.hourlyAmount}</span>
                  </div>
                  <div>
                    <span className="text-blue-700">Per Day:</span>
                    <span className="ml-2 font-medium text-blue-900">TZS {calculations.dailyAmount}</span>
                  </div>
                  <div>
                    <span className="text-blue-700">Per Week:</span>
                    <span className="ml-2 font-medium text-blue-900">TZS {calculations.weeklyAmount}</span>
                  </div>
                  <div>
                    <span className="text-blue-700">Per Month:</span>
                    <span className="ml-2 font-medium text-blue-900">TZS {calculations.monthlyAmount}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Error Display */}
            {createLoanMutation.error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600 whitespace-pre-wrap">
                  {createLoanMutation.error.response?.data?.error || 
                   createLoanMutation.error.response?.data?.message ||
                   createLoanMutation.error.response?.data?.detail ||
                   'Failed to create loan. Please check all fields and try again.'}
                </p>
              </div>
            )}

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
                disabled={createLoanMutation.isLoading}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createLoanMutation.isLoading ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoanApplication;