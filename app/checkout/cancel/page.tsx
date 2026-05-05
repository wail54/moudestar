'use client';

import Link from 'next/link';
import { XCircle } from 'lucide-react';

export default function CancelPage() {
  return (
    <div className="min-h-screen pt-32 pb-20 px-6 flex flex-col items-center justify-center bg-[var(--bg-main)]">
      <div className="max-w-md w-full bg-white p-10 rounded-sm shadow-xl text-center">
        <XCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
        <h1 className="text-2xl font-cormorant font-bold uppercase tracking-widest mb-4">Paiement Annulé</h1>
        <p className="text-[var(--text-muted)] mb-8">
          Votre paiement a été annulé ou a échoué. Aucun montant n'a été débité.
        </p>
        <Link href="/boutique" className="btn-primary w-full py-3 block text-sm">
          Retourner au panier
        </Link>
      </div>
    </div>
  );
}
