'use client';

import { X, Plus, Minus, ShoppingBag, Trash2 } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { useToast } from '@/components/Toast';
import Image from 'next/image';

export function CartDrawer() {
  const isOpen = useStore((s) => s.isCartOpen);
  const closeCart = useStore((s) => s.closeCart);
  const cart = useStore((s) => s.cart);
  const removeFromCart = useStore((s) => s.removeFromCart);
  const updateQuantity = useStore((s) => s.updateQuantity);
  const placeOrder = useStore((s) => s.placeOrder);
  const { showToast } = useToast();

  const total = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  const handleCheckout = () => {
    if (cart.length === 0) return;
    placeOrder();
    showToast('✓ Commande validée ! Visible dans le panel admin.', 'success');
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={closeCart}
      />

      {/* Drawer */}
      <aside
        className={`fixed top-0 right-0 bottom-0 z-50 w-full max-w-sm bg-[var(--dark-2)] flex flex-col shadow-2xl transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
          <div className="flex items-center gap-3">
            <ShoppingBag size={18} className="text-[var(--gold)]" />
            <h2 className="font-cormorant text-xl font-light tracking-widest uppercase">
              Mon Panier
            </h2>
          </div>
          <button onClick={closeCart} className="text-[var(--gray-3)] hover:text-white transition-colors p-1">
            <X size={20} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-[var(--gray-3)]">
              <ShoppingBag size={48} strokeWidth={1} />
              <p className="text-sm tracking-widest uppercase">Votre panier est vide</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.product.id} className="flex gap-4 py-4 border-b border-white/5 last:border-0 animate-fade-in">
                <div className="relative w-20 h-20 flex-shrink-0 rounded overflow-hidden bg-[var(--dark-3)]">
                  <Image
                    src={item.product.image}
                    alt={item.product.name}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--light)] truncate">{item.product.name}</p>
                  <p className="text-[var(--gold)] text-sm mt-0.5">{item.product.price.toFixed(2)} €</p>
                  <div className="flex items-center gap-3 mt-3">
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      className="w-7 h-7 flex items-center justify-center border border-[var(--gray-1)] hover:border-[var(--gold)] text-[var(--gray-3)] hover:text-[var(--gold)] rounded transition-colors"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="text-sm w-4 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      className="w-7 h-7 flex items-center justify-center border border-[var(--gray-1)] hover:border-[var(--gold)] text-[var(--gray-3)] hover:text-[var(--gold)] rounded transition-colors"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => removeFromCart(item.product.id)}
                  className="text-[var(--gray-2)] hover:text-red-400 transition-colors self-start pt-0.5"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="px-6 py-6 border-t border-white/5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--gray-3)] uppercase tracking-widest">Total</span>
              <span className="font-cormorant text-2xl font-light text-[var(--white)]">
                {total.toFixed(2)} €
              </span>
            </div>
            <button
              onClick={handleCheckout}
              className="w-full py-4 bg-[var(--gold)] hover:bg-[var(--gold-light)] text-[var(--dark)] text-sm font-semibold tracking-widest uppercase transition-colors duration-200 rounded"
            >
              Valider la commande
            </button>
            <p className="text-center text-xs text-[var(--gray-2)] tracking-wide">
              Livraison offerte • Pas de paiement requis
            </p>
          </div>
        )}
      </aside>
    </>
  );
}
