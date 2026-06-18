// store/wishlist.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface WishlistItem {
  id: string;
  name: string;
  description: string;
  images: string[];
  specs: Record<string, string>;
}

interface WishlistState {
  items: WishlistItem[];
  addItem: (item: WishlistItem) => void;
  removeItem: (id: string) => void;
  clear: () => void;
  isInWishlist: (id: string) => boolean;
  totalItems: () => number;
}

export const useWishlist = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => {
        if (!get().isInWishlist(item.id)) {
          set({ items: [...get().items, item] });
        }
      },
      removeItem: (id) => set({ items: get().items.filter(i => i.id !== id) }),
      clear: () => set({ items: [] }),
      isInWishlist: (id) => get().items.some(i => i.id === id),
      totalItems: () => get().items.length,
    }),
    { name: 'bpe-wishlist' }
  )
);