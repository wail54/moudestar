import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createServerClient } from '@supabase/ssr';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
  return createServerClient(url, key, { cookies: { getAll: () => [], setAll: () => {} } });
}

async function getUserIdFromRequest(req: Request): Promise<string | null> {
  const auth = req.headers.get('Authorization');
  const token = auth?.replace('Bearer ', '');
  if (!token) return null;
  const { data: { user } } = await getSupabase().auth.getUser(token);
  return user?.id ?? null;
}

export async function GET(req: Request) {
  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const credits = await prisma.storeCredit.findMany({
      where: { userId },
      orderBy: { issuedAt: 'desc' },
    });
    
    return NextResponse.json(credits);
  } catch (error) {
    console.error('[GET /api/account/credits]', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
