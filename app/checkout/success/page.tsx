'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { CheckCircle } from 'lucide-react';
import Link from 'next/link';

function SuccessContent() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const searchParams = useSearchParams();
  const sessionId = searchParams?.get('session_id');
  const clearCart = useStore((s) => s.clearCart);
  const cart = useStore((s) => s.cart);

  useEffect(() => {
    if (sessionId) {
      // In a real app, you would verify the session_id on the server, create the order in DB, etc.
      // For this MVP, we will just call our existing order creation endpoint using the current cart in state
      // This assumes the user comes back to this device/browser.
      if (cart.length > 0) {
        fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: cart, discountAmount: 0, source: 'en_ligne' }),
        })
          .then((res) => {
            if (res.ok) {
              clearCart();
              setStatus('success');
            } else {
              setStatus('error');
            }
          })
          .catch(() => setStatus('error'));
      } else {
        // If cart is already empty (page reload), just show success
        setStatus('success');
      }
    } else {
      setStatus('error');
    }
  }, [sessionId, cart, clearCart]);

  return (
    <div className="min-h-screen pt-32 pb-20 px-6 flex flex-col items-center justify-center bg-[var(--bg-main)]">
      <div className="max-w-md w-full bg-white p-10 rounded-sm shadow-xl text-center">
        {status === 'loading' && <p>Validation de votre commande...</p>}
        {status === 'success' && (
          <>
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
            <h1 className="text-2xl font-cormorant font-bold uppercase tracking-widest mb-4">Paiement Réussi</h1>
            <p className="text-[var(--text-muted)] mb-8">
              Merci pour votre commande ! Nous la préparons avec soin.
            </p>
            <Link href="/" className="btn-primary w-full py-3 block text-sm">
              Retour à la boutique
            </Link>
          </>
        )}
        {status === 'error' && (
          <>
            <h1 className="text-2xl font-cormorant font-bold uppercase tracking-widest mb-4 text-red-500">Erreur</h1>
            <p className="text-[var(--text-muted)] mb-8">
              Nous n'avons pas pu valider votre paiement. Veuillez contacter le support.
            </p>
            <Link href="/" className="btn-primary w-full py-3 block text-sm">
              Retour à l'accueil
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen pt-32 pb-20 px-6 flex flex-col items-center justify-center bg-[var(--bg-main)]"><div className="max-w-md w-full bg-white p-10 rounded-sm shadow-xl text-center"><p>Chargement...</p></div></div>}>
      <SuccessContent />
    </Suspense>
  );
}
