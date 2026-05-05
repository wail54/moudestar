'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { CheckCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

function SuccessContent() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const searchParams = useSearchParams();
  const sessionId = searchParams?.get('session_id');
  const storeCreditCode = searchParams?.get('sc');
  const shippingAddress = searchParams?.get('addr');
  const clearCart = useStore((s) => s.clearCart);
  const cart = useStore((s) => s.cart);

  useEffect(() => {
    if (!sessionId) { setStatus('error'); return; }

    const run = async () => {
      // Get auth token to link order to user
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (cart.length > 0) {
        try {
          const res = await fetch('/api/orders', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({
              items: cart,
              source: 'en_ligne',
              sessionId,
              storeCreditCode: storeCreditCode || undefined,
              shippingAddress: shippingAddress ? decodeURIComponent(shippingAddress) : undefined,
            }),
          });
          if (res.ok) {
            clearCart();
            setStatus('success');
          } else {
            setStatus('error');
          }
        } catch {
          setStatus('error');
        }
      } else {
        // Cart already cleared (page reload after success)
        setStatus('success');
      }
    };

    run();
  }, [sessionId]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen pt-32 pb-20 px-6 flex flex-col items-center justify-center bg-[var(--bg-main)]">
      <div className="max-w-md w-full bg-white p-10 rounded-sm shadow-xl text-center">
        {status === 'loading' && (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-[var(--text-muted)]" />
            <p className="text-sm text-[var(--text-muted)]">Validation de votre commande...</p>
          </div>
        )}
        {status === 'success' && (
          <>
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
            <h1 className="text-2xl font-cormorant font-bold uppercase tracking-widest mb-4">Paiement Réussi</h1>
            <p className="text-[var(--text-muted)] mb-4">
              Merci pour votre commande ! Nous la préparons avec soin.
            </p>
            <p className="text-xs text-[var(--text-muted)] mb-8">
              Suivez l&apos;état de votre commande dans votre espace client.
            </p>
            <div className="flex flex-col gap-3">
              <Link href="/account" className="btn-primary w-full py-3 block text-sm">
                Voir mes commandes
              </Link>
              <Link href="/boutique" className="w-full py-3 block text-sm border border-[var(--border-soft)] rounded-sm hover:bg-[var(--bg-alt)] transition-colors">
                Continuer mes achats
              </Link>
            </div>
          </>
        )}
        {status === 'error' && (
          <>
            <h1 className="text-2xl font-cormorant font-bold uppercase tracking-widest mb-4 text-red-500">Erreur</h1>
            <p className="text-[var(--text-muted)] mb-8">
              Nous n&apos;avons pas pu valider votre paiement. Contactez le support si le problème persiste.
            </p>
            <Link href="/" className="btn-primary w-full py-3 block text-sm">
              Retour à l&apos;accueil
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen pt-32 pb-20 px-6 flex flex-col items-center justify-center bg-[var(--bg-main)]">
        <div className="max-w-md w-full bg-white p-10 rounded-sm shadow-xl text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-[var(--text-muted)]" />
        </div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
