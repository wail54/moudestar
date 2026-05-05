import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createServerClient } from '@supabase/ssr';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
  return createServerClient(url, key, { cookies: { getAll: () => [], setAll: () => {} } });
}

export async function POST(req: Request) {
  try {
    const { code } = await req.json();
    if (!code) {
      return NextResponse.json({ error: 'Code requis' }, { status: 400 });
    }

    const auth = req.headers.get('Authorization');
    const token = auth?.replace('Bearer ', '');
    let userId = null;
    
    if (token) {
      const { data: { user } } = await getSupabase().auth.getUser(token);
      userId = user?.id || null;
    }

    const credit = await prisma.storeCredit.findUnique({
      where: { code },
    });

    if (!credit) {
      return NextResponse.json({ error: 'Code invalide' }, { status: 404 });
    }

    if (!credit.isActive || credit.remaining <= 0) {
      return NextResponse.json({ error: 'Ce code a déjà été utilisé ou est inactif' }, { status: 400 });
    }

    if (credit.expiresAt && credit.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Ce code a expiré' }, { status: 400 });
    }

    if (credit.userId && credit.userId !== userId) {
      return NextResponse.json({ error: 'Ce code ne vous est pas destiné' }, { status: 403 });
    }

    return NextResponse.json({
      valid: true,
      code: credit.code,
      remaining: credit.remaining,
      id: credit.id,
    });
  } catch (error) {
    console.error('[POST /api/store-credits/validate]', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
