'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, Minus, Trash2, ShoppingCart, X, Tag, PenLine, Send } from 'lucide-react';
import { CartItem, Product, ProductVariant } from '@/store/useStore';
import { useToast } from '@/components/Toast';
import { PosPaymentModal, PaymentMeta } from '@/components/pos/PosPaymentModal';
import { PosSearchBar } from '@/components/pos/PosSearchBar';

type DiscountType = 'pct' | 'fixed';
interface FreeItem { id: string; name: string; price: number; }
// Remise par ligne : key = `${productId}-${variantId??''}`
type ItemDiscount = { value: string; type: DiscountType };

export function CaisseSystem() {
  const [products, setProducts] = useState<Product[]>([]);
  const { showToast } = useToast();

  useEffect(() => {
    fetch('/api/products')
      .then((r) => r.json())
      .then((data: Product[]) => setProducts(data))
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
  const [variantModalProduct, setVariantModalProduct] = useState<Product | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [lastTotal, setLastTotal] = useState(0);
  // Remises par ligne : key = `${productId}-${variantId??''}`
  const [itemDiscounts, setItemDiscounts] = useState<Record<string, ItemDiscount>>({});
  const [editingDiscountKey, setEditingDiscountKey] = useState<string | null>(null);

  const results = useMemo(() => {
    if (!query.trim()) return products;
    const q = query.toLowerCase();
    // Search also by barcode and shortId
    return products.filter((p) => {
      if (p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)) return true;
      if (p.barcode && p.barcode.includes(q)) return true;
      if (p.shortId && p.shortId.includes(q)) return true;
      if (p.variants?.some(v => (v.barcode && v.barcode.includes(q)) || (v.shortId && v.shortId.includes(q)))) return true;
      return false;
    });
  }, [products, query]);

  const handleProductClick = (p: Product) => {
    if (p.sizeType !== 'NONE' || (p.variants && p.variants.length > 1)) {
      setVariantModalProduct(p);
      setSelectedColor(null);
    } else {
      const variant = p.variants?.[0];
      addToPos(p, variant?.id, variant?.size || undefined, variant?.color || undefined);
    }
  };


  const changeQty = (id: string, variantId: string | undefined, delta: number) => {
    setPosCart((prev) => prev.map((i) => i.product.id === id && i.variantId === variantId ? { ...i, quantity: i.quantity + delta } : i).filter((i) => i.quantity > 0));
  };

  const addFreeItem = () => {
    if (!freeName || !freePrice) return;
    setFreeItems((prev) => [...prev, { id: `free-${Date.now()}`, name: freeName, price: parseFloat(freePrice) }]);
    setFreeName(''); setFreePrice(''); setShowFree(false);
  };

  // Helper : prix effectif = promoPrice si défini, sinon price normal
  const getEffectivePrice = (product: CartItem['product']): number =>
    (product.promoPrice != null && product.promoPrice < product.price) ? product.promoPrice : product.price;

  // Helper : calcule le prix après remise caisse pour une ligne (s'applique sur le prix effectif)
  const getItemLineKey = (i: CartItem) => `${i.product.id}-${i.variantId ?? ''}`;
  const getItemDiscountedPrice = (i: CartItem): number => {
    const base = getEffectivePrice(i.product);
    const key = getItemLineKey(i);
    const d = itemDiscounts[key];
    if (!d || !d.value) return base;
    const v = parseFloat(d.value) || 0;
    if (d.type === 'pct') return Math.max(0, base * (1 - v / 100));
    return Math.max(0, base - v);
  };

  const catalogTotal = posCart.reduce((s, i) => s + getItemDiscountedPrice(i) * i.quantity, 0);
  const freeTotal = freeItems.reduce((s, i) => s + i.price, 0);
  const subtotal = catalogTotal + freeTotal;
  // Remise totale par article sur le prix de base original (promo + remise caisse)
  const itemDiscountTotal = posCart.reduce((s, i) => {
    return s + (i.product.price - getItemDiscountedPrice(i)) * i.quantity;
  }, 0);

  const discountAmt = useMemo(() => {
    const v = parseFloat(discountValue) || 0;
    if (discountType === 'pct') return Math.min(subtotal, subtotal * (v / 100));
    return Math.min(subtotal, v);
  }, [discountValue, discountType, subtotal]);

  const discounted = subtotal - discountAmt;
  const total = discounted; // Prix TTC — pas de TVA ajoutée
  const hasItems = posCart.length > 0 || freeItems.length > 0;

  const handleEncaisserClick = () => {
    if (!hasItems) return;
    setLastTotal(total);
    setShowPayment(true);
  };

  const addToPos = useCallback((product: Product, variantId?: string, size?: string, color?: string) => {
    setPosCart((prev) => {
      const ex = prev.find((i) => i.product.id === product.id && i.variantId === variantId && i.size === size && i.color === color);
      if (ex) return prev.map((i) => i.product.id === product.id && i.variantId === variantId && i.size === size && i.color === color ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { product, quantity: 1, variantId, size, color }];
    });
    setVariantModalProduct(null);
  }, []);

  const confirmPayment = async (_method: any, meta: PaymentMeta) => {
    const freeCartItems: CartItem[] = freeItems.map((fi) => ({
      product: { id: fi.id, name: fi.name, price: fi.price, description: '', images: [], category: 'Libre', featured: false, sizeType: 'NONE', barcode: null, shortId: null, variants: [] },
      quantity: 1,
    }));

    // Construire un paymentMethod descriptif pour traçabilité
    const voucher = meta.voucherAmount || 0;
    const cashPart = meta.finalMethod === 'cash' ? 'Espèces' : 'Carte';
    let payMethod: string;
    if (voucher > 0 && (meta.remainingAfterCredits ?? 0) > 0) {
      // Paiement hybride : bon + cash/carte
      payMethod = `Client en compte (${voucher.toFixed(2)}€) + ${cashPart}`;
    } else if (voucher > 0) {
      // Entièrement payé par bon
      payMethod = `Client en compte (${voucher.toFixed(2)}€)`;
    } else {
      payMethod = meta.finalMethod === 'cash' ? 'CASH' : 'CARD';
    }

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [...posCart, ...freeCartItems],
          discountAmount: discountAmt,
          source: 'caisse',
          paymentMethod: payMethod,
          storeCreditCode: meta.creditCode,
          creditCode: meta.creditCode,
          // Traçabilité bon client en compte
          voucherAmount: voucher > 0 ? voucher : undefined,
          voucherCode: voucher > 0 ? 'BON-MAIRIE' : undefined, // Peut être saisi manuellement dans le futur
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Erreur API');
      }
    } catch (e: any) {
      showToast(e.message || 'Erreur lors de la sauvegarde', 'error');
      return;
    }
    if (email) showToast(`Ticket envoyé à ${email}`, 'success');
    if (meta.changeCredit) showToast(`Avoir généré : ${meta.changeCredit.code} (${meta.changeCredit.amount.toFixed(2)} €)`, 'success');
    setShowPayment(false);
    setConfirmed(true);
    setTimeout(() => {
      setPosCart([]); setFreeItems([]); setDiscountValue(''); setEmail('');
      setItemDiscounts({}); setEditingDiscountKey(null);
      setShowPayment(false); setConfirmed(false);
    }, 4000);
  };

  if (confirmed) {
    return (
      <motion.div className="flex flex-col items-center justify-center h-[500px] bg-white rounded-sm border border-[var(--border-soft)] shadow-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
          <span className="text-3xl">✓</span>
        </div>
        <p className="font-cormorant text-4xl font-light mb-2">Vente Encaissée</p>
        <p className="text-xs font-medium tracking-widest uppercase text-[var(--text-muted)] mb-6">Total : {total.toFixed(2)} €</p>
        {email && <p className="text-[10px] font-medium text-[var(--text-muted)]">Ticket expédié vers {email}</p>}
      </motion.div>
    );
  }

  return (
    <>
      <AnimatePresence>
        {variantModalProduct && (() => {
          const variants = variantModalProduct.variants || [];
          // Collect unique non-null colors that have stock
          const hasColors = variants.some(v => v.color);
          const availableColors = hasColors
            ? [...new Set(variants.filter(v => v.color).map(v => v.color as string))]
            : [];
          // Variants filtered by selected color (Step B)
          const filteredVariants = selectedColor
            ? variants.filter(v => v.color === selectedColor)
            : variants;

          return (
            <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <motion.div className="bg-white p-6 md:p-8 w-full max-w-lg rounded-sm shadow-xl max-h-[90vh] overflow-y-auto" initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}>
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="font-cormorant text-2xl font-light">
                      {hasColors && !selectedColor ? 'Choisir la couleur' : 'Choisir la taille'}
                    </h3>
                    {selectedColor && (
                      <p className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] mt-1">
                        Couleur sélectionnée&nbsp;: <span className="text-black font-semibold">{selectedColor}</span>
                      </p>
                    )}
                  </div>
                  <button onClick={() => { setVariantModalProduct(null); setSelectedColor(null); }} className="text-[var(--text-muted)] hover:text-black"><X size={20} /></button>
                </div>
                <p className="text-sm font-medium mb-6">{variantModalProduct.name}</p>

                {variants.length > 0 ? (
                  hasColors && !selectedColor ? (
                    /* ── STEP A : Colour picker ── */
                    <div className="flex flex-wrap gap-3">
                      {availableColors.map((color) => {
                        const inStock = variants.filter(v => v.color === color).some(v => v.stock > 0);
                        return (
                          <button
                            key={color}
                            disabled={!inStock}
                            onClick={() => setSelectedColor(color)}
                            className={`px-5 py-3 text-sm font-medium rounded-sm border transition-colors ${
                              !inStock
                                ? 'bg-[var(--bg-alt)] text-[var(--text-muted)] border-[var(--border-soft)] opacity-40 cursor-not-allowed'
                                : 'bg-white border-[var(--border-soft)] hover:border-black hover:bg-black hover:text-white text-black'
                            }`}
                          >
                            {color}
                            {!inStock && <span className="ml-2 text-[9px] uppercase tracking-widest opacity-60">Épuisé</span>}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    /* ── STEP B : Size picker (or flat list if no colors) ── */
                    <div className="flex flex-col gap-2">
                      {selectedColor && (
                        <button
                          onClick={() => setSelectedColor(null)}
                          className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-medium text-[var(--text-muted)] hover:text-black mb-2 transition-colors"
                        >
                          ← Changer de couleur
                        </button>
                      )}
                      {filteredVariants.map((v, i) => {
                        const isOos = v.stock === 0;
                        return (
                          <button
                            key={i}
                            disabled={isOos}
                            onClick={() => { addToPos(variantModalProduct, v.id, v.size || undefined, v.color || undefined); setSelectedColor(null); }}
                            className={`flex justify-between items-center py-3 px-4 text-sm font-medium rounded-sm border transition-colors ${isOos ? 'bg-[var(--bg-alt)] text-[var(--text-muted)] border-[var(--border-soft)] opacity-50 cursor-not-allowed' : 'bg-white border-[var(--border-soft)] hover:border-black text-black'}`}
                          >
                            <div className="flex gap-4">
                              {v.size && <span>Taille&nbsp;: {v.size}</span>}
                              {!v.size && !v.color && <span>Base</span>}
                            </div>
                            <div className="text-xs text-[var(--text-muted)] flex items-center gap-4">
                              <span>Stock&nbsp;: {v.stock}</span>
                              {(v.barcode || v.shortId) && (
                                <span className="bg-[var(--bg-alt)] px-2 py-1 rounded-sm border border-[var(--border-soft)]">
                                  {v.shortId || v.barcode}
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )
                ) : (
                  <p className="text-sm text-red-500">Aucune variante disponible pour ce produit.</p>
                )}
              </motion.div>
            </motion.div>
          );
        })()}

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
          <PosPaymentModal
            total={lastTotal || total}
            onClose={() => setShowPayment(false)}
            onConfirm={confirmPayment}
          />
        )}
      </AnimatePresence>

      <div className="flex flex-col xl:flex-row bg-white border border-[var(--border-soft)] rounded-sm shadow-sm overflow-hidden min-h-[600px]">
        
        {/* LEFT CATALOG */}
        <div className="flex-1 flex flex-col xl:border-r border-b xl:border-b-0 border-[var(--border-soft)] h-[60vh] xl:h-auto">
          <PosSearchBar
            query={query}
            onChange={setQuery}
            products={products}
            onExactMatch={(p, variantId, size, color) => {
              // Si pas de variantId fourni (match au niveau produit) OU s'il y a des variantes → modal obligatoire
              if (!variantId || (p.variants && p.variants.length > 1)) {
                setVariantModalProduct(p);
                setSelectedColor(null);
              } else {
                addToPos(p, variantId, size, color);
              }
            }}
          />
          
          <div className="flex items-center justify-between px-6 py-3 bg-[var(--bg-alt)] border-b border-[var(--border-soft)]">
            <p className="text-[10px] font-medium tracking-widest uppercase text-[var(--text-muted)]">{results.length} résultats</p>
            <button onClick={() => setShowFree(true)} className="flex items-center gap-2 text-[10px] font-medium tracking-widest uppercase text-black hover:text-[var(--text-muted)] transition-colors">
              <PenLine size={12} /> Article Libre
            </button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 overflow-y-auto p-4 gap-4 bg-[var(--bg-alt)]">
            {results.map((p) => {
              const imageUrl = p.images?.[0] || p.image;
              const totalStock = p.variants?.reduce((acc, v) => acc + v.stock, 0) ?? 0;
              return (
              <button key={p.id} onClick={() => handleProductClick(p)} className={`text-left bg-white rounded-sm shadow-sm border border-transparent hover:border-[var(--border-soft)] transition-all overflow-hidden flex flex-col ${posCart.find(c => c.product.id === p.id) ? 'ring-2 ring-black' : ''}`}>
                <div className="relative h-32 w-full bg-[var(--bg-alt)] flex items-center justify-center">
                  {imageUrl ? (
                    <Image src={imageUrl} alt={p.name} fill className="object-cover" />
                  ) : (
                    <span className="text-[9px] text-[var(--text-muted)] uppercase tracking-widest px-2 text-center">Sans<br/>Image</span>
                  )}
                  {totalStock === 0 && p.sizeType !== 'NONE' && (
                    <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
                      <span className="bg-white px-2 py-1 text-[8px] tracking-widest uppercase font-medium rounded-xs shadow-sm">Épuisé</span>
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <p className="text-[10px] font-medium tracking-widest uppercase text-[var(--text-muted)] mb-1">{p.category}</p>
                  <p className="text-xs font-medium leading-snug line-clamp-1">{p.name}</p>
                  <div className="flex items-center justify-between mt-2">
                    <p className="font-medium text-sm">{p.price.toFixed(2)} €</p>
                    {p.shortId && <p className="text-[9px] bg-[var(--bg-alt)] border border-[var(--border-soft)] px-1.5 py-0.5 rounded-sm">{p.shortId}</p>}
                  </div>
                </div>
              </button>
            )})}
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
                {posCart.map((i, idx) => {
                  const imageUrl = i.product.images?.[0] || i.product.image;
                  const lineKey = getItemLineKey(i);
                  const discountedPrice = getItemDiscountedPrice(i);
                  const hasItemDiscount = discountedPrice < i.product.price;
                  const isEditingDiscount = editingDiscountKey === lineKey;
                  const d = itemDiscounts[lineKey];
                  return (
                  <li key={`${i.product.id}-${i.variantId || idx}`} className="flex flex-col border-b border-[var(--border-soft)] hover:bg-[var(--bg-alt)] transition-colors">
                    <div className="flex gap-4 p-5">
                      <div className="w-12 h-16 relative flex-shrink-0 rounded-xs overflow-hidden bg-[var(--bg-alt)] flex items-center justify-center text-center">
                        {imageUrl ? (
                          <Image src={imageUrl} alt="" fill className="object-cover" />
                        ) : (
                          <span className="text-[7px] text-[var(--text-muted)] uppercase tracking-widest px-1">Sans Image</span>
                        )}
                      </div>
                      <div className="flex-1 flex flex-col justify-center">
                        <p className="text-xs font-medium">{i.product.name}</p>
                        {(i.size || i.color) && (
                          <p className="text-[9px] tracking-widest uppercase text-[var(--text-muted)] mt-1">
                            {i.color && <span>Couleur: {i.color} </span>}
                            {i.size && <span>{i.color ? '• ' : ''}Taille: {i.size}</span>}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          {hasItemDiscount && (
                            <span className="text-[10px] line-through text-[var(--text-muted)]">{i.product.price.toFixed(2)} €</span>
                          )}
                          <p className={`text-sm font-medium ${hasItemDiscount ? 'text-red-600' : ''}`}>
                            {discountedPrice.toFixed(2)} €
                          </p>
                          {hasItemDiscount && (
                            <span className="text-[9px] bg-red-50 text-red-600 border border-red-200 px-1.5 py-0.5 rounded-sm font-medium">
                              -{((1 - discountedPrice / i.product.price) * 100).toFixed(0)}%
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end justify-between gap-2">
                        <div className="flex items-center border border-[var(--border-soft)] rounded-sm bg-white overflow-hidden">
                          <button onClick={() => changeQty(i.product.id, i.variantId, -1)} className="p-1.5 hover:bg-[var(--bg-alt)] transition-colors"><Minus size={12} /></button>
                          <span className="text-xs font-medium w-6 text-center">{i.quantity}</span>
                          <button onClick={() => changeQty(i.product.id, i.variantId, 1)} className="p-1.5 hover:bg-[var(--bg-alt)] transition-colors"><Plus size={12} /></button>
                        </div>
                        <button
                          onClick={() => setEditingDiscountKey(isEditingDiscount ? null : lineKey)}
                          className={`flex items-center gap-1 text-[9px] font-medium uppercase tracking-widest px-2 py-1 rounded-sm border transition-colors ${hasItemDiscount ? 'bg-red-50 text-red-600 border-red-200' : 'border-[var(--border-soft)] text-[var(--text-muted)] hover:border-black hover:text-black'}`}
                        >
                          <Tag size={10} /> Remise
                        </button>
                      </div>
                    </div>
                    {isEditingDiscount && (
                      <div className="flex items-center gap-2 px-5 pb-4">
                        <button
                          onClick={() => setItemDiscounts(prev => ({ ...prev, [lineKey]: { ...prev[lineKey] ?? { value: '', type: 'pct' }, type: 'pct' } }))}
                          className={`px-3 py-1.5 text-[10px] font-medium uppercase rounded-sm border transition-colors ${(d?.type ?? 'pct') === 'pct' ? 'bg-black text-white border-black' : 'border-[var(--border-soft)] hover:bg-gray-100'}`}
                        >%</button>
                        <button
                          onClick={() => setItemDiscounts(prev => ({ ...prev, [lineKey]: { ...prev[lineKey] ?? { value: '', type: 'fixed' }, type: 'fixed' } }))}
                          className={`px-3 py-1.5 text-[10px] font-medium uppercase rounded-sm border transition-colors ${d?.type === 'fixed' ? 'bg-black text-white border-black' : 'border-[var(--border-soft)] hover:bg-gray-100'}`}
                        >€</button>
                        <input
                          type="number"
                          min="0"
                          placeholder={(d?.type ?? 'pct') === 'pct' ? 'Ex: 10' : 'Ex: 5'}
                          value={d?.value ?? ''}
                          onChange={e => setItemDiscounts(prev => ({ ...prev, [lineKey]: { value: e.target.value, type: d?.type ?? 'pct' } }))}
                          className="flex-1 px-3 py-1.5 text-sm border border-[var(--border-soft)] rounded-sm outline-none focus:border-black bg-white"
                          autoFocus
                        />
                        {hasItemDiscount && (
                          <button
                            onClick={() => { const n = {...itemDiscounts}; delete n[lineKey]; setItemDiscounts(n); }}
                            className="text-[10px] text-red-500 hover:underline whitespace-nowrap"
                          >Retirer</button>
                        )}
                      </div>
                    )}
                  </li>
                  );
                })}
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
                <div className="flex justify-between text-xs font-medium text-[var(--text-muted)]"><span>Sous-total</span><span>{subtotal.toFixed(2)} €</span></div>
                {itemDiscountTotal > 0 && <div className="flex justify-between text-xs font-medium text-orange-600"><span>Remises articles</span><span>-{itemDiscountTotal.toFixed(2)} €</span></div>}
                {discountAmt > 0 && <div className="flex justify-between text-xs font-medium text-red-500"><span>Remise globale</span><span>-{discountAmt.toFixed(2)} €</span></div>}
                <div className="flex justify-between pt-4 font-medium text-xl border-t border-[var(--border-soft)]">
                  <span>Total</span><span>{total.toFixed(2)} €</span>
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
