import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';

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

export async function GET() {
  try {
    const orders = await prisma.order.findMany({
      include: {
        items: { include: { product: true } },
        profile: { select: { email: true, role: true } },
        creditsIssued: { select: { code: true, amount: true, remaining: true, isActive: true } },
      },
      orderBy: { date: 'desc' },
    });
    return NextResponse.json(orders);
  } catch (error) {
    console.error('[GET /api/orders]', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { items, source = 'en_ligne', sessionId, storeCreditCode, shippingAddress, paymentMethod, voucherAmount, voucherCode } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Panier vide' }, { status: 400 });
    }

    const userId = await getUserIdFromRequest(req);

    let finalShippingAddress = shippingAddress || null;
    let finalStoreCreditCode = storeCreditCode || null;

    if (sessionId && !sessionId.startsWith('sc_')) {
      try {
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-10-16' as any });
        const session: any = await stripe.checkout.sessions.retrieve(sessionId);
        
        let addrInfo = session.shipping_details?.address || session.customer_details?.address;
        let nameInfo = session.shipping_details?.name || session.customer_details?.name || session.customer_details?.email || '';

        if (!finalShippingAddress && addrInfo) {
          const cityLine = [addrInfo.postal_code, addrInfo.city].filter(Boolean).join(' ');
          finalShippingAddress = [
            nameInfo,
            addrInfo.line1,
            addrInfo.line2,
            cityLine,
            addrInfo.country,
          ].filter((v) => v && v.trim() && v !== 'null').join(', ');
        }
        

        if (session.metadata?.storeCreditCode) {
          finalStoreCreditCode = session.metadata.storeCreditCode;
        }
        if (!finalShippingAddress && session.metadata?.shippingAddress) {
          finalShippingAddress = session.metadata.shippingAddress;
        }
      } catch (err: any) {
        console.error('[STRIPE] Erreur récupération session:', err.message || err);
      }
    }

    // Prix déjà TTC — pas de TVA ajoutée
    const subtotal: number = items.reduce(
      (sum: number, i: any) => sum + i.product.price * i.quantity,
      0
    );
    const grandTotal = subtotal;

    let discountAmount = body.discountAmount || 0;
    let storeCredit = null;

    if (finalStoreCreditCode) {
      storeCredit = await prisma.storeCredit.findUnique({ where: { code: finalStoreCreditCode } });
      if (storeCredit && storeCredit.isActive && storeCredit.remaining > 0) {
        if (!storeCredit.expiresAt || storeCredit.expiresAt >= new Date()) {
          if (!storeCredit.userId || storeCredit.userId === userId) {
            discountAmount = Math.min(grandTotal, discountAmount || storeCredit.remaining);
          }
        }
      }
    }

    const total = grandTotal - discountAmount;

    // Créer la commande et ses items
    const order = await prisma.order.create({
      data: {
        userId: userId ?? undefined,
        shippingAddress: finalShippingAddress,
        subtotal,
        discount: discountAmount,
        tva: 0, // Prix TTC — TVA incluse
        total,
        status: source === 'caisse' ? 'Terminée' : 'Confirmée',
        source,
        paymentMethod: paymentMethod || 'STRIPE',
        voucherAmount: voucherAmount ? Number(voucherAmount) : null,
        voucherCode: voucherCode || null,
        items: {
          create: items.map((item: any) => ({
            productId: item.product.id,
            variantId: item.variantId || null,
            quantity: item.quantity,
            size: item.size ?? null,
            color: item.color ?? null,
            price: item.product.price,
          })),
        },
      },
      include: {
        items: { include: { product: true } },
      },
    });

    // Déduire l'avoir si utilisé
    if (storeCredit && discountAmount > 0) {
      await prisma.storeCredit.update({
        where: { id: storeCredit.id },
        data: {
          remaining: Math.max(0, storeCredit.remaining - discountAmount),
          isActive: storeCredit.remaining - discountAmount > 0, // Désactiver si vidé
        }
      });
    }

    // Mettre à jour le stock (décrémenter) pour chaque variant (ou fallback produit)
    await Promise.all(
      items.map(async (item: any) => {
        if (item.variantId) {
          // Mise à jour de la variante
          const currentVariant = await prisma.productVariant.findUnique({ where: { id: item.variantId }});
          if (currentVariant) {
            await prisma.productVariant.update({
              where: { id: item.variantId },
              data: { stock: Math.max(0, currentVariant.stock - item.quantity) }
            });
          }
        } else {
          // Rétrocompatibilité : produit sans variantes (stockS/M/L/XL legacy - ignoré ici car supprimé du schéma Prisma)
        }
      })
    );

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error('[POST /api/orders]', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
