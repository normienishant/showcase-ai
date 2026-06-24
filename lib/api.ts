// lib/api.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const adminFetch = (endpoint: string, options: RequestInit = {}) => {
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
      if (res.status === 401) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminUser');
          window.location.href = '/admin/login';
        }
      }
      const errorData = await res.json().catch(() => ({}));
      const error: any = new Error(errorData.error || 'API request failed');
      error.status = res.status;
      throw error;
    }
    return res.json();
  });
};

export const api = {
  getCompany: (slug: string) => fetch(`${API_URL}/company/${slug}`).then(r => r.json()),
  getCategories: (companyId: string) => fetch(`${API_URL}/companies/${companyId}/categories`).then(r => r.json()),
  getProducts: (companyId: string, { search, categoryId }: { search?: string; categoryId?: string } = {}) => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (categoryId) params.append('categoryId', categoryId);
    return fetch(`${API_URL}/companies/${companyId}/products?${params}`).then(r => r.json());
  },
  getProduct: (id: string) => fetch(`${API_URL}/products/${id}`).then(r => r.json()),
  submitLead: (companyId: string, data: any) => fetch(`${API_URL}/companies/${companyId}/leads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(r => r.json()),
  adminLogin: (email: string, password: string) => fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  }).then(r => r.json()),
  adminCreateProduct: (data: any) => adminFetch('/admin/products', { method: 'POST', body: JSON.stringify(data) }),
  adminUpdateProduct: (id: string, data: any) => adminFetch(`/admin/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  adminDeleteProduct: (id: string) => adminFetch(`/admin/products/${id}`, { method: 'DELETE' }),
  adminCreateCategory: (data: any) => adminFetch('/admin/categories', { method: 'POST', body: JSON.stringify(data) }),
  adminUpdateCategory: (id: string, data: any) => adminFetch(`/admin/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  adminDeleteCategory: (id: string) => adminFetch(`/admin/categories/${id}`, { method: 'DELETE' }),
  adminGetLeads: (companyId: string) => adminFetch(`/admin/companies/${companyId}/leads`),
  adminUpdateLeadStatus: (leadId: string, status: string) => adminFetch(`/admin/leads/${leadId}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  adminUpdateBranding: (data: any) => adminFetch('/company/admin/company', { method: 'PUT', body: JSON.stringify(data) }),
  adminUploadImage: (file: File) => {
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