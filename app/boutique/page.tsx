'use client';

import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { ProductCard } from '@/components/ProductCard';

const CATEGORIES = ['Tous', 'Vêtements', 'Accessoires', 'Chaussures'];

export default function BoutiquePage() {
  const products = useStore((s) => s.products);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('Tous');

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchCat = category === 'Tous' || p.category === category;
      const matchQ = p.name.toLowerCase().includes(query.toLowerCase());
      return matchCat && matchQ;
    });
  }, [products, query, category]);

  return (
    <div className="min-h-screen pt-20">
      {/* Banner */}
      <div className="relative py-20 text-center overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--dark-2)] to-[var(--dark)]" />
        <div className="relative z-10">
          <p className="text-[var(--gold)] text-xs tracking-[0.5em] uppercase mb-3">Notre sélection</p>
          <h1 className="font-cormorant text-6xl md:text-7xl font-light text-white">La Boutique</h1>
          <div className="w-12 h-px bg-[var(--gold)] mx-auto mt-5" />
        </div>
      </div>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-10">
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-4 py-2 text-xs tracking-widest uppercase rounded transition-all duration-200 ${
                  category === cat
                    ? 'bg-[var(--gold)] text-[var(--dark)] font-semibold'
                    : 'border border-[var(--gray-1)] text-[var(--gray-3)] hover:border-[var(--gold)] hover:text-[var(--gold)]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--gray-2)]" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-[var(--dark-2)] border border-[var(--gray-1)] focus:border-[var(--gold)] text-[var(--light)] text-sm rounded outline-none transition-colors placeholder:text-[var(--gray-2)]"
            />
          </div>
        </div>

        <p className="text-xs text-[var(--gray-3)] tracking-widest uppercase mb-6">
          {filtered.length} produit{filtered.length !== 1 ? 's' : ''}
        </p>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-24 text-[var(--gray-3)]">
            <p className="font-cormorant text-3xl mb-2">Aucun résultat</p>
            <p className="text-sm">Essayez d&apos;autres mots-clés ou catégories.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
