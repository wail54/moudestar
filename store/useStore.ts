'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Size = 'S' | 'M' | 'L' | 'XL';
export type StockBySizes = Record<Size, number>;

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  featured?: boolean;
  /** Stock par taille. Si absent = non applicable (ex: accessoires) */
  stock?: StockBySizes;
}

export interface CartItem {
  product: Product;
  quantity: number;
  /** Taille sélectionnée (optionnel pour les accessoires) */
  size?: Size;
}

export type OrderStatus = 'En attente' | 'Confirmée' | 'Expédiée' | 'Terminée';
export type OrderSource = 'en_ligne' | 'caisse';

export interface Order {
  id: string;
  date: string;
  items: CartItem[];
  subtotal: number;
  discount: number;   // montant remise HT
  tva: number;
  total: number;
  status: OrderStatus;
  source: OrderSource;
}

interface StoreState {
  products: Product[];
  cart: CartItem[];
  orders: Order[];
  isCartOpen: boolean;

  // Products
  addProduct: (product: Omit<Product, 'id'>) => void;
  removeProduct: (id: string) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  decreaseStock: (id: string, size: Size | undefined, qty: number) => void;

  // Cart (online)
  addToCart: (product: Product, size?: Size) => void;
  removeFromCart: (productId: string, size?: Size) => void;
  updateQuantity: (productId: string, quantity: number, size?: Size) => void;
  clearCart: () => void;
  toggleCart: () => void;
  closeCart: () => void;

  // Orders
  placeOrder: () => void;
  placePosOrder: (items: CartItem[], discountAmount: number) => void;
  updateOrderStatus: (id: string, status: OrderStatus) => void;
  deleteOrder: (id: string) => void;
}

// ─── Default stock helper ────────────────────────────────────────────────────
function makeStock(s = 10, m = 12, l = 8, xl = 5): StockBySizes {
  return { S: s, M: m, L: l, XL: xl };
}

const defaultProducts: Product[] = [
  {
    id: '1',
    name: 'T-Shirt Essentiel Blanc',
    description: 'T-shirt classique en coton bio ultra-doux. Coupe droite et col rond côtelé pour un confort absolu.',
    price: 35,
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80&auto=format&fit=crop',
    category: 'Vêtements',
    featured: true,
    stock: makeStock(15, 20, 15, 10),
  },
  {
    id: '2',
    name: 'Chemise Minimaliste Noire',
    description: 'Chemise en popeline de coton légère. Coupe élégante, col classique et boutons dissimulés.',
    price: 89,
    image: 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=600&q=80&auto=format&fit=crop',
    category: 'Vêtements',
    featured: true,
    stock: makeStock(5, 12, 8, 4),
  },
  {
    id: '3',
    name: 'Sweat à Capuche Gris',
    description: 'Sweat à capuche en molleton brossé. Un intemporel chaud et confortable, doté d\'une poche kangourou.',
    price: 75,
    image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600&q=80&auto=format&fit=crop',
    category: 'Vêtements',
    featured: true,
    stock: makeStock(8, 15, 12, 6),
  },
  {
    id: '4',
    name: 'Veste en Jean Indigo',
    description: 'Veste en denim rigide avec surpiqûres contrastées. Coupe vintage modernisée.',
    price: 120,
    image: 'https://images.unsplash.com/photo-1601333144130-8cbb312386b6?w=600&q=80&auto=format&fit=crop',
    category: 'Vêtements',
    featured: false,
    stock: makeStock(4, 7, 5, 2),
  },
  {
    id: '5',
    name: 'Sneakers Épurées Blanches',
    description: 'Baskets basses en cuir pleine fleur. Semelle en caoutchouc minimaliste et lacets ton sur ton.',
    price: 145,
    image: 'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=600&q=80&auto=format&fit=crop',
    category: 'Chaussures',
    featured: true,
    stock: makeStock(3, 5, 4, 2),
  },
  {
    id: '6',
    name: 'Casquette Signature Noire',
    description: 'Casquette classique en toile de coton structurée, ajustable à l\'arrière.',
    price: 30,
    image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=600&q=80&auto=format&fit=crop',
    category: 'Accessoires',
    featured: false,
  },
  {
    id: '7',
    name: 'Montre Minimaliste Argent',
    description: 'Montre avec boîtier en acier inoxydable et cadran épuré. Mouvement à quartz de précision.',
    price: 160,
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80&auto=format&fit=crop',
    category: 'Accessoires',
    featured: false,
  },
  {
    id: '8',
    name: 'Sac à Bandoulière',
    description: 'Sac en cuir premium avec intérieur doublé et bandoulière large ajustable.',
    price: 95,
    image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&q=80&auto=format&fit=crop',
    category: 'Accessoires',
    featured: false,
  }
];

const TVA_RATE = 0.20;

function buildOrder(
  items: CartItem[],
  source: OrderSource,
  discountAmount: number
): Order {
  const subtotal = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
  const discounted = Math.max(0, subtotal - discountAmount);
  const tva = discounted * TVA_RATE;
  const total = discounted + tva;
  return {
    id: source === 'caisse' ? `POS-${Date.now()}` : `CMD-${Date.now()}`,
    date: new Date().toLocaleDateString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }),
    items: [...items],
    subtotal,
    discount: discountAmount,
    tva,
    total,
    status: source === 'caisse' ? 'Terminée' : 'En attente',
    source,
  };
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      products: defaultProducts,
      cart: [],
      orders: [],
      isCartOpen: false,

      addProduct: (product) => {
        const newProduct: Product = { ...product, id: Date.now().toString() };
        set((state) => ({ products: [...state.products, newProduct] }));
      },

      removeProduct: (id) => {
        set((state) => ({ products: state.products.filter((p) => p.id !== id) }));
      },

      updateProduct: (id, updates) => {
        set((state) => ({
          products: state.products.map((p) => (p.id === id ? { ...p, ...updates } : p)),
        }));
      },

      decreaseStock: (id, size, qty) => {
        set((state) => ({
          products: state.products.map((p) => {
            if (p.id !== id || !p.stock || !size) return p;
            return {
              ...p,
              stock: {
                ...p.stock,
                [size]: Math.max(0, p.stock[size] - qty),
              },
            };
          }),
        }));
      },

      addToCart: (product, size) => {
        const { cart } = get();
        const key = (i: CartItem) => i.product.id === product.id && i.size === size;
        const existing = cart.find(key);
        if (existing) {
          set({ cart: cart.map((i) => key(i) ? { ...i, quantity: i.quantity + 1 } : i) });
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
          cart: state.cart.map((i) => key(i) ? { ...i, quantity } : i),
        }));
      },

      clearCart: () => set({ cart: [] }),
      toggleCart: () => set((state) => ({ isCartOpen: !state.isCartOpen })),
      closeCart: () => set({ isCartOpen: false }),

      placeOrder: () => {
        const { cart, decreaseStock } = get();
        if (cart.length === 0) return;
        const order = buildOrder(cart, 'en_ligne', 0);
        cart.forEach((item) => decreaseStock(item.product.id, item.size, item.quantity));
        set((state) => ({ orders: [order, ...state.orders], cart: [], isCartOpen: false }));
      },

      placePosOrder: (items, discountAmount) => {
        if (items.length === 0) return;
        const order = buildOrder(items, 'caisse', discountAmount);
        const { decreaseStock } = get();
        items.forEach((item) => decreaseStock(item.product.id, item.size, item.quantity));
        set((state) => ({ orders: [order, ...state.orders] }));
      },

      updateOrderStatus: (id, status) => {
        set((state) => ({
          orders: state.orders.map((o) => (o.id === id ? { ...o, status } : o)),
        }));
      },

      deleteOrder: (id) => {
        set((state) => ({ orders: state.orders.filter((o) => o.id !== id) }));
      },
    }),
    { name: 'moudestar-store-v4', skipHydration: true }
  )
);
