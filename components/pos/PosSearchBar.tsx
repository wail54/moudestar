'use client';

import { useRef, useEffect } from 'react';
import { Search } from 'lucide-react';
import { Product } from '@/store/useStore';

interface Props {
  query: string;
  onChange: (q: string) => void;
  products: Product[];
  onExactMatch: (product: Product, variantId?: string, size?: string, color?: string) => void;
}

export function PosSearchBar({ query, onChange, products, onExactMatch }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Autofocus on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Auto-add on exact barcode / shortId match
  useEffect(() => {
    const q = query.trim();
    if (!q) return;
    const isExactBarcode = /^\d{10}$/.test(q);
    const isExactShortId = /^\d{4}$/.test(q);
    if (!isExactBarcode && !isExactShortId) return;

    // Search through products and variants
    for (const p of products) {
      // Check product-level codes → open modal (no variant forced)
      if ((isExactBarcode && p.barcode === q) || (isExactShortId && p.shortId === q)) {
        onExactMatch(p, undefined, undefined, undefined);
        onChange('');
        return;
      }
      // Check variant-level codes → add directly with that specific variant
      if (p.variants) {
        for (const v of p.variants) {
          if ((isExactBarcode && v.barcode === q) || (isExactShortId && v.shortId === q)) {
            onExactMatch(p, v.id, v.size || undefined, v.color || undefined);
            onChange('');
            return;
          }
        }
      }
    }
  }, [query, products, onExactMatch, onChange]);

  return (
    <div className="relative border-b border-[var(--border-soft)]">
      <Search size={16} className="absolute left-6 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
      <input
        ref={inputRef}
        type="text"
        placeholder="Recherche (Nom, Code-barres 10 chif., ID court 4 chif.)..."
        value={query}
        onChange={e => onChange(e.target.value)}
        className="w-full pl-14 pr-6 py-5 text-sm outline-none bg-transparent"
      />
    </div>
  );
}
