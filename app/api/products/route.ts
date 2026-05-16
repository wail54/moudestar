import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/products — liste tous les produits
export async function GET() {
  try {
    const products = await prisma.product.findMany({
      include: {
        variants: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(products);
  } catch (error) {
    console.error('[GET /api/products]', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST /api/products — créer un produit
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, description, price, promoPrice, images, category, featured, sizeType, barcode, shortId, variants } = body;

    if (!name || price == null) {
      return NextResponse.json({ error: 'Champs obligatoires manquants' }, { status: 400 });
    }

    const product = await prisma.product.create({
      data: {
        name,
        description: description ?? '',
        price: Number(price),
        promoPrice: promoPrice != null ? Number(promoPrice) : null,
        images: images ?? [],
        category,
        featured: featured ?? false,
        sizeType: sizeType ?? 'NONE',
        barcode: barcode || null,
        shortId: shortId || null,
        variants: {
          create: variants?.map((v: any) => ({
            color: v.color || null,
            size: v.size || null,
            stock: Number(v.stock) || 0,
            barcode: v.barcode || null,
            shortId: v.shortId || null,
          })) || [],
        },
      },
      include: {
        variants: true,
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error: any) {
    console.error('[POST /api/products]', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Un code-barres ou ID court est déjà utilisé.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
