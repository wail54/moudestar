import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type Params = { params: Promise<{ id: string }> };

// PATCH /api/products/[id] — mettre à jour un produit
export async function PATCH(req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { name, description, price, image, category, featured, stock } = body;

    const data: Record<string, unknown> = {};
    if (name !== undefined) data.name = name;
    if (description !== undefined) data.description = description;
    if (price !== undefined) data.price = Number(price);
    if (image !== undefined) data.image = image;
    if (category !== undefined) data.category = category;
    if (featured !== undefined) data.featured = featured;
    if (stock !== undefined) {
      data.stockS = stock.S ?? 0;
      data.stockM = stock.M ?? 0;
      data.stockL = stock.L ?? 0;
      data.stockXL = stock.XL ?? 0;
    }

    const product = await prisma.product.update({
      where: { id },
      data,
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error('[PATCH /api/products/:id]', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE /api/products/[id] — supprimer un produit
export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { id } = await params;
    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE /api/products/:id]', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
