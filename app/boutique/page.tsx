'use client';

import { useState, useMemo, useEffect } from 'react';
import { Search } from 'lucide-react';
import { motion, Variants } from 'framer-motion';
import { Product, toFrontendProduct } from '@/store/useStore';
import { ProductCard } from '@/components/ProductCard';

const CATS = ['Tous', 'Vêtements', 'Accessoires', 'Chaussures'];

const fadeUp: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

export default function BoutiquePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState('Tous');

  useEffect(() => {
    fetch('/api/products')
      .then((r) => r.json())
      .then((data: Product[]) => {
        setProducts(data.map(toFrontendProduct));
        setLoading(false);
      })
      .catch((e) => {
        console.error(e);
        setLoading(false);
      });
  }, []);

  const filtered = useMemo(() => products.filter((p) => {
    const mc = cat === 'Tous' || p.category === cat;
    const mq = p.name.toLowerCase().includes(query.toLowerCase());
    return mc && mq;
  }), [products, query, cat]);

  return (
    <div className="min-h-screen pt-24 pb-32">
      <div className="max-w-screen-xl mx-auto px-6 md:px-10">
        
        {/* Header */}
        <div className="py-12 border-b border-[var(--border-soft)] mb-8 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div>
            <span className="mask-wrap block mb-4">
              <motion.h1 
                initial={{ y: '100%' }} animate={{ y: 0 }} transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="font-cormorant text-5xl md:text-7xl font-light tracking-tight"
              >
                La Boutique
              </motion.h1>
            </span>
            <p className="text-sm text-[var(--text-muted)]">Découvrez notre collection complète de pièces d&apos;exception.</p>
          </div>
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-[var(--text-muted)]">
            <span>{filtered.length} article{filtered.length > 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-12">
          <div className="flex flex-wrap items-center gap-2">
            {CATS.map((c) => (
              <button key={c} onClick={() => setCat(c)} className={`px-5 py-2.5 text-[10px] tracking-widest uppercase font-medium rounded-sm transition-all ${
                cat === c ? 'bg-[var(--text-main)] text-white' : 'bg-[var(--bg-alt)] text-[var(--text-muted)] hover:bg-[var(--border-soft)] hover:text-black'
              }`}>
                {c}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-64">
            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input type="text" placeholder="Rechercher..." value={query} onChange={(e) => setQuery(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-[var(--bg-alt)] text-sm outline-none rounded-sm focus:ring-1 focus:ring-black" />
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-16">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] bg-[var(--bg-alt)] rounded-sm animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-32 text-center bg-[var(--bg-alt)] rounded-sm">
            <p className="font-cormorant text-3xl mb-2">Aucun article trouvé</p>
            <p className="text-sm text-[var(--text-muted)]">Essayez d&apos;autres critères de recherche.</p>
          </div>
        ) : (
          <motion.div
            initial="initial" animate="animate"
            variants={{ animate: { transition: { staggerChildren: 0.08 } } }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-16"
          >
            {filtered.map((p) => (
              <motion.div key={p.id} variants={fadeUp}>
                <ProductCard product={p} />
              </motion.div>
            ))}
          </motion.div>
        )}

      </div>
    </div>
  );
}
