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

// GET /api/refunds — liste des demandes de remboursement (admin)
export async function GET() {
  try {
    const requests = await prisma.refundRequest.findMany({
      include: {
        order: { select: { id: true, total: true, date: true } },
        profile: { select: { email: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(requests);
  } catch (error) {
    console.error('[GET /api/refunds]', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST /api/refunds — initier une demande de remboursement (client)
export async function POST(req: Request) {
  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await req.json();
    const { orderId, reason } = body;

    if (!orderId || !reason) {
      return NextResponse.json({ error: 'Champs obligatoires manquants' }, { status: 400 });
    }

    // Vérifier que la commande appartient bien à l'utilisateur
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order || order.userId !== userId) {
      return NextResponse.json({ error: 'Commande introuvable ou accès refusé' }, { status: 404 });
    }

    // Vérifier si une demande existe déjà
    const existing = await prisma.refundRequest.findFirst({
      where: { orderId, userId },
    });
    if (existing) {
      return NextResponse.json({ error: 'Une demande existe déjà pour cette commande' }, { status: 400 });
    }

    const request = await prisma.refundRequest.create({
      data: {
        orderId,
        userId,
        reason,
        status: 'pending',
      },
    });

    return NextResponse.json(request, { status: 201 });
  } catch (error) {
    console.error('[POST /api/refunds]', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
