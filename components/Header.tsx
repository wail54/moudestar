'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingBag, Menu, X } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { useRouter } from 'next/navigation';

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const cart = useStore((s) => s.cart);
  const toggleCart = useStore((s) => s.toggleCart);
  const router = useRouter();

  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const links = [
    { href: '/', label: 'Accueil' },
    { href: '/boutique', label: 'Boutique' },
  ];

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'bg-dark/95 backdrop-blur-md border-b border-white/5 shadow-lg' : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Burger - mobile */}
            <button
              className="md:hidden p-2 text-[var(--light)] hover:text-[var(--gold)] transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Menu"
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>

            {/* Logo */}
            <Link
              href="/"
              className="font-cormorant text-2xl md:text-3xl font-light tracking-[0.3em] uppercase text-[var(--white)] hover:text-[var(--gold)] transition-colors duration-300"
            >
              Moudestar
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-8">
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="text-sm tracking-widest uppercase text-[var(--gray-4)] hover:text-[var(--white)] transition-colors duration-200"
                >
                  {l.label}
                </Link>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-2 md:gap-4">
              <button
                onClick={toggleCart}
                className="relative p-2 text-[var(--light)] hover:text-[var(--gold)] transition-colors"
                aria-label="Panier"
              >
                <ShoppingBag size={22} />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[var(--gold)] text-[var(--dark)] text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                    {cartCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => router.push('/admin')}
                className="hidden md:block text-xs tracking-widest uppercase text-[var(--gray-3)] hover:text-[var(--gold)] transition-colors border border-[var(--gray-1)] hover:border-[var(--gold)] px-3 py-1.5 rounded"
              >
                Admin
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      <div
        className={`fixed inset-0 z-40 md:hidden transition-all duration-300 ${
          mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
        <div
          className={`absolute top-0 left-0 bottom-0 w-72 bg-[var(--dark-2)] transition-transform duration-300 ${
            mobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="p-6 pt-20">
            <p className="font-cormorant text-xs tracking-[0.4em] uppercase text-[var(--gold)] mb-8">Navigation</p>
            <nav className="flex flex-col gap-6">
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setMobileOpen(false)}
                  className="text-xl font-light text-[var(--light)] hover:text-[var(--gold)] transition-colors"
                >
                  {l.label}
                </Link>
              ))}
              <Link
                href="/admin"
                onClick={() => setMobileOpen(false)}
                className="text-xl font-light text-[var(--gray-3)] hover:text-[var(--gold)] transition-colors"
              >
                Panel Admin
              </Link>
            </nav>
          </div>
        </div>
      </div>
    </>
  );
}
