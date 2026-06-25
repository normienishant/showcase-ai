// store/wishlist.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface WishlistItem {
  id: string;
  name: string;
  description?: string;
  images?: string[];
  specs?: Record<string, string>;
  categoryId?: string;      // added for category tracking
  quantity: number;         // made required with default 1
}

interface WishlistState {
  items: WishlistItem[];
  addItem: (item: Omit<WishlistItem, 'quantity'> & { quantity?: number }) => void;
  removeItem: (id: string) => void;
  removeFromWishlist: (id: string) => void; // alias for removeItem
  updateQuantity: (id: string, newQty: number) => void;
  clear: () => void;
  isInWishlist: (id: string) => boolean;
  totalItems: () => number;
  totalQuantity: () => number;
}

export const useWishlist = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        const existing = get().items.find((i) => i.id === item.id);
        if (existing) {
          // if already exists, just update quantity? or do nothing? better to update quantity
          set({
            items: get().items.map((i) =>
              i.id === item.id ? { ...i, quantity: (i.quantity || 0) + (item.quantity || 1) } : i
            ),
          });
        } else {
          set({
            items: [
              ...get().items,
              {
                ...item,
                quantity: item.quantity ?? 1,  // default to 1
              },
            ],
          });
        }
      },

      removeItem: (id) => set({ items: get().items.filter((i) => i.id !== id) }),
      removeFromWishlist: (id) => set({ items: get().items.filter((i) => i.id !== id) }),

      updateQuantity: (id, newQty) => {
        if (newQty <= 0) {
          // if quantity is 0 or negative, remove item
          get().removeItem(id);
          return;
        }
        set({
          items: get().items.map((i) =>
            i.id === id ? { ...i, quantity: newQty } : i
          ),
        });
      },

      clear: () => set({ items: [] }),
      isInWishlist: (id) => get().items.some((i) => i.id === id),
      totalItems: () => get().items.length,
      totalQuantity: () => get().items.reduce((acc, i) => acc + (i.quantity || 0), 0),
    }),
    { name: 'bpe-wishlist' }
  )
);