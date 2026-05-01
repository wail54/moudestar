'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { ProductCard } from '@/components/ProductCard';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-50px' },
  transition: { duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] as const },
});

export default function HomePage() {
  const products = useStore((s) => s.products);
  const featured = products.filter((p) => p.featured).slice(0, 4);

  return (
    <div className="min-h-screen">
      {/* ── HERO ── */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden bg-black">
        <Image src="https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1920&q=85&auto=format&fit=crop"
          alt="Hero" fill priority className="object-cover opacity-60" sizes="100vw" />
        
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40" />

        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto flex flex-col items-center">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2, duration: 1 }}>
            <p className="text-[10px] tracking-[0.4em] uppercase text-white/80 mb-8">Nouvelle Collection</p>
          </motion.div>
          
          <span className="mask-wrap block mb-12">
            <motion.h1 
              initial={{ y: '100%' }} animate={{ y: 0 }} transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className="font-cormorant text-6xl md:text-[120px] font-light leading-none text-white tracking-tight"
            >
              L&apos;Élégance Purifiée
            </motion.h1>
          </span>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.8 }}>
            <Link href="/boutique" className="inline-flex items-center justify-center px-10 py-5 bg-white text-black font-medium tracking-[0.2em] uppercase text-xs hover:bg-[var(--bg-alt)] transition-colors duration-300 rounded-sm">
              Découvrir la collection
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── FEATURED ── */}
      <section className="max-w-screen-xl mx-auto px-6 md:px-10 py-32">
        <div className="flex flex-col md:flex-row items-end justify-between mb-16 gap-6">
          <motion.div {...fadeUp()}>
            <h2 className="font-cormorant text-4xl md:text-5xl font-light">Pièces Phares</h2>
            <p className="text-sm text-[var(--text-muted)] mt-4 max-w-md">
              Notre sélection de pièces intemporelles, conçues avec une attention particulière aux détails et aux matières.
            </p>
          </motion.div>
          <motion.div {...fadeUp(0.1)} className="hidden md:block">
            <Link href="/boutique" className="btn-outline">Voir tout</Link>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-16">
          {featured.map((p, i) => (
            <motion.div key={p.id} {...fadeUp(i * 0.1)}>
              <ProductCard product={p} />
            </motion.div>
          ))}
        </div>

        <div className="mt-12 text-center md:hidden">
          <Link href="/boutique" className="btn-outline w-full">Voir toute la collection</Link>
        </div>
      </section>

      {/* ── VALUES ── */}
      <section className="bg-[var(--bg-alt)] py-32">
        <div className="max-w-screen-xl mx-auto px-6 md:px-10 grid grid-cols-1 md:grid-cols-3 gap-16">
          {[
            { title: 'Savoir-Faire', desc: 'Des matières nobles sélectionnées pour leur durabilité.' },
            { title: 'Intemporalité', desc: 'Un design minimaliste pensé pour traverser les saisons.' },
            { title: 'Excellence', desc: 'Une qualité de service sur-mesure pour chaque client.' },
          ].map((v, i) => (
            <motion.div key={v.title} {...fadeUp(i * 0.1)} className="text-center md:text-left flex flex-col gap-4">
              <div className="w-12 h-px bg-[var(--text-main)] mx-auto md:mx-0 mb-4" />
              <h3 className="font-cormorant text-2xl font-light">{v.title}</h3>
              <p className="text-sm text-[var(--text-muted)] leading-relaxed">{v.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-[var(--border-soft)]">
        <div className="max-w-screen-xl mx-auto px-6 md:px-10 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="font-cormorant text-2xl tracking-widest uppercase">Moudestar</p>
          <div className="flex items-center gap-8">
            <Link href="/boutique" className="text-[10px] tracking-widest uppercase text-[var(--text-muted)] hover:text-black transition-colors">Boutique</Link>
            <Link href="/admin" className="text-[10px] tracking-widest uppercase text-[var(--text-muted)] hover:text-black transition-colors">Admin</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
