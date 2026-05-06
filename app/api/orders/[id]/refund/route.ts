import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createServerClient } from '@supabase/ssr';

function getSupabase() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );
}

type Params = { params: Promise<{ id: string }> };

// POST /api/orders/[id]/refund — remboursement partiel ou total (admin)
// body: { itemIds: string[], refundMode: 'credit' | 'cash' | 'card' }
export async function POST(req: Request, { params }: Params) {
  try {
    const { id: orderId } = await params;
    const body = await req.json();
    const { itemIds, refundMode = 'credit' }: { itemIds: string[]; refundMode?: 'credit' | 'cash' | 'card' } = body;

    if (!itemIds || itemIds.length === 0) {
      return NextResponse.json({ error: 'itemIds requis' }, { status: 400 });
    }

    // Charger la commande et ses items
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: { include: { product: true, variant: true } } },
    });

    if (!order) {
      return NextResponse.json({ error: 'Commande introuvable' }, { status: 404 });
    }

    const itemsToRefund = order.items.filter((i) => itemIds.includes(i.id) && !i.refunded);

    if (itemsToRefund.length === 0) {
      return NextResponse.json({ error: 'Aucun article éligible au remboursement' }, { status: 400 });
    }

    // Calcul du montant à rembourser (prix déjà TTC)
    const refundAmount = itemsToRefund.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const refundAmountRounded = Math.round(refundAmount * 100) / 100;

    // 1. Remettre le stock des variantes
    await Promise.all(
      itemsToRefund.map(async (item) => {
        if (item.variantId && item.variant) {
          await prisma.productVariant.update({
            where: { id: item.variantId },
            data: { stock: item.variant.stock + item.quantity },
          });
        }
      })
    );

    // 2. Marquer les items comme remboursés
    await prisma.orderItem.updateMany({
      where: { id: { in: itemsToRefund.map((i) => i.id) } },
      data: { refunded: true, refundedAt: new Date() },
    });

    // 3. Générer un avoir UNIQUEMENT si le mode choisi est 'credit'
    let storeCreditCode: string | null = null;
    if (refundMode === 'credit' && refundAmountRounded > 0) {
      storeCreditCode = `AVOIR-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      await prisma.storeCredit.create({
        data: {
          code: storeCreditCode,
          amount: refundAmountRounded,
          remaining: refundAmountRounded,
          isActive: true,
          userId: order.userId || null,
          sourceOrderId: orderId,
          reason: 'refund',
        },
      });
    }

    // 4. Mettre à jour refundStatus sur la commande
    const allRefunded = order.items.every(
      (i) => i.refunded || itemIds.includes(i.id)
    );
    await prisma.order.update({
      where: { id: orderId },
      data: { refundStatus: allRefunded ? 'full' : 'partial' },
    });

    return NextResponse.json({
      success: true,
      refundAmount: refundAmountRounded,
      refundMode,
      storeCreditCode,
    });
  } catch (error) {
    console.error('[POST /api/orders/:id/refund]', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
