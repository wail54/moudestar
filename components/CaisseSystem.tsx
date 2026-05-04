'use client';

import { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Minus, Trash2, ShoppingCart, X, Tag, PenLine, Send } from 'lucide-react';
import { CartItem, Product, Size, toFrontendProduct } from '@/store/useStore';
import { useToast } from '@/components/Toast';

const TVA = 0.20;
type DiscountType = 'pct' | 'fixed';
interface FreeItem { id: string; name: string; price: number; }

export function CaisseSystem() {
  const [products, setProducts] = useState<Product[]>([]);
  const { showToast } = useToast();

  useEffect(() => {
    fetch('/api/products')
      .then((r) => r.json())
      .then((data: Product[]) => setProducts(data.map(toFrontendProduct)))
      .catch(console.error);
  }, []);

  const [query, setQuery] = useState('');
  const [posCart, setPosCart] = useState<CartItem[]>([]);
  const [freeItems, setFreeItems] = useState<FreeItem[]>([]);
  const [confirmed, setConfirmed] = useState(false);
  const [discountType, setDiscountType] = useState<DiscountType>('pct');
  const [discountValue, setDiscountValue] = useState('');
  const [showFree, setShowFree] = useState(false);
  const [freeName, setFreeName] = useState('');
  const [freePrice, setFreePrice] = useState('');
  const [email, setEmail] = useState('');
  const [sizeModalProduct, setSizeModalProduct] = useState<Product | null>(null);

  const [showPayment, setShowPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cash'>('card');
  const [cashGiven, setCashGiven] = useState('');

  const results = useMemo(() => {
    if (!query.trim()) return products;
    const q = query.toLowerCase();
    return products.filter((p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
  }, [products, query]);

  const handleProductClick = (p: Product) => {
    if (p.stock) {
      setSizeModalProduct(p);
    } else {
      addToPos(p, undefined);
    }
  };

  const addToPos = (product: Product, size?: Size) => {
    setPosCart((prev) => {
      const ex = prev.find((i) => i.product.id === product.id && i.size === size);
      if (ex) return prev.map((i) => i.product.id === product.id && i.size === size ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { product, quantity: 1, size }];
    });
    setSizeModalProduct(null);
  };

  const changeQty = (id: string, size: Size | undefined, delta: number) => {
    setPosCart((prev) => prev.map((i) => i.product.id === id && i.size === size ? { ...i, quantity: i.quantity + delta } : i).filter((i) => i.quantity > 0));
  };

  const addFreeItem = () => {
    if (!freeName || !freePrice) return;
    setFreeItems((prev) => [...prev, { id: `free-${Date.now()}`, name: freeName, price: parseFloat(freePrice) }]);
    setFreeName(''); setFreePrice(''); setShowFree(false);
  };

  const catalogTotal = posCart.reduce((s, i) => s + i.product.price * i.quantity, 0);
  const freeTotal = freeItems.reduce((s, i) => s + i.price, 0);
  const subtotal = catalogTotal + freeTotal;

  const discountAmt = useMemo(() => {
    const v = parseFloat(discountValue) || 0;
    if (discountType === 'pct') return Math.min(subtotal, subtotal * (v / 100));
    return Math.min(subtotal, v);
  }, [discountValue, discountType, subtotal]);

  const discounted = subtotal - discountAmt;
  const tva = discounted * TVA;
  const total = discounted + tva;
  const hasItems = posCart.length > 0 || freeItems.length > 0;

  const handleEncaisserClick = () => {
    if (!hasItems) return;
    setShowPayment(true);
  };

  const confirmPayment = async () => {
    const freeCartItems: CartItem[] = freeItems.map((fi) => ({
      product: { id: fi.id, name: fi.name, price: fi.price, description: '', image: '', category: 'Libre', featured: false, stockS: 0, stockM: 0, stockL: 0, stockXL: 0 }, quantity: 1
    }));

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [...posCart, ...freeCartItems],
          discountAmount: discountAmt,
          source: 'caisse',
        }),
      });
      if (!res.ok) throw new Error('Erreur API');
    } catch (e) {
      console.error(e);
      showToast('Erreur lors de la sauvegarde', 'error');
      return;
    }

    if (email) showToast(`Ticket envoyé à ${email}`, 'success');
    
    setShowPayment(false);
    setConfirmed(true);
    setTimeout(() => { 
      setPosCart([]); setFreeItems([]); setDiscountValue(''); setEmail(''); 
      setPaymentMethod('card'); setCashGiven(''); setConfirmed(false); 
    }, 4000);
  };

  if (confirmed) {
    return (
      <motion.div className="flex flex-col items-center justify-center h-[500px] bg-white rounded-sm border border-[var(--border-soft)] shadow-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
          <span className="text-3xl">✓</span>
        </div>
        <p className="font-cormorant text-4xl font-light mb-2">Vente Encaissée</p>
        <p className="text-xs font-medium tracking-widest uppercase text-[var(--text-muted)] mb-6">Total TTC : {total.toFixed(2)} €</p>
        {email && <p className="text-[10px] font-medium text-[var(--text-muted)]">Ticket expédié vers {email}</p>}
      </motion.div>
    );
  }

  return (
    <>
      <AnimatePresence>
        {sizeModalProduct && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="bg-white p-8 w-full max-w-sm rounded-sm shadow-xl" initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}>
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-cormorant text-2xl font-light">Choisir la taille</h3>
                <button onClick={() => setSizeModalProduct(null)} className="text-[var(--text-muted)] hover:text-black"><X size={20} /></button>
              </div>
              <p className="text-sm font-medium mb-6">{sizeModalProduct.name}</p>
              <div className="grid grid-cols-4 gap-3">
                {['S', 'M', 'L', 'XL'].map(sz => {
                  const qty = sizeModalProduct.stock ? sizeModalProduct.stock[sz as Size] : 0;
                  const isOos = qty === 0;
                  return (
                    <button
                      key={sz}
                      disabled={isOos}
                      onClick={() => addToPos(sizeModalProduct, sz as Size)}
                      className={`py-3 text-sm font-medium rounded-sm border ${isOos ? 'bg-[var(--bg-alt)] text-[var(--text-muted)] border-[var(--border-soft)] opacity-50 cursor-not-allowed' : 'bg-white border-[var(--border-soft)] hover:border-black text-black'}`}
                    >
                      {sz}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}

        {showFree && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="bg-white p-8 w-full max-w-sm rounded-sm shadow-xl" initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}>
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-cormorant text-2xl font-light">Article Libre</h3>
                <button onClick={() => setShowFree(false)} className="text-[var(--text-muted)] hover:text-black"><X size={20} /></button>
              </div>
              <div className="space-y-4">
                <input className="w-full px-4 py-3 bg-[var(--bg-alt)] border border-transparent focus:border-[var(--text-main)] rounded-sm outline-none text-sm" placeholder="Désignation" value={freeName} onChange={(e) => setFreeName(e.target.value)} />
                <input className="w-full px-4 py-3 bg-[var(--bg-alt)] border border-transparent focus:border-[var(--text-main)] rounded-sm outline-none text-sm" type="number" placeholder="Prix HT (€)" value={freePrice} onChange={(e) => setFreePrice(e.target.value)} />
              </div>
              <button onClick={addFreeItem} className="btn-primary w-full mt-6 py-4 rounded-sm">Ajouter</button>
            </motion.div>
          </motion.div>
        )}

        {showPayment && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="bg-white p-8 w-full max-w-sm rounded-sm shadow-xl" initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}>
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-cormorant text-2xl font-light">Encaissement</h3>
                <button onClick={() => setShowPayment(false)} className="text-[var(--text-muted)] hover:text-black"><X size={20} /></button>
              </div>
              
              <div className="flex gap-4 mb-6">
                <button onClick={() => setPaymentMethod('card')} className={`flex-1 py-3 text-sm font-medium rounded-sm border transition-colors ${paymentMethod === 'card' ? 'bg-black text-white border-black' : 'bg-white border-[var(--border-soft)] hover:border-black text-black'}`}>Carte (CB)</button>
                <button onClick={() => setPaymentMethod('cash')} className={`flex-1 py-3 text-sm font-medium rounded-sm border transition-colors ${paymentMethod === 'cash' ? 'bg-black text-white border-black' : 'bg-white border-[var(--border-soft)] hover:border-black text-black'}`}>Espèces</button>
              </div>

              {paymentMethod === 'cash' && (
                <div className="mb-6 space-y-4">
                  <div>
                    <label className="block text-[10px] tracking-widest uppercase font-medium text-[var(--text-muted)] mb-2">Montant remis (€)</label>
                    <input type="number" step="0.01" min="0" value={cashGiven} onChange={(e) => setCashGiven(e.target.value)} className="w-full px-4 py-3 bg-[var(--bg-alt)] border border-transparent focus:border-[var(--text-main)] rounded-sm outline-none text-sm" placeholder="ex: 50.00" />
                  </div>
                  {(parseFloat(cashGiven) || 0) >= total ? (
                    <div className="p-4 bg-green-50 text-green-700 rounded-sm border border-green-100">
                      <p className="text-[10px] uppercase tracking-widest font-medium mb-1 text-green-600">Monnaie à rendre</p>
                      <p className="text-2xl font-medium">{((parseFloat(cashGiven) || 0) - total).toFixed(2)} €</p>
                    </div>
                  ) : cashGiven ? (
                    <p className="text-sm text-red-500 font-medium px-2">Montant insuffisant</p>
                  ) : null}
                </div>
              )}

              <div className="flex justify-between items-center mb-6 py-4 border-t border-[var(--border-soft)]">
                <span className="text-sm font-medium">Total à régler</span>
                <span className="text-xl font-medium">{total.toFixed(2)} €</span>
              </div>

              <button 
                onClick={confirmPayment} 
                disabled={paymentMethod === 'cash' && (parseFloat(cashGiven) || 0) < total} 
                className="btn-primary w-full py-4 rounded-sm"
              >
                Valider
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col xl:flex-row bg-white border border-[var(--border-soft)] rounded-sm shadow-sm overflow-hidden min-h-[600px]">
        
        {/* LEFT CATALOG */}
        <div className="flex-1 flex flex-col xl:border-r border-b xl:border-b-0 border-[var(--border-soft)] h-[60vh] xl:h-auto">
          <div className="relative border-b border-[var(--border-soft)]">
            <Search size={16} className="absolute left-6 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input type="text" placeholder="Rechercher par nom ou catégorie..." value={query} onChange={(e) => setQuery(e.target.value)} className="w-full pl-14 pr-6 py-5 text-sm outline-none bg-transparent" />
          </div>
          
          <div className="flex items-center justify-between px-6 py-3 bg-[var(--bg-alt)] border-b border-[var(--border-soft)]">
            <p className="text-[10px] font-medium tracking-widest uppercase text-[var(--text-muted)]">{results.length} résultats</p>
            <button onClick={() => setShowFree(true)} className="flex items-center gap-2 text-[10px] font-medium tracking-widest uppercase text-black hover:text-[var(--text-muted)] transition-colors">
              <PenLine size={12} /> Article Libre
            </button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 overflow-y-auto p-4 gap-4 bg-[var(--bg-alt)]">
            {results.map((p) => (
              <button key={p.id} onClick={() => handleProductClick(p)} className={`text-left bg-white rounded-sm shadow-sm border border-transparent hover:border-[var(--border-soft)] transition-all overflow-hidden flex flex-col ${posCart.find(c => c.product.id === p.id) ? 'ring-2 ring-black' : ''}`}>
                <div className="relative h-32 w-full bg-[var(--bg-alt)] flex items-center justify-center">
                  {p.image ? (
                    <Image src={p.image} alt={p.name} fill className="object-cover" />
                  ) : (
                    <span className="text-[9px] text-[var(--text-muted)] uppercase tracking-widest px-2 text-center">Sans<br/>Image</span>
                  )}
                </div>
                <div className="p-3">
                  <p className="text-[10px] font-medium tracking-widest uppercase text-[var(--text-muted)] mb-1">{p.category}</p>
                  <p className="text-xs font-medium leading-snug line-clamp-1">{p.name}</p>
                  <p className="font-medium text-sm mt-2">{p.price.toFixed(2)} €</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* RIGHT CART */}
        <div className="w-full xl:w-[400px] flex flex-col flex-shrink-0 bg-white">
          <div className="flex justify-between items-center px-6 py-5 border-b border-[var(--border-soft)]">
            <span className="text-[11px] font-medium tracking-widest uppercase">Panier en cours</span>
            {hasItems && <button onClick={() => { setPosCart([]); setFreeItems([]); }} className="text-[10px] font-medium tracking-widest uppercase text-[var(--text-muted)] hover:text-red-500 transition-colors">Vider</button>}
          </div>

          <div className="flex-1 overflow-y-auto">
            {!hasItems ? (
              <div className="flex flex-col items-center justify-center h-full text-[var(--text-muted)] gap-4 p-8 text-center">
                <ShoppingCart size={32} strokeWidth={1} />
                <p className="text-[11px] tracking-widest font-medium uppercase">Panier Vide</p>
              </div>
            ) : (
              <ul className="divide-y divide-[var(--border-soft)]">
                {posCart.map(i => (
                  <li key={i.product.id} className="flex gap-4 p-5 hover:bg-[var(--bg-alt)] transition-colors">
                    <div className="w-12 h-16 relative flex-shrink-0 rounded-xs overflow-hidden bg-[var(--bg-alt)] flex items-center justify-center text-center">
                      {i.product.image ? (
                        <Image src={i.product.image} alt="" fill className="object-cover" />
                      ) : (
                        <span className="text-[7px] text-[var(--text-muted)] uppercase tracking-widest px-1">Sans Image</span>
                      )}
                    </div>
                    <div className="flex-1 flex flex-col justify-center">
                      <p className="text-xs font-medium">{i.product.name}</p>
                      {i.size && <p className="text-[10px] tracking-widest uppercase text-[var(--text-muted)] mt-1">Taille: {i.size}</p>}
                      <p className="text-sm font-medium mt-1">{i.product.price.toFixed(2)} €</p>
                    </div>
                    <div className="flex flex-col items-end justify-center gap-2">
                      <div className="flex items-center border border-[var(--border-soft)] rounded-sm bg-white overflow-hidden">
                        <button onClick={() => changeQty(i.product.id, i.size, -1)} className="p-1.5 hover:bg-[var(--bg-alt)] transition-colors"><Minus size={12} /></button>
                        <span className="text-xs font-medium w-6 text-center">{i.quantity}</span>
                        <button onClick={() => changeQty(i.product.id, i.size, 1)} className="p-1.5 hover:bg-[var(--bg-alt)] transition-colors"><Plus size={12} /></button>
                      </div>
                    </div>
                  </li>
                ))}
                {freeItems.map(fi => (
                  <li key={fi.id} className="flex gap-4 p-5 bg-[var(--bg-alt)]">
                    <div className="w-12 h-16 flex items-center justify-center border border-[var(--border-soft)] border-dashed rounded-xs bg-white text-[var(--text-muted)]"><Tag size={16} /></div>
                    <div className="flex-1 flex flex-col justify-center">
                      <p className="text-xs font-medium">{fi.name}</p>
                      <p className="text-sm font-medium mt-1">{fi.price.toFixed(2)} €</p>
                    </div>
                    <div className="flex flex-col justify-center">
                      <button onClick={() => setFreeItems(prev => prev.filter(x => x.id !== fi.id))} className="p-2 text-[var(--text-muted)] hover:text-red-500 bg-white border border-[var(--border-soft)] rounded-sm"><Trash2 size={14} /></button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="border-t border-[var(--border-soft)] bg-[var(--bg-alt)]">
            {hasItems && (
              <div className="flex border-b border-[var(--border-soft)]">
                <button onClick={() => setDiscountType('pct')} className={`px-5 py-3 text-[10px] font-medium uppercase border-r border-[var(--border-soft)] transition-colors ${discountType === 'pct' ? 'bg-black text-white' : 'hover:bg-gray-200'}`}>%</button>
                <button onClick={() => setDiscountType('fixed')} className={`px-5 py-3 text-[10px] font-medium uppercase border-r border-[var(--border-soft)] transition-colors ${discountType === 'fixed' ? 'bg-black text-white' : 'hover:bg-gray-200'}`}>€</button>
                <input type="number" min="0" value={discountValue} onChange={e => setDiscountValue(e.target.value)} placeholder="Remise" className="flex-1 px-4 text-sm bg-transparent outline-none" />
              </div>
            )}
            
            <div className="flex border-b border-[var(--border-soft)] bg-white">
              <div className="px-5 py-4 border-r border-[var(--border-soft)] flex items-center bg-[var(--bg-alt)]">
                <Send size={16} className="text-[var(--text-muted)]" />
              </div>
              <input type="email" placeholder="Email client (optionnel)" value={email} onChange={e => setEmail(e.target.value)} className="flex-1 px-4 py-3 text-sm bg-transparent outline-none" />
            </div>

            <div className="p-6 bg-white">
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-xs font-medium text-[var(--text-muted)]"><span>Sous-total HT</span><span>{subtotal.toFixed(2)} €</span></div>
                {discountAmt > 0 && <div className="flex justify-between text-xs font-medium text-red-500"><span>Remise</span><span>-{discountAmt.toFixed(2)} €</span></div>}
                <div className="flex justify-between text-xs font-medium text-[var(--text-muted)]"><span>TVA (20%)</span><span>{tva.toFixed(2)} €</span></div>
                <div className="flex justify-between pt-4 font-medium text-xl border-t border-[var(--border-soft)]">
                  <span>Total TTC</span><span>{total.toFixed(2)} €</span>
                </div>
              </div>
              <button onClick={handleEncaisserClick} disabled={!hasItems} className="btn-primary w-full rounded-sm py-4">
                Encaisser
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
