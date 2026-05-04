'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Loader2, ShieldCheck, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

// ─── Inner component (needs useSearchParams — must be inside Suspense) ───────

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/admin';
  const hasError = searchParams.get('error') === 'auth_callback_error';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(hasError ? 'Erreur de connexion. Réessayez.' : '');

  // Redirect if already logged in as admin
  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.user_metadata?.role === 'ADMIN') {
        router.replace(redirectTo);
      }
    });
  }, [router, redirectTo]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const supabase = createClient();
    if (!supabase) {
      setError('Service indisponible. Contactez l’administrateur.');
      setLoading(false);
      return;
    }

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError('Email ou mot de passe incorrect.');
      setLoading(false);
      return;
    }

    const role = data.user?.user_metadata?.role;
    if (role !== 'ADMIN') {
      await supabase.auth.signOut();
      setError('Accès refusé. Ce panneau est réservé aux administrateurs.');
      setLoading(false);
      return;
    }

    router.replace(redirectTo);
  };

  return (
    <form onSubmit={handleLogin} className="px-10 py-10 flex flex-col gap-6">
      <div>
        <label className="block text-[10px] tracking-widest uppercase font-medium text-[var(--text-muted)] mb-2">
          Adresse e-mail
        </label>
        <input
          id="login-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="admin@moudestar.com"
          required
          autoComplete="email"
          className="w-full px-4 py-3.5 bg-[var(--bg-alt)] outline-none rounded-sm text-sm border border-transparent focus:border-black transition-colors placeholder:text-[var(--text-muted)]"
        />
      </div>

      <div>
        <label className="block text-[10px] tracking-widest uppercase font-medium text-[var(--text-muted)] mb-2">
          Mot de passe
        </label>
        <div className="relative">
          <input
            id="login-password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            autoComplete="current-password"
            className="w-full px-4 py-3.5 pr-12 bg-[var(--bg-alt)] outline-none rounded-sm text-sm border border-transparent focus:border-black transition-colors placeholder:text-[var(--text-muted)]"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-black transition-colors"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-2.5 text-xs text-red-600 font-medium bg-red-50 px-4 py-3 rounded-sm border border-red-100"
        >
          <AlertCircle size={14} className="mt-0.5 shrink-0" />
          {error}
        </motion.div>
      )}

      <button
        id="login-submit"
        type="submit"
        disabled={loading}
        className="w-full py-4 bg-black text-white text-[11px] font-medium tracking-[0.2em] uppercase rounded-sm hover:bg-black/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
      >
        {loading ? (
          <>
            <Loader2 size={14} className="animate-spin" />
            Connexion…
          </>
        ) : (
          'Se connecter'
        )}
      </button>
    </form>
  );
}

// ─── Page shell (no useSearchParams here — safe to prerender) ───────────────

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-alt)] px-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md"
      >
        {/* Card */}
        <div className="bg-white rounded-sm shadow-xl border border-[var(--border-soft)] overflow-hidden">

          {/* Header */}
          <div className="px-10 py-10 border-b border-[var(--border-soft)] text-center">
            <div className="w-12 h-12 bg-black rounded-sm flex items-center justify-center mx-auto mb-6">
              <ShieldCheck size={22} className="text-white" />
            </div>
            <h1 className="font-cormorant text-3xl font-light tracking-widest uppercase mb-1">
              Moudestar
            </h1>
            <p className="text-[10px] tracking-[0.3em] uppercase text-[var(--text-muted)] font-medium">
              Espace Administration
            </p>
          </div>

          {/* Form — useSearchParams inside Suspense boundary */}
          <Suspense fallback={
            <div className="px-10 py-10 flex items-center justify-center">
              <Loader2 size={20} className="animate-spin text-[var(--text-muted)]" />
            </div>
          }>
            <LoginForm />
          </Suspense>
        </div>

        <p className="text-center text-[10px] text-[var(--text-muted)] mt-6 tracking-widest uppercase">
          © {new Date().getFullYear()} Moudestar — Accès réservé
        </p>
      </motion.div>
    </div>
  );
}
