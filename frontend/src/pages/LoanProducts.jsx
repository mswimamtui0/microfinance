import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productAPI } from '../api';
import Loading from '../components/Common/Loading';
import toast from 'react-hot-toast';


const LoanProducts = () => {
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const queryClient = useQueryClient();

  const { data: products, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => productAPI.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: (data) => productAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['products']);
      toast.success('Loan product created successfully');
      setShowForm(false);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to create product');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => productAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['products']);
      toast.success('Loan product updated successfully');
      setShowForm(false);
      setEditingProduct(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to update product');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => productAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['products']);
      toast.success('Loan product deleted successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.error || 'Failed to delete product');
    },
  });

  if (isLoading) return <Loading />;

  const handleSubmit = (e) => {
    e.preventDefault();
    const form = e.target;
    const data = {
      product_name: form.product_name.value,
      product_code: form.product_code.value,
      description: form.description.value,
      min_amount: parseFloat(form.min_amount.value),
      max_amount: parseFloat(form.max_amount.value),
      interest_rate: parseFloat(form.interest_rate.value),
      interest_method: form.interest_method.value,
      min_term_months: parseInt(form.min_term_months.value),
      max_term_months: parseInt(form.max_term_months.value),
      repayment_frequency: form.repayment_frequency.value,
      repayment_percentage: parseFloat(form.repayment_percentage.value),
      penalty_rate: parseFloat(form.penalty_rate.value),
      grace_period_days: parseInt(form.grace_period_days.value),
      max_overdue_days: parseInt(form.max_overdue_days.value),
      allow_early_repayment: form.allow_early_repayment.checked,
      requires_guarantor: form.requires_guarantor.checked,
      is_active: form.is_active.checked,
    };

    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Loan Products</h1>
        <button
          onClick={() => { setShowForm(true); setEditingProduct(null); }}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          New Loan Product
        </button>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products?.data?.results?.map((product) => (
          <div key={product.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{product.product_name}</h3>
                <p className="text-sm text-gray-500">{product.product_code}</p>
              </div>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                product.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {product.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            
            <p className="text-sm text-gray-600 mt-2">{product.description}</p>
            
            <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-500">Amount:</span>
                <span className="ml-1 font-medium">
                  {product.min_amount.toLocaleString()} - {product.max_amount.toLocaleString()} TZS
                </span>
              </div>
              <div>
                <span className="text-gray-500">Interest:</span>
                <span className="ml-1 font-medium">{product.interest_rate}%</span>
              </div>
              <div>
                <span className="text-gray-500">Term:</span>
                <span className="ml-1 font-medium">{product.min_term_months} - {product.max_term_months} months</span>
              </div>
              <div>
                <span className="text-gray-500">Frequency:</span>
                <span className="ml-1 font-medium capitalize">{product.repayment_frequency}</span>
              </div>
              <div>
                <span className="text-gray-500">Penalty:</span>
                <span className="ml-1 font-medium">{product.penalty_rate}%</span>
              </div>
              <div>
                <span className="text-gray-500">Method:</span>
                <span className="ml-1 font-medium capitalize">{product.interest_method}</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200 flex justify-end space-x-2">
              <button
                onClick={() => { setEditingProduct(product); setShowForm(true); }}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Edit
              </button>
              <button
                onClick={() => {
                  if (window.confirm('Are you sure you want to delete this product?')) {
                    deleteMutation.mutate(product.id);
                  }
                }}
                className="text-red-600 hover:text-red-800 text-sm font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Product Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowForm(false)}></div>
            
            <div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingProduct ? 'Edit Loan Product' : 'New Loan Product'}
                </h2>
                <button
                  onClick={() => { setShowForm(false); setEditingProduct(null); }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  {/* Basic Information */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Product Name *</label>
                      <input
                        type="text"
                        name="product_name"
                        required
                        defaultValue={editingProduct?.product_name}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Product Code *</label>
                      <input
                        type="text"
                        name="product_code"
                        required
                        defaultValue={editingProduct?.product_code}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea
                      name="description"
                      rows="2"
                      defaultValue={editingProduct?.description}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  {/* Amounts */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Min Amount (TZS) *</label>
                      <input
                        type="number"
                        name="min_amount"
                        required
                        defaultValue={editingProduct?.min_amount}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Max Amount (TZS) *</label>
                      <input
                        type="number"
                        name="max_amount"
                        required
                        defaultValue={editingProduct?.max_amount}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>

                  {/* Interest */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Interest Rate (%) *</label>
                      <input
                        type="number"
                        step="0.1"
                        name="interest_rate"
                        required
                        defaultValue={editingProduct?.interest_rate}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Interest Method *</label>
                      <select
                        name="interest_method"
                        required
                        defaultValue={editingProduct?.interest_method || 'declining'}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="declining">Declining Balance</option>
                        <option value="flat">Flat Rate</option>
                      </select>
                    </div>
                  </div>

                  {/* Term */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Min Term (Months) *</label>
                      <input
                        type="number"
                        name="min_term_months"
                        required
                        defaultValue={editingProduct?.min_term_months}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Max Term (Months) *</label>
                      <input
                        type="number"
                        name="max_term_months"
                        required
                        defaultValue={editingProduct?.max_term_months}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>

                  {/* Repayment */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Repayment Frequency *</label>
                      <select
                        name="repayment_frequency"
                        required
                        defaultValue={editingProduct?.repayment_frequency || 'monthly'}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="custom">Custom</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Repayment Percentage (%) *</label>
                      <input
                        type="number"
                        step="0.1"
                        name="repayment_percentage"
                        required
                        defaultValue={editingProduct?.repayment_percentage || 10}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>

                  {/* Penalties */}
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Penalty Rate (%) *</label>
                      <input
                        type="number"
                        step="0.1"
                        name="penalty_rate"
                        required
                        defaultValue={editingProduct?.penalty_rate || 2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Grace Period (Days)</label>
                      <input
                        type="number"
                        name="grace_period_days"
                        defaultValue={editingProduct?.grace_period_days || 0}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Max Overdue Days</label>
                      <input
                        type="number"
                        name="max_overdue_days"
                        defaultValue={editingProduct?.max_overdue_days || 30}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>

                  {/* Options */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        name="allow_early_repayment"
                        defaultChecked={editingProduct?.allow_early_repayment !== false}
                        className="h-4 w-4 text-primary-600 rounded"
                      />
                      <label className="text-sm font-medium text-gray-700">Allow Early Repayment</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        name="requires_guarantor"
                        defaultChecked={editingProduct?.requires_guarantor !== false}
                        className="h-4 w-4 text-primary-600 rounded"
                      />
                      <label className="text-sm font-medium text-gray-700">Requires Guarantor</label>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      name="is_active"
                      defaultChecked={editingProduct?.is_active !== false}
                      className="h-4 w-4 text-primary-600 rounded"
                    />
                    <label className="text-sm font-medium text-gray-700">Active</label>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => { setShowForm(false); setEditingProduct(null); }}
                      className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={createMutation.isLoading || updateMutation.isLoading}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                    >
                      {createMutation.isLoading || updateMutation.isLoading ? 'Saving...' : 'Save Product'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoanProducts;