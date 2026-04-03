import axios from 'axios';

const API_BASE = import.meta.env?.VITE_API_URL || 'http://127.0.0.1:8000/api';

const client = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Attach token to every request
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 (unauthorized)
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const authApi = {
  register: (data) => client.post('/register', data),
  login: (data) => client.post('/login', data),
  logout: () => client.post('/logout'),
  getUser: () => client.get('/user'),
};

// Dashboard
export const dashboardApi = {
  getSummary: () => client.get('/dashboard/summary'),
};

// Transactions
export const transactionApi = {
  getAll: (params) => client.get('/transactions', { params }),
  create: (data) => client.post('/transactions', data),
  update: (id, data) => client.put(`/transactions/${id}`, data),
  delete: (id) => client.delete(`/transactions/${id}`),
};

// Categories
export const categoryApi = {
  getAll: (params) => client.get('/categories', { params }),
  create: (data) => client.post('/categories', data),
  update: (id, data) => client.put(`/categories/${id}`, data),
  delete: (id) => client.delete(`/categories/${id}`),
};

// Budgets
export const budgetApi = {
  getAll: (params) => client.get('/budgets', { params }),
  create: (data) => client.post('/budgets', data),
  update: (id, data) => client.put(`/budgets/${id}`, data),
};

// Bills
export const billApi = {
  getAll: () => client.get('/bills'),
  create: (data) => client.post('/bills', data),
  update: (id, data) => client.put(`/bills/${id}`, data),
  delete: (id) => client.delete(`/bills/${id}`),
};

// Goals
export const goalApi = {
  getAll: () => client.get('/goals'),
  create: (data) => client.post('/goals', data),
  update: (id, data) => client.put(`/goals/${id}`, data),
  delete: (id) => client.delete(`/goals/${id}`),
  deposit: (id, data) => client.post(`/goals/${id}/deposit`, data),
  getDeposits: (id) => client.get(`/goals/${id}/deposits`),
  distribute: (data) => client.post('/goals/distribute', data),
};

// Allocations
export const allocationApi = {
  getAll: () => client.get('/allocations'),
  sync: (data) => client.post('/allocations/sync', data),
};

// Family Members
export const familyApi = {
  getAll: () => client.get('/family-members'),
  create: (data) => client.post('/family-members', data),
  update: (id, data) => client.put(`/family-members/${id}`, data),
  delete: (id) => client.delete(`/family-members/${id}`),
};

// Projections
export const projectionApi = {
  getCashflow: (params) => client.get('/projections/cashflow', { params }),
  getDebtFree: () => client.get('/projections/debt-free'),
  getChildTimeline: () => client.get('/projections/child-timeline'),
};

// Settings
export const settingApi = {
  getAll: () => client.get('/settings'),
  update: (data) => client.put('/settings', { settings: data }),
  exportData: () => client.post('/settings/export'),
  importData: (data) => client.post('/settings/import', { data }),
};

export default client;
