'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Star } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { ProductCard } from '@/components/ProductCard';

export default function HomePage() {
  const products = useStore((s) => s.products);
  const featured = products.filter((p) => p.featured).slice(0, 4);

  return (
    <div className="min-h-screen">
      {/* HERO */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1800&q=80&auto=format&fit=crop"
            alt="Moudestar Hero"
            fill
            priority
            className="object-cover object-center"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-[var(--dark)]" />
        </div>

        <div className="relative z-10 text-center px-6 max-w-3xl mx-auto">
          <p className="animate-fade-up stagger-1 text-[var(--gold)] text-xs tracking-[0.5em] uppercase mb-6">
            Collection Printemps 2025
          </p>
          <h1 className="animate-fade-up stagger-2 font-cormorant text-6xl md:text-8xl font-light text-white leading-none mb-6">
            L&apos;Élégance<br />
            <em className="italic text-[var(--gold-light)]">Redéfinie</em>
          </h1>
          <p className="animate-fade-up stagger-3 text-[var(--gray-4)] text-lg font-light mb-10 max-w-md mx-auto">
            Des pièces intemporelles pour ceux qui cultivent leur propre style.
          </p>
          <Link
            href="/boutique"
            className="animate-fade-up stagger-4 inline-flex items-center gap-3 px-8 py-4 bg-[var(--gold)] hover:bg-[var(--gold-light)] text-[var(--dark)] text-sm font-semibold tracking-widest uppercase transition-all duration-300 hover:gap-5 rounded"
          >
            Découvrir la Collection
            <ArrowRight size={16} />
          </Link>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-[var(--gray-3)] animate-bounce">
          <div className="w-px h-10 bg-gradient-to-b from-transparent to-[var(--gray-3)]" />
        </div>
      </section>

      {/* FEATURED */}
      <section className="py-24 px-4 sm:px-6 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Star size={12} className="text-[var(--gold)]" />
            <p className="text-xs tracking-[0.4em] uppercase text-[var(--gold)]">Sélection exclusive</p>
            <Star size={12} className="text-[var(--gold)]" />
          </div>
          <h2 className="font-cormorant text-5xl md:text-6xl font-light text-white mb-4">
            Produits Phares
          </h2>
          <div className="w-12 h-px bg-[var(--gold)] mx-auto" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {featured.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        <div className="text-center mt-12">
          <Link
            href="/boutique"
            className="inline-flex items-center gap-2 border border-[var(--gray-1)] hover:border-[var(--gold)] text-[var(--gray-4)] hover:text-[var(--gold)] text-xs tracking-widest uppercase px-8 py-4 transition-all duration-300 hover:gap-4 rounded"
          >
            Voir toute la collection
            <ArrowRight size={14} />
          </Link>
        </div>
      </section>

      {/* VALUES */}
      <section className="py-20 border-t border-white/5">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
          {[
            {
              icon: '◈',
              title: 'Qualité Premium',
              desc: 'Matières nobles sélectionnées avec exigence pour une durabilité exceptionnelle.',
            },
            {
              icon: '◇',
              title: 'Design Intemporel',
              desc: 'Des pièces conçues pour traverser les tendances et s\'adapter à chaque style.',
            },
            {
              icon: '◉',
              title: 'Expérience Unique',
              desc: 'Un service personnalisé pour que chaque achat soit une expérience mémorable.',
            },
          ].map((v) => (
            <div key={v.title} className="group">
              <p className="text-3xl text-[var(--gold)] mb-4 group-hover:scale-110 transition-transform duration-300 inline-block">
                {v.icon}
              </p>
              <h3 className="font-cormorant text-2xl font-light text-white mb-3">{v.title}</h3>
              <p className="text-sm text-[var(--gray-3)] leading-relaxed">{v.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* BANNER CTA */}
      <section className="relative py-32 overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1400&q=80&auto=format&fit=crop"
          alt="Banner"
          fill
          className="object-cover object-center"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-black/70" />
        <div className="relative z-10 text-center px-6">
          <h2 className="font-cormorant text-5xl md:text-7xl font-light text-white mb-6">
            Votre Style,<br /><em className="text-[var(--gold-light)] italic">Notre Passion</em>
          </h2>
          <Link
            href="/boutique"
            className="inline-flex items-center gap-3 px-10 py-4 border border-[var(--gold)] text-[var(--gold)] hover:bg-[var(--gold)] hover:text-[var(--dark)] text-sm tracking-widest uppercase transition-all duration-300 rounded"
          >
            Explorer la boutique
          </Link>
        </div>
      </section>
    </div>
  );
}
