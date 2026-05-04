import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/products — liste tous les produits
export async function GET() {
  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: 'asc' },
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
    const { name, description, price, image, category, featured, stock } = body;

    if (!name || price == null) {
      return NextResponse.json({ error: 'Champs obligatoires manquants' }, { status: 400 });
    }

    const product = await prisma.product.create({
      data: {
        name,
        description: description ?? '',
        price: Number(price),
        image: image ?? '',
        category,
        featured: featured ?? false,
        stockS: stock?.S ?? 0,
        stockM: stock?.M ?? 0,
        stockL: stock?.L ?? 0,
        stockXL: stock?.XL ?? 0,
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error('[POST /api/products]', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
