// src/api/index.js
import axios from 'axios';

// Force HTTP for local development
const API_URL = 'http://localhost:8000/api';

console.log('API URL:', API_URL);

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false,
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle responses
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        const response = await axios.post(`${API_URL}/auth/refresh/`, {
          refresh: refreshToken,
        });
        localStorage.setItem('access_token', response.data.access);
        originalRequest.headers.Authorization = `Bearer ${response.data.access}`;
        return api(originalRequest);
      } catch (err) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ============================================
// AUTH API
// ============================================
export const authAPI = {
  login: (credentials) => {
    return api.post('/auth/login/', credentials);
  },
  logout: () => {
    return api.post('/auth/logout/');
  },
  refresh: (refresh) => {
    return api.post('/auth/refresh/', { refresh });
  },
  profile: () => {
    return api.get('/auth/profile/');
  },
  register: (data) => {
    return api.post('/auth/register/', data);
  },
  getBranches: () => {
    return api.get('/branches/');
  },
  updateProfile: (data) => {
    return api.put('/auth/update_profile/', data);
  },
  changePassword: (data) => {
    return api.post('/auth/change_password/', data);
  },
};

// ============================================
// LOAN API
// ============================================
export const loanAPI = {
  getAll: (params) => {
    return api.get('/loans/', { params });
  },
  getLoanRealTimeStatus: (id) => {
    return api.get(`/loans/${id}/realtime_status/`);
  },
  getById: (id) => {
    return api.get(`/loans/${id}/`);
  },
  create: (data) => {
    return api.post('/loans/', data);
  },
  approve: (id) => {
    return api.post(`/loans/${id}/approve/`);
  },
  disburse: (id) => {
    return api.post(`/loans/${id}/disburse/`);
  },
  getSchedule: (id) => {
    return api.get(`/loans/${id}/schedule/`);
  },
  calculatePenalty: (id, data) => {
    return api.post(`/loans/${id}/calculate_penalty/`, data);
  },
  update: (id, data) => {
    return api.put(`/loans/${id}/`, data);
  },
  delete: (id) => {
    return api.delete(`/loans/${id}/`);
  },
};

// ============================================
// CUSTOMER API
// ============================================
export const customerAPI = {
  getAll: (params) => {
    return api.get('/customers/', { params });
  },
  getById: (id) => {
    return api.get(`/customers/${id}/`);
  },
  create: (data) => {
    return api.post('/customers/', data);
  },
  update: (id, data) => {
    return api.put(`/customers/${id}/`, data);
  },
  delete: (id) => {
    return api.delete(`/customers/${id}/`);
  },
  getGuarantors: (id) => {
    return api.get(`/customers/${id}/guarantors/`);
  },
  addGuarantor: (id, data) => {
    return api.post(`/customers/${id}/add_guarantor/`, data);
  },
};

// ============================================
// PAYMENT API
// ============================================
export const paymentAPI = {
  getAll: (params) => {
    return api.get('/payments/', { params });
  },
  getById: (id) => {
    return api.get(`/payments/${id}/`);
  },
  create: (data) => {
    return api.post('/payments/', data);
  },
  update: (id, data) => {
    return api.put(`/payments/${id}/`, data);
  },
  delete: (id) => {
    return api.delete(`/payments/${id}/`);
  },
  getByLoan: (loanId) => {
    return api.get(`/payments/?loan=${loanId}`);
  },
  getSummary: () => {
    return api.get('/payments/summary/');
  },
};

// ============================================
// PRODUCT API
// ============================================
export const productAPI = {
  getAll: (params) => {
    return api.get('/loan-products/', { params });
  },
  getById: (id) => {
    return api.get(`/loan-products/${id}/`);
  },
  create: (data) => {
    return api.post('/loan-products/', data);
  },
  update: (id, data) => {
    return api.put(`/loan-products/${id}/`, data);
  },
  delete: (id) => {
    return api.delete(`/loan-products/${id}/`);
  },
};

// ============================================
// REPORT API
// ============================================
export const reportAPI = {
  getPortfolio: (params) => {
    return api.get('/reports/portfolio/', { params });
  },
  getCollections: (params) => {
    return api.get('/reports/collections/', { params });
  },
};

// ============================================
// BRANCH API
// ============================================
export const branchAPI = {
  getAll: (params) => {
    return api.get('/branches/', { params });
  },
  getById: (id) => {
    return api.get(`/branches/${id}/`);
  },
  create: (data) => {
    return api.post('/branches/', data);
  },
  update: (id, data) => {
    return api.put(`/branches/${id}/`, data);
  },
  delete: (id) => {
    return api.delete(`/branches/${id}/`);
  },
};

// ============================================
// CUSTOMER PORTAL API
// ============================================
export const customerPortalAPI = {
  register: (data) => {
    return api.post('/customer/auth/register/', data);
  },
  login: (credentials) => {
    return api.post('/customer/auth/login/', credentials);
  },
  sendOTP: (data) => {
    return api.post('/customer/auth/send_otp/', data);
  },
  verifyOTP: (data) => {
    return api.post('/customer/auth/verify_otp/', data);
  },
  dashboard: (phone) => {
    return api.get('/customer/dashboard/', { params: { phone } });
  },
  applyLoan: (data) => {
    return api.post('/customer/apply_loan/', data);
  },
  getLoans: (phone) => {
    return api.get('/customer/loans/', { params: { phone } });
  },
  getPayments: (phone) => {
    return api.get('/customer/payment_history/', { params: { phone } });
  },
};

export default api;