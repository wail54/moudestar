'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Loader2, ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

// ─── Form inner component (uses useSearchParams — must be in Suspense) ────────

function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/admin';

  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
      setError('Service Supabase non configuré. Vérifiez les variables d\'environnement.');
      setLoading(false);
      return;
    }

    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      if (authError.message.toLowerCase().includes('email not confirmed')) {
        setError('Veuillez confirmer votre email avant de vous connecter. Vérifiez votre boîte mail.');
      } else if (authError.message.toLowerCase().includes('invalid login credentials')) {
        setError('Email ou mot de passe incorrect.');
      } else {
        setError(authError.message);
      }
      setLoading(false);
      return;
    }

    // Upsert le Profile en DB (gère les comptes créés avant la correction)
    const token = data.session?.access_token;
    if (token) {
      await fetch('/api/auth/ensure-profile', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      }).catch(() => {}); // non bloquant
    }

    const role = data.user?.user_metadata?.role;
    if (role === 'ADMIN') {
      router.replace(redirectTo);
    } else {
      // Utilisateur connecté → boutique (changement visible)
      router.replace('/boutique');
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const result = await res.json();
      if (!res.ok) {
        const msg: string = result.error ?? 'Erreur lors de la création du compte.';
        setError(
          msg.toLowerCase().includes('already registered') || msg.toLowerCase().includes('already been registered')
            ? 'Cet email est déjà utilisé. Connectez-vous.'
            : msg
        );
        setLoading(false);
        return;
      }
    } catch {
      setError('Erreur réseau. Réessayez.');
      setLoading(false);
      return;
    }

    setSuccess('Compte créé ! Vous pouvez maintenant vous connecter.');
    setMode('login');
    setPassword('');
    setConfirmPassword('');
    setLoading(false);
  };

  const resetForm = (newMode: 'login' | 'signup') => {
    setMode(newMode);
    setError('');
    setSuccess('');
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <>
      {/* Tabs */}
      <div className="flex border-b border-[var(--border-soft)]">
        {(['login', 'signup'] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => resetForm(m)}
            className={`flex-1 py-4 text-[10px] tracking-[0.2em] uppercase font-medium transition-all ${
              mode === m
                ? 'text-[var(--text-main)] border-b-2 border-black -mb-px'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            {m === 'login' ? 'Se connecter' : 'Créer un compte'}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.form
          key={mode}
          initial={{ opacity: 0, x: mode === 'login' ? -12 : 12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: mode === 'login' ? 12 : -12 }}
          transition={{ duration: 0.2 }}
          onSubmit={mode === 'login' ? handleLogin : handleSignup}
          className="px-10 py-8 flex flex-col gap-5"
        >
          {/* Email */}
          <div>
            <label className="block text-[10px] tracking-widest uppercase font-medium text-[var(--text-muted)] mb-2">
              Adresse e-mail
            </label>
            <input
              id={`${mode}-email`}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="exemple@email.com"
              required
              autoComplete="email"
              className="w-full px-4 py-3.5 bg-[var(--bg-alt)] outline-none rounded-sm text-sm border border-transparent focus:border-black transition-colors placeholder:text-[var(--text-muted)]"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-[10px] tracking-widest uppercase font-medium text-[var(--text-muted)] mb-2">
              Mot de passe
            </label>
            <div className="relative">
              <input
                id={`${mode}-password`}
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
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

          {/* Confirm password (signup only) */}
          {mode === 'signup' && (
            <div>
              <label className="block text-[10px] tracking-widest uppercase font-medium text-[var(--text-muted)] mb-2">
                Confirmer le mot de passe
              </label>
              <input
                id="signup-confirm"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="new-password"
                className="w-full px-4 py-3.5 bg-[var(--bg-alt)] outline-none rounded-sm text-sm border border-transparent focus:border-black transition-colors placeholder:text-[var(--text-muted)]"
              />
            </div>
          )}

          {/* Error */}
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

          {/* Success */}
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-2.5 text-xs text-emerald-700 font-medium bg-emerald-50 px-4 py-3 rounded-sm border border-emerald-200"
            >
              <CheckCircle2 size={14} className="mt-0.5 shrink-0" />
              {success}
            </motion.div>
          )}

          <button
            id={`${mode}-submit`}
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-black text-white text-[11px] font-medium tracking-[0.2em] uppercase rounded-sm hover:bg-black/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mt-1"
          >
            {loading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                {mode === 'login' ? 'Connexion…' : 'Création…'}
              </>
            ) : (
              mode === 'login' ? 'Se connecter' : 'Créer mon compte'
            )}
          </button>
        </motion.form>
      </AnimatePresence>
    </>
  );
}

// ─── Page shell ───────────────────────────────────────────────────────────────

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
          <div className="px-10 py-8 border-b border-[var(--border-soft)] text-center">
            <div className="w-12 h-12 bg-black rounded-sm flex items-center justify-center mx-auto mb-5">
              <ShieldCheck size={22} className="text-white" />
            </div>
            <h1 className="font-cormorant text-3xl font-light tracking-widest uppercase mb-1">
              Moudestar
            </h1>
            <p className="text-[10px] tracking-[0.3em] uppercase text-[var(--text-muted)] font-medium">
              Mon espace
            </p>
          </div>

          {/* Auth form inside Suspense (uses useSearchParams) */}
          <Suspense fallback={
            <div className="px-10 py-10 flex items-center justify-center">
              <Loader2 size={20} className="animate-spin text-[var(--text-muted)]" />
            </div>
          }>
            <AuthForm />
          </Suspense>
        </div>

        <p className="text-center text-[10px] text-[var(--text-muted)] mt-6 tracking-widest uppercase">
          © {new Date().getFullYear()} Moudestar
        </p>
      </motion.div>
    </div>
  );
}
