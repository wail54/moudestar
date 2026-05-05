'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { useToast } from '@/components/Toast';
import { createClient } from '@/lib/supabase/client';
import { Loader2, ArrowRight, ShieldCheck, Search } from 'lucide-react';

export default function CheckoutPage() {
  const router = useRouter();
  const cart = useStore((s) => s.cart);
  const { showToast } = useToast();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  const [addressQuery, setAddressQuery] = useState('');
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
  const [selectedAddress, setSelectedAddress] = useState('');

  const [storeCreditCode, setStoreCreditCode] = useState('');
  const [appliedCredit, setAppliedCredit] = useState<{ code: string, amount: number } | null>(null);
  
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (cart.length === 0) {
      router.push('/boutique');
      return;
    }

    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        showToast('Vous devez être connecté pour passer commande', 'error');
        router.push('/login?redirect=/checkout');
      } else {
        setUser(session.user);
        setLoading(false);
      }
    };
    checkAuth();
  }, [cart, router, supabase.auth, showToast]);

  const searchAddress = async (q: string) => {
    setAddressQuery(q);
    if (q.length < 3) {
      setAddressSuggestions([]);
      return;
    }
    try {
      const res = await fetch(`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(q)}&limit=5`);
      const data = await res.json();
      setAddressSuggestions(data.features || []);
    } catch (e) {
      console.error(e);
    }
  };

  const selectAddress = (feature: any) => {
    setSelectedAddress(feature.properties.label);
    setAddressQuery(feature.properties.label);
    setAddressSuggestions([]);
  };

  const validateCredit = async () => {
    if (!storeCreditCode) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/store-credits/validate', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {})
        },
        body: JSON.stringify({ code: storeCreditCode })
      });
      const data = await res.json();
      if (res.ok && data.valid) {
        setAppliedCredit({ code: data.code, amount: data.remaining });
        showToast('Code appliqué avec succès', 'success');
      } else {
        showToast(data.error || 'Code invalide', 'error');
        setAppliedCredit(null);
      }
    } catch (e) {
      showToast('Erreur lors de la validation', 'error');
    }
  };

  const handleCheckout = async () => {
    if (!selectedAddress && addressQuery.length > 5) {
      setSelectedAddress(addressQuery);
    }
    
    if (!selectedAddress && addressQuery.length < 5) {
      showToast('Veuillez renseigner une adresse de livraison valide', 'error');
      return;
    }

    setIsProcessing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {})
        },
        body: JSON.stringify({ 
          items: cart, 
          storeCreditCode: appliedCredit?.code,
          shippingAddress: selectedAddress || addressQuery
        }),
      });
      const data = await res.json();
      if (res.ok && data.url) {
        let redirectUrl = data.url;
        if (redirectUrl.includes('free=true')) {
          redirectUrl += `&sc=${encodeURIComponent(appliedCredit?.code || '')}&addr=${encodeURIComponent(selectedAddress || addressQuery)}`;
        }
        window.location.href = redirectUrl;
      } else {
        showToast(data.error || 'Erreur lors de l\'initialisation du paiement', 'error');
        setIsProcessing(false);
      }
    } catch (err) {
      showToast('Erreur réseau', 'error');
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-main)]">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const subtotal = cart.reduce((s, i) => s + i.product.price * i.quantity, 0);
  const tva = subtotal * 0.2;
  const grandTotal = subtotal + tva;
  const discountAmt = appliedCredit ? Math.min(grandTotal, appliedCredit.amount) : 0;
  const finalTotal = grandTotal - discountAmt;

  return (
    <div className="min-h-screen pt-32 pb-20 bg-[var(--bg-main)]">
      <div className="max-w-screen-lg mx-auto px-6">
        <h1 className="font-cormorant text-4xl md:text-5xl font-light mb-10">Finaliser la commande</h1>
        
        <div className="flex flex-col lg:flex-row gap-12">
          
          {/* LEFT: Informations */}
          <div className="flex-1 flex flex-col gap-8">
            
            <div className="bg-white p-6 md:p-8 rounded-sm shadow-sm border border-[var(--border-soft)]">
              <div className="flex items-center gap-3 mb-6">
                <ShieldCheck className="text-green-600" size={24} />
                <h2 className="font-cormorant text-2xl font-medium">Informations Compte</h2>
              </div>
              <p className="text-sm">Connecté en tant que : <span className="font-medium">{user?.email}</span></p>
            </div>

            <div className="bg-white p-6 md:p-8 rounded-sm shadow-sm border border-[var(--border-soft)]">
              <h2 className="font-cormorant text-2xl font-medium mb-6">Adresse de Livraison</h2>
              <div className="relative">
                <label className="block text-[10px] uppercase font-medium text-[var(--text-muted)] tracking-widest mb-2">Rechercher une adresse (France)</label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
                  <input 
                    type="text" 
                    value={addressQuery}
                    onChange={(e) => searchAddress(e.target.value)}
                    placeholder="Commencez à taper votre adresse..."
                    className="w-full pl-12 pr-4 py-3 bg-[var(--bg-alt)] border border-transparent focus:border-[var(--border-soft)] outline-none rounded-sm text-sm"
                  />
                </div>
                {addressSuggestions.length > 0 && (
                  <ul className="absolute z-10 left-0 right-0 mt-1 bg-white border border-[var(--border-soft)] shadow-lg rounded-sm overflow-hidden">
                    {addressSuggestions.map((feat, idx) => (
                      <li key={idx}>
                        <button onClick={() => selectAddress(feat)} className="w-full text-left px-4 py-3 text-sm hover:bg-[var(--bg-alt)] transition-colors border-b border-[var(--border-soft)] last:border-0">
                          {feat.properties.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="bg-white p-6 md:p-8 rounded-sm shadow-sm border border-[var(--border-soft)]">
              <h2 className="font-cormorant text-2xl font-medium mb-6">Avoir ou Bon d'achat</h2>
              <div className="flex gap-4">
                <input 
                  type="text" 
                  value={storeCreditCode}
                  onChange={(e) => setStoreCreditCode(e.target.value.toUpperCase())}
                  placeholder="Code AVOIR-XXXX"
                  className="flex-1 px-4 py-3 bg-[var(--bg-alt)] border border-transparent focus:border-[var(--border-soft)] outline-none rounded-sm text-sm uppercase"
                />
                <button onClick={validateCredit} disabled={!storeCreditCode || !!appliedCredit} className="px-6 py-3 bg-black text-white text-xs font-medium uppercase tracking-widest rounded-sm disabled:opacity-50">
                  Appliquer
                </button>
              </div>
              {appliedCredit && (
                <p className="mt-4 text-xs font-medium text-green-600">Code appliqué : -{discountAmt.toFixed(2)} €</p>
              )}
            </div>

          </div>

          {/* RIGHT: Récapitulatif */}
          <div className="w-full lg:w-[400px] flex-shrink-0">
            <div className="bg-white p-6 md:p-8 rounded-sm shadow-sm border border-[var(--border-soft)] sticky top-24">
              <h2 className="font-cormorant text-2xl font-medium mb-6">Récapitulatif</h2>
              
              <ul className="divide-y divide-[var(--border-soft)] mb-6 max-h-64 overflow-y-auto pr-2">
                {cart.map((item, idx) => (
                  <li key={idx} className="py-4 flex justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-sm font-medium leading-snug">{item.product.name}</p>
                      <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest mt-1">Qté: {item.quantity} {item.size && `• ${item.size}`}</p>
                    </div>
                    <span className="text-sm font-medium">{(item.product.price * item.quantity).toFixed(2)} €</span>
                  </li>
                ))}
              </ul>

              <div className="space-y-3 mb-8 pt-6 border-t border-[var(--border-soft)]">
                <div className="flex justify-between text-sm text-[var(--text-muted)]">
                  <span>Sous-total HT</span><span>{subtotal.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between text-sm text-[var(--text-muted)]">
                  <span>TVA (20%)</span><span>{tva.toFixed(2)} €</span>
                </div>
                {appliedCredit && (
                  <div className="flex justify-between text-sm font-medium text-red-500">
                    <span>Avoir appliqué</span><span>-{discountAmt.toFixed(2)} €</span>
                  </div>
                )}
                <div className="flex justify-between text-xl font-medium pt-4 border-t border-[var(--border-soft)] mt-4">
                  <span>Total TTC</span><span>{finalTotal.toFixed(2)} €</span>
                </div>
              </div>

              <button 
                onClick={handleCheckout}
                disabled={isProcessing}
                className="btn-primary w-full py-4 rounded-sm flex items-center justify-center gap-2"
              >
                {isProcessing ? 'Redirection...' : finalTotal === 0 ? 'Valider la commande' : 'Procéder au paiement'}
                {!isProcessing && <ArrowRight size={16} />}
              </button>
              <p className="text-[10px] text-center text-[var(--text-muted)] mt-4">
                Paiement sécurisé via Stripe
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
