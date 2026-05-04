'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ─── Types ───────────────────────────────────────────────────────────────────

export type Size = 'S' | 'M' | 'L' | 'XL';
export type StockBySizes = Record<Size, number>;

/** Produit tel que retourné par l'API /api/products */
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  featured: boolean;
  stockS: number;
  stockM: number;
  stockL: number;
  stockXL: number;
  createdAt?: string;
  updatedAt?: string;
  /** Commodité front-end — construit depuis stockS/M/L/XL */
  stock?: StockBySizes;
}

export interface CartItem {
  product: Product;
  quantity: number;
  /** Taille sélectionnée (optionnel pour les accessoires) */
  size?: Size;
}

// ─── Store (panier + UI seulement) ───────────────────────────────────────────

interface CartStore {
  cart: CartItem[];
  isCartOpen: boolean;

  addToCart: (product: Product, size?: Size) => void;
  removeFromCart: (productId: string, size?: Size) => void;
  updateQuantity: (productId: string, quantity: number, size?: Size) => void;
  clearCart: () => void;
  toggleCart: () => void;
  closeCart: () => void;
}

export const useStore = create<CartStore>()(
  persist(
    (set, get) => ({
      cart: [],
      isCartOpen: false,

      addToCart: (product, size) => {
        const { cart } = get();
        const key = (i: CartItem) =>
          i.product.id === product.id && i.size === size;
        const existing = cart.find(key);
        if (existing) {
          set({ cart: cart.map((i) => (key(i) ? { ...i, quantity: i.quantity + 1 } : i)) });
        } else {
          set({ cart: [...cart, { product, quantity: 1, size }] });
        }
      },

      removeFromCart: (productId, size) => {
        set((state) => ({
          cart: state.cart.filter(
            (i) => !(i.product.id === productId && i.size === size)
          ),
        }));
      },

      updateQuantity: (productId, quantity, size) => {
        const key = (i: CartItem) => i.product.id === productId && i.size === size;
        if (quantity <= 0) {
          set((state) => ({ cart: state.cart.filter((i) => !key(i)) }));
          return;
        }
        set((state) => ({
          cart: state.cart.map((i) => (key(i) ? { ...i, quantity } : i)),
        }));
      },

      clearCart: () => set({ cart: [] }),
      toggleCart: () => set((state) => ({ isCartOpen: !state.isCartOpen })),
      closeCart: () => set({ isCartOpen: false }),
    }),
    { name: 'moudestar-cart-v1' }
  )
);

// ─── Helper: convertir un produit DB en format stock front-end ────────────────
export function toFrontendProduct(p: Product): Product {
  return {
    ...p,
    stock: {
      S: p.stockS,
      M: p.stockM,
      L: p.stockL,
      XL: p.stockXL,
    },
  };
}
