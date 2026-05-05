'use client';

import { X, Plus, Minus, ShoppingBag, Trash2 } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { useToast } from '@/components/Toast';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

export function CartDrawer() {
  const isOpen = useStore((s) => s.isCartOpen);
  const closeCart = useStore((s) => s.closeCart);
  const cart = useStore((s) => s.cart);
  const clearCart = useStore((s) => s.clearCart);
  const removeFromCart = useStore((s) => s.removeFromCart);
  const updateQuantity = useStore((s) => s.updateQuantity);
  const { showToast } = useToast();

  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const placeOrder = async () => {
    if (!cart.length) return;
    setIsCheckingOut(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: cart, discountAmount: 0 }),
      });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
      } else {
        showToast(data.error || 'Erreur lors du paiement', 'error');
        setIsCheckingOut(false);
      }
    } catch (err) {
      showToast('Erreur réseau', 'error');
      setIsCheckingOut(false);
    }
  };

  const subtotal = cart.reduce((s, i) => s + i.product.price * i.quantity, 0);
  const tva = subtotal * 0.2;
  const total = subtotal + tva;

  const handleCheckout = () => {
    placeOrder();
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={closeCart}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.aside
            className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-md bg-white shadow-2xl flex flex-col"
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-6 border-b border-[var(--border-soft)]">
              <div className="flex items-center gap-3">
                <ShoppingBag size={18} />
                <h2 className="font-cormorant text-2xl font-medium tracking-widest uppercase">Panier</h2>
              </div>
              <button onClick={closeCart} className="text-[var(--text-muted)] hover:text-black transition-colors"><X size={20} /></button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto bg-[var(--bg-alt)]">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-[var(--text-muted)] px-8">
                  <ShoppingBag size={32} strokeWidth={1} />
                  <p className="font-cormorant text-2xl">Votre panier est vide</p>
                </div>
              ) : (
                <div className="divide-y divide-[var(--border-soft)]">
                  {cart.map((item) => (
                    <div key={`${item.product.id}-${item.size}`} className="flex gap-5 p-6 bg-white">
                      <div className="relative w-20 aspect-[3/4] bg-[var(--bg-alt)] flex-shrink-0 rounded-xs overflow-hidden flex items-center justify-center text-center">
                        {item.product.image ? (
                          <Image src={item.product.image} alt={item.product.name} fill className="object-cover" sizes="80px" />
                        ) : (
                          <span className="text-[8px] text-[var(--text-muted)] uppercase tracking-widest px-2">Sans<br/>Image</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col">
                        <p className="text-[9px] tracking-widest uppercase font-medium text-[var(--text-muted)] mb-1">{item.product.category}</p>
                        <p className="text-sm font-medium leading-snug">{item.product.name}</p>
                        {item.size && <p className="text-[10px] tracking-widest font-medium uppercase text-[var(--text-muted)] mt-1">Taille: {item.size}</p>}
                        
                        <div className="mt-auto flex items-end justify-between">
                          <p className="font-medium text-sm">{item.product.price.toFixed(2)} €</p>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center border border-[var(--border-soft)] rounded-sm overflow-hidden">
                              <button onClick={() => updateQuantity(item.product.id, item.quantity - 1, item.size)} className="p-2 bg-[var(--bg-alt)] hover:bg-black hover:text-white transition-colors"><Minus size={10} /></button>
                              <span className="text-xs font-medium w-8 text-center">{item.quantity}</span>
                              <button onClick={() => updateQuantity(item.product.id, item.quantity + 1, item.size)} className="p-2 bg-[var(--bg-alt)] hover:bg-black hover:text-white transition-colors"><Plus size={10} /></button>
                            </div>
                            <button onClick={() => removeFromCart(item.product.id, item.size)} className="p-2 text-[var(--text-muted)] hover:text-red-500 bg-[var(--bg-alt)] rounded-sm transition-colors"><Trash2 size={14} /></button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {cart.length > 0 && (
              <div className="px-8 py-8 border-t border-[var(--border-soft)] bg-white">
                <div className="space-y-3 mb-8">
                  <div className="flex justify-between text-xs font-medium text-[var(--text-muted)]"><span>Sous-total HT</span><span>{subtotal.toFixed(2)} €</span></div>
                  <div className="flex justify-between text-xs font-medium text-[var(--text-muted)]"><span>TVA (20%)</span><span>{tva.toFixed(2)} €</span></div>
                  <div className="flex justify-between pt-4 mt-2 font-medium text-lg border-t border-[var(--border-soft)]">
                    <span>Total TTC</span><span>{total.toFixed(2)} €</span>
                  </div>
                </div>
                <button onClick={handleCheckout} disabled={isCheckingOut} className="btn-primary w-full py-4 text-xs rounded-sm disabled:opacity-50">
                  {isCheckingOut ? 'Redirection vers Stripe...' : 'Valider la commande'}
                </button>
              </div>
            )}
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
