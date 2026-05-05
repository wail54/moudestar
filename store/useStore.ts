'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ─── Types ───────────────────────────────────────────────────────────────────

export type SizeType = 'NONE' | 'CLOTHING' | 'SHOES';

export interface ProductVariant {
  id: string;
  productId: string;
  color: string | null;
  size: string | null;
  stock: number;
  barcode: string | null;
  shortId: string | null;
}

/** Produit tel que retourné par l'API /api/products */
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  category: string;
  featured: boolean;
  sizeType: SizeType;
  barcode: string | null;
  shortId: string | null;
  createdAt?: string;
  updatedAt?: string;
  variants: ProductVariant[];
  
  // Commodité: on garde l'ancienne propriété `image` qui pointe vers la première image du tableau
  image?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  variantId?: string;
  size?: string; // pour rétrocompatibilité
  color?: string; // optionnel
}

// ─── Store (panier + UI seulement) ───────────────────────────────────────────

interface CartStore {
  cart: CartItem[];
  isCartOpen: boolean;

  addToCart: (product: Product, variantId?: string, size?: string, color?: string) => void;
  removeFromCart: (productId: string, variantId?: string) => void;
  updateQuantity: (productId: string, quantity: number, variantId?: string) => void;
  setCart: (items: CartItem[]) => void;
  clearCart: () => void;
  toggleCart: () => void;
  closeCart: () => void;
}

export const useStore = create<CartStore>()(
  persist(
    (set, get) => ({
      cart: [],
      isCartOpen: false,

      addToCart: (product, variantId, size, color) => {
        const { cart } = get();
        // Clé unique pour identifier un article: même ID produit et même variante (ou taille par défaut)
        const key = (i: CartItem) => i.product.id === product.id && i.variantId === variantId && i.size === size && i.color === color;
        const existing = cart.find(key);
        if (existing) {
          set({ cart: cart.map((i) => (key(i) ? { ...i, quantity: i.quantity + 1 } : i)) });
        } else {
          set({ cart: [...cart, { product, quantity: 1, variantId, size, color }] });
        }
      },

      removeFromCart: (productId, variantId) => {
        set((state) => ({
          cart: state.cart.filter(
            (i) => !(i.product.id === productId && i.variantId === variantId)
          ),
        }));
      },

      updateQuantity: (productId, quantity, variantId) => {
        const key = (i: CartItem) => i.product.id === productId && i.variantId === variantId;
        if (quantity <= 0) {
          set((state) => ({ cart: state.cart.filter((i) => !key(i)) }));
          return;
        }
        set((state) => ({
          cart: state.cart.map((i) => (key(i) ? { ...i, quantity } : i)),
        }));
      },

      clearCart: () => set({ cart: [] }),
      setCart: (items) => set({ cart: items }),
      toggleCart: () => set((state) => ({ isCartOpen: !state.isCartOpen })),
      closeCart: () => set({ isCartOpen: false }),
    }),
    { name: 'moudestar-cart-v1' }
  )
);

// ─── Helper: formater le produit pour le front-end ────────────────────────────
export function toFrontendProduct(p: any): Product {
  return {
    ...p,
    image: p.images?.[0] || '', // backward compatibility
  };
}
