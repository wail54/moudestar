import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/auth/ensure-profile
 * Appelé après chaque connexion pour s'assurer que le Profile existe en DB.
 * Utilise le JWT passé dans l'en-tête Authorization.
 */
export async function POST(req: Request) {
  try {
    const auth = req.headers.get('Authorization');
    const token = auth?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (!url || !key) {
      return NextResponse.json({ error: 'Config Supabase manquante' }, { status: 500 });
    }

    const supabase = createServerClient(url, key, {
      cookies: { getAll: () => [], setAll: () => {} },
    });

    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return NextResponse.json({ error: 'Token invalide' }, { status: 401 });
    }

    const role = user.user_metadata?.role === 'ADMIN' ? 'ADMIN' : 'USER';

    await prisma.profile.upsert({
      where: { id: user.id },
      update: { role },
      create: {
        id: user.id,
        email: user.email!,
        role,
      },
    });

    return NextResponse.json({ success: true, role });
  } catch (err) {
    console.error('[ensure-profile]', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
