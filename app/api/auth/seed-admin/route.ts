import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { prisma } from '@/lib/prisma';

const ADMIN_EMAIL = 'admin@moudestar.com';
const ADMIN_PASSWORD = 'password';

/**
 * POST /api/auth/seed-admin
 * Crée ou recrée le compte admin.
 * ⚠️  DÉSACTIVÉ en production — protégé par SEED_SECRET.
 */
export async function POST(request: Request) {
  // Bloquer en production sans secret
  if (process.env.NODE_ENV === 'production') {
    const secret = request.headers.get('x-seed-secret');
    if (!secret || secret !== process.env.SEED_SECRET) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // 1. Tenter de se connecter — si ça marche, l'admin existe et est confirmé
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  });

  if (!signInError && signInData.user) {
    // L'admin est déjà opérationnel
    await supabase.auth.signOut();
    return NextResponse.json({
      success: true,
      alreadyExists: true,
      confirmed: true,
      message: '✅ Admin déjà actif et confirmé. Connectez-vous sur /login.',
    });
  }

  // 2. Créer l'utilisateur s'il n'existe pas
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    options: { data: { role: 'ADMIN' } },
  });

  if (signUpError && !signUpError.message.includes('already registered')) {
    return NextResponse.json({ success: false, error: signUpError.message }, { status: 500 });
  }

  const userId = signUpData?.user?.id;
  const isConfirmed = !!signUpData?.user?.email_confirmed_at;

  // 3. Créer le profil Prisma si possible
  if (userId) {
    try {
      await prisma.profile.upsert({
        where: { id: userId },
        update: { role: 'ADMIN' },
        create: { id: userId, email: ADMIN_EMAIL, role: 'ADMIN' },
      });
    } catch (e) {
      console.warn('[seed-admin] Profile upsert skipped:', e);
    }
  }

  if (isConfirmed) {
    return NextResponse.json({
      success: true,
      confirmed: true,
      message: '✅ Admin créé et confirmé !',
    });
  }

  // 4. Email non confirmé → instructions claires
  return NextResponse.json({
    success: true,
    confirmed: false,
    userId,
    message: "⚠️ Admin créé mais email non confirmé.",
    action_required: "Allez sur Supabase Dashboard → Authentication → Users → admin@moudestar.com → cliquez 'Send confirmation email' OU désactivez 'Enable email confirmations' dans Authentication → Providers → Email.",
  }, { status: 202 });
}
