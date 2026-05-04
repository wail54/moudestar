import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { prisma } from '@/lib/prisma';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
  return createServerClient(url, key, { cookies: { getAll: () => [], setAll: () => {} } });
}

async function getUserFromRequest(req: Request) {
  const auth = req.headers.get('Authorization');
  const token = auth?.replace('Bearer ', '');
  if (!token) return null;
  const { data: { user } } = await getSupabase().auth.getUser(token);
  return user ?? null;
}

// GET /api/cart — récupère le panier sauvegardé de l'utilisateur
export async function GET(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json([], { status: 200 });

  const items = await prisma.savedCart.findMany({
    where: { userId: user.id },
    include: { product: true },
  });

  return NextResponse.json(items);
}

// POST /api/cart — remplace entièrement le panier de l'utilisateur
export async function POST(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const body = await req.json();
  const items: { productId: string; quantity: number; size?: string }[] = body.items ?? [];

  // Supprimer l'ancien panier puis réinsérer
  await prisma.savedCart.deleteMany({ where: { userId: user.id } });

  if (items.length > 0) {
    await prisma.savedCart.createMany({
      data: items.map((i) => ({
        userId: user.id,
        productId: i.productId,
        quantity: i.quantity,
        size: i.size ?? null,
      })),
    });
  }

  return NextResponse.json({ success: true });
}

// DELETE /api/cart — vide le panier
export async function DELETE(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  await prisma.savedCart.deleteMany({ where: { userId: user.id } });
  return NextResponse.json({ success: true });
}
