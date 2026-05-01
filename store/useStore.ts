'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  featured?: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Order {
  id: string;
  date: string;
  items: CartItem[];
  total: number;
  status: 'En attente' | 'Confirmée' | 'Expédiée' | 'Livrée';
}

interface StoreState {
  products: Product[];
  cart: CartItem[];
  orders: Order[];
  isCartOpen: boolean;

  // Products
  addProduct: (product: Omit<Product, 'id'>) => void;
  removeProduct: (id: string) => void;

  // Cart
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  closeCart: () => void;

  // Orders
  placeOrder: () => void;
  updateOrderStatus: (id: string, status: Order['status']) => void;
}

const defaultProducts: Product[] = [
  {
    id: '1',
    name: 'Veste Oversize Crème',
    description: 'Une veste oversize en laine mélangée, coupe structurée, finitions premium.',
    price: 189,
    image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&q=80&auto=format&fit=crop',
    category: 'Vêtements',
    featured: true,
  },
  {
    id: '2',
    name: 'Pantalon Tailleur Noir',
    description: 'Pantalon tailleur à coupe droite, tissu fluide anti-froissements.',
    price: 129,
    image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&q=80&auto=format&fit=crop',
    category: 'Vêtements',
    featured: true,
  },
  {
    id: '3',
    name: 'Sac Minimaliste Camel',
    description: 'Sac en cuir végétalien, format compact, bandoulière ajustable.',
    price: 149,
    image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&q=80&auto=format&fit=crop',
    category: 'Accessoires',
    featured: true,
  },
  {
    id: '4',
    name: 'Chemise Lin Blanc Cassé',
    description: 'Chemise en lin naturel lavé, col cubain, coupe relaxée.',
    price: 89,
    image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600&q=80&auto=format&fit=crop',
    category: 'Vêtements',
    featured: false,
  },
  {
    id: '5',
    name: 'Sneakers Cuir Blanc',
    description: 'Sneakers en cuir pleine fleur, semelle légère, coloris intemporel.',
    price: 210,
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80&auto=format&fit=crop',
    category: 'Chaussures',
    featured: true,
  },
  {
    id: '6',
    name: 'Pull Col Roulé Gris',
    description: 'Pull en laine mérinos 100%, col roulé, ultra-doux.',
    price: 119,
    image: 'https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=600&q=80&auto=format&fit=crop',
    category: 'Vêtements',
    featured: false,
  },
  {
    id: '7',
    name: 'Ceinture Cuir Noir',
    description: 'Ceinture en cuir grainé, boucle dorée, coupe classique.',
    price: 65,
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&q=80&auto=format&fit=crop',
    category: 'Accessoires',
    featured: false,
  },
  {
    id: '8',
    name: 'Robe Midi Fluide',
    description: 'Robe midi en viscose imprimée, col V, manches longues.',
    price: 145,
    image: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=600&q=80&auto=format&fit=crop',
    category: 'Vêtements',
    featured: false,
  },
];

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      products: defaultProducts,
      cart: [],
      orders: [],
      isCartOpen: false,

      addProduct: (product) => {
        const newProduct: Product = {
          ...product,
          id: Date.now().toString(),
        };
        set((state) => ({ products: [...state.products, newProduct] }));
      },

      removeProduct: (id) => {
        set((state) => ({ products: state.products.filter((p) => p.id !== id) }));
      },

      addToCart: (product) => {
        const { cart } = get();
        const existing = cart.find((item) => item.product.id === product.id);
        if (existing) {
          set({
            cart: cart.map((item) =>
              item.product.id === product.id
                ? { ...item, quantity: item.quantity + 1 }
                : item
            ),
          });
        } else {
          set({ cart: [...cart, { product, quantity: 1 }] });
        }
      },

      removeFromCart: (productId) => {
        set((state) => ({
          cart: state.cart.filter((item) => item.product.id !== productId),
        }));
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeFromCart(productId);
          return;
        }
        set((state) => ({
          cart: state.cart.map((item) =>
            item.product.id === productId ? { ...item, quantity } : item
          ),
        }));
      },

      clearCart: () => set({ cart: [] }),

      toggleCart: () => set((state) => ({ isCartOpen: !state.isCartOpen })),
      closeCart: () => set({ isCartOpen: false }),

      placeOrder: () => {
        const { cart } = get();
        if (cart.length === 0) return;
        const total = cart.reduce(
          (sum, item) => sum + item.product.price * item.quantity,
          0
        );
        const order: Order = {
          id: `CMD-${Date.now()}`,
          date: new Date().toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }),
          items: [...cart],
          total,
          status: 'En attente',
        };
        set((state) => ({
          orders: [order, ...state.orders],
          cart: [],
          isCartOpen: false,
        }));
      },

      updateOrderStatus: (id, status) => {
        set((state) => ({
          orders: state.orders.map((o) => (o.id === id ? { ...o, status } : o)),
        }));
      },
    }),
    {
      name: 'moudestar-store',
      skipHydration: true,
    }
  )
);
