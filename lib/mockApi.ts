// lib/mockApi.ts
import { MOCK_COMPANY, MOCK_CATEGORIES, MOCK_PRODUCTS } from './mockData';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const mockApi = {
  getCompany: async (slug: string) => {
    await delay(300);
    if (slug !== 'bpe') throw new Error('Company not found');
    return MOCK_COMPANY;
  },

  getCategories: async (companyId: string) => {
    await delay(200);
    return MOCK_CATEGORIES;
  },

  getProducts: async (companyId: string, filters?: { search?: string; categoryId?: string }) => {
    await delay(400);
    let filtered = MOCK_PRODUCTS;
    if (filters?.search) {
      const s = filters.search.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(s) || 
        p.description.toLowerCase().includes(s) ||
        Object.values(p.specs).some(v => v.toLowerCase().includes(s))
      );
    }
    if (filters?.categoryId) {
      const category = MOCK_CATEGORIES.find(c => c.id === filters.categoryId);
      if (category) {
        const childIds = MOCK_CATEGORIES.filter(c => c.parentId === category.id).map(c => c.id);
        if (childIds.length > 0) {
          filtered = filtered.filter(p => childIds.includes(p.categoryId));
        } else {
          filtered = filtered.filter(p => p.categoryId === filters.categoryId);
        }
      }
    }
    return filtered;
  },

  getProduct: async (productId: string) => {
    await delay(200);
    const product = MOCK_PRODUCTS.find(p => p.id === productId);
    if (!product) throw new Error('Product not found');
    return product;
  },

  submitLead: async (data: { name: string; email: string; phone: string; message: string; wishlist: any[] }) => {
    await delay(1000);
    console.log('Lead submitted (MOCK):', data);
    return { success: true, id: 'mock-lead-123' };
  }
};