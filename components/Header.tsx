'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingBag, Menu, X, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/store/useStore';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const cart = useStore((s) => s.cart);
  const toggleCart = useStore((s) => s.toggleCart);
  const pathname = usePathname();
  const router = useRouter();
  const isAdminRoute = pathname?.startsWith('/admin');
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  // Vérifier si l'utilisateur est admin
  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return; // env vars manquantes — auth désactivée

    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsAdmin(user?.user_metadata?.role === 'ADMIN');
    });
    // Écouter les changements de session
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAdmin(session?.user?.user_metadata?.role === 'ADMIN');
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    if (supabase) await supabase.auth.signOut();
    setIsAdmin(false);
    router.push('/');
  };

  if (isAdminRoute) return null;

  const onHero = pathname === '/' && !scrolled;

  const links = [
    { href: '/', label: 'Accueil' },
    { href: '/boutique', label: 'Boutique' },
  ];

  return (
    <>
      <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 border-b ${
        onHero ? 'border-transparent bg-transparent' : 'border-[var(--border-soft)] glass-header'
      }`}>
        <div className="max-w-screen-xl mx-auto px-6 md:px-10">
          <div className={`flex items-center justify-between transition-all duration-300 ${scrolled ? 'h-16' : 'h-24'}`}>
            
            <button className="md:hidden" onClick={() => setMobileOpen(true)} aria-label="Menu">
              <Menu size={20} className={onHero ? 'text-white' : 'text-[var(--text-main)]'} />
            </button>

            <Link href="/" className={`font-cormorant text-2xl md:text-3xl tracking-[0.25em] uppercase transition-colors ${
              onHero ? 'text-white hover:text-white/80' : 'text-[var(--text-main)] hover:text-[var(--text-muted)]'
            }`}>
              Moudestar
            </Link>

            <nav className="hidden md:flex items-center gap-10">
              {links.map((l) => (
                <Link key={l.href} href={l.href} className={`text-[11px] tracking-[0.15em] uppercase font-medium transition-colors ${
                  onHero ? 'text-white/90 hover:text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}>
                  {l.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-5">
              <button onClick={toggleCart} className="relative p-1" aria-label="Panier">
                <ShoppingBag size={18} strokeWidth={1.5} className={onHero ? 'text-white' : 'text-[var(--text-main)]'} />
                <AnimatePresence>
                  {cartCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                      className="absolute -top-1 -right-1 w-4 h-4 text-[9px] font-medium flex items-center justify-center rounded-full bg-[var(--text-main)] text-white"
                    >
                      {cartCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>

              {/* Lien Admin — visible seulement si connecté en admin */}
              {isAdmin && (
                <>
                  <Link href="/admin" className={`hidden md:block text-[10px] tracking-[0.15em] uppercase font-medium transition-colors ${
                    onHero ? 'text-white/70 hover:text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                  }`}>
                    Admin
                  </Link>
                  <button
                    onClick={handleLogout}
                    title="Déconnexion"
                    className={`hidden md:flex items-center gap-1.5 text-[10px] tracking-[0.15em] uppercase font-medium transition-colors ${
                      onHero ? 'text-white/60 hover:text-white' : 'text-[var(--text-muted)] hover:text-red-500'
                    }`}
                  >
                    <LogOut size={14} />
                  </button>
                </>
              )}

              {/* Lien connexion si pas admin */}
              {!isAdmin && (
                <Link href="/login" className={`hidden md:block text-[10px] tracking-[0.15em] uppercase font-medium transition-colors ${
                  onHero ? 'text-white/70 hover:text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}>
                  Connexion
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMobileOpen(false)} />
            <motion.div className="fixed inset-y-0 left-0 z-50 w-80 bg-white shadow-2xl flex flex-col" initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'tween', duration: 0.3 }}>
              <div className="flex items-center justify-between px-8 py-8 border-b border-[var(--border-soft)]">
                <span className="font-cormorant text-xl tracking-widest uppercase">Moudestar</span>
                <button onClick={() => setMobileOpen(false)} className="text-[var(--text-muted)] hover:text-black"><X size={20} /></button>
              </div>
              <nav className="flex-1 flex flex-col p-4">
                {[
                  ...links,
                  ...(isAdmin ? [{ href: '/admin', label: 'Admin' }] : [{ href: '/login', label: 'Connexion' }])
                ].map((l) => (
                  <Link key={l.href} href={l.href} onClick={() => setMobileOpen(false)} className="px-4 py-4 text-sm font-medium tracking-wide border-b border-[var(--border-soft)] hover:bg-[var(--bg-alt)] transition-colors">
                    {l.label}
                  </Link>
                ))}
                {isAdmin && (
                  <button onClick={() => { handleLogout(); setMobileOpen(false); }} className="px-4 py-4 text-sm font-medium tracking-wide text-left text-red-500 hover:bg-red-50 transition-colors flex items-center gap-2">
                    <LogOut size={14} /> Déconnexion
                  </button>
                )}
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
