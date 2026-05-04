import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/orders — liste toutes les commandes avec leurs items
export async function GET() {
  try {
    const orders = await prisma.order.findMany({
      include: {
        items: {
          include: { product: true },
        },
      },
      orderBy: { date: 'desc' },
    });
    return NextResponse.json(orders);
  } catch (error) {
    console.error('[GET /api/orders]', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST /api/orders — créer une commande
// Body: { items: CartItem[], discountAmount: number, source: 'en_ligne' | 'caisse' }
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { items, discountAmount = 0, source = 'en_ligne' } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Panier vide' }, { status: 400 });
    }

    const TVA_RATE = 0.20;
    const subtotal: number = items.reduce(
      (sum: number, i: { product: { price: number }; quantity: number }) =>
        sum + i.product.price * i.quantity,
      0
    );
    const discounted = Math.max(0, subtotal - discountAmount);
    const tva = discounted * TVA_RATE;
    const total = discounted + tva;

    // Créer la commande et ses items en une seule transaction
    const order = await prisma.order.create({
      data: {
        subtotal,
        discount: discountAmount,
        tva,
        total,
        status: source === 'caisse' ? 'Terminée' : 'En attente',
        source,
        items: {
          create: items.map((item: {
            product: { id: string; price: number };
            quantity: number;
            size?: string;
          }) => ({
            productId: item.product.id,
            quantity: item.quantity,
            size: item.size ?? null,
            price: item.product.price,
          })),
        },
      },
      include: {
        items: { include: { product: true } },
      },
    });

    // Mettre à jour le stock (décrémenter) pour chaque item
    await Promise.all(
      items.map(async (item: {
        product: { id: string };
        quantity: number;
        size?: string;
      }) => {
        if (!item.size) return;
        const fieldMap: Record<string, string> = {
          S: 'stockS', M: 'stockM', L: 'stockL', XL: 'stockXL',
        };
        const field = fieldMap[item.size];
        if (!field) return;
        const current = await prisma.product.findUnique({
          where: { id: item.product.id },
          select: { stockS: true, stockM: true, stockL: true, stockXL: true },
        });
        if (!current) return;
        const currentVal = current[field as 'stockS' | 'stockM' | 'stockL' | 'stockXL'];
        await prisma.product.update({
          where: { id: item.product.id },
          data: { [field]: Math.max(0, currentVal - item.quantity) },
        });
      })
    );

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error('[POST /api/orders]', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
