// lib/api.js — Complete API Client with Error Handling (Plain JS)
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Helper for admin calls (automatically adds token)
const adminFetch = (endpoint, options = {}) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
  return fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  }).then(async (res) => {
    if (!res.ok) {
      // If 401 Unauthorized, clear token and redirect to login
      if (res.status === 401) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminUser');
          window.location.href = '/admin/login';
        }
      }
      const errorData = await res.json().catch(() => ({}));
      const error = new Error(errorData.error || 'API request failed');
      // Plain JS — no 'as any'
      error.status = res.status;
      throw error;
    }
    return res.json();
  });
};

// ========== PUBLIC APIS (No Auth Required) ==========

export const api = {
  // --- Company ---
  getCompany: (slug) => fetch(`${API_URL}/company/${slug}`).then(r => r.json()),

  // --- Categories ---
  getCategories: (companyId) => fetch(`${API_URL}/companies/${companyId}/categories`).then(r => r.json()),

  // --- Products ---
  getProducts: (companyId, { search, categoryId } = {}) => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (categoryId) params.append('categoryId', categoryId);
    return fetch(`${API_URL}/companies/${companyId}/products?${params}`).then(r => r.json());
  },

  getProduct: (id) => fetch(`${API_URL}/products/${id}`).then(r => r.json()),

  // --- Leads (Public) ---
  submitLead: (companyId, data) => fetch(`${API_URL}/companies/${companyId}/leads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(r => r.json()),

  // ========== ADMIN AUTH ==========

  adminLogin: (email, password) => fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  }).then(r => r.json()),

  // ========== ADMIN APIS (Require JWT Token) ==========

  // --- Products ---
  adminCreateProduct: (data) => adminFetch('/admin/products', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  adminUpdateProduct: (id, data) => adminFetch(`/admin/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  adminDeleteProduct: (id) => adminFetch(`/admin/products/${id}`, {
    method: 'DELETE',
  }),

  // --- Categories ---
  adminCreateCategory: (data) => adminFetch('/admin/categories', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  adminUpdateCategory: (id, data) => adminFetch(`/admin/categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  adminDeleteCategory: (id) => adminFetch(`/admin/categories/${id}`, {
    method: 'DELETE',
  }),

  // --- Leads (Admin) ---
  adminGetLeads: (companyId) => adminFetch(`/admin/companies/${companyId}/leads`),

  adminUpdateLeadStatus: (leadId, status) => adminFetch(`/admin/leads/${leadId}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  }),

  // --- Branding ---
  adminUpdateBranding: (data) => adminFetch('/company/admin/company', {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  // --- Upload ---
  adminUploadImage: (file) => {
    const formData = new FormData();
    formData.append('image', file);
    const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
    return fetch(`${API_URL}/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    }).then(r => r.json());
  },
};