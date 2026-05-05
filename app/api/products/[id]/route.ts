import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type Params = { params: Promise<{ id: string }> };

// PATCH /api/products/[id] — mettre à jour un produit
export async function PATCH(req: Request, { params }: Params) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { name, description, price, images, category, featured, sizeType, barcode, shortId, variants } = body;

    const data: Record<string, any> = {};
    if (name !== undefined) data.name = name;
    if (description !== undefined) data.description = description;
    if (price !== undefined) data.price = Number(price);
    if (images !== undefined) data.images = images;
    if (category !== undefined) data.category = category;
    if (featured !== undefined) data.featured = featured;
    if (sizeType !== undefined) data.sizeType = sizeType;
    if (barcode !== undefined) data.barcode = barcode || null;
    if (shortId !== undefined) data.shortId = shortId || null;

    // Mise à jour du produit
    const product = await prisma.product.update({
      where: { id },
      data,
    });

    // Mise à jour des variantes si fournies
    if (variants && Array.isArray(variants)) {
      // Pour faire simple et robuste : on supprime les anciennes variantes non incluses,
      // on met à jour les existantes et on crée les nouvelles.
      const incomingVariantIds = variants.map(v => v.id).filter(Boolean);
      
      // 1. Supprimer les variantes qui ne sont plus là
      await prisma.productVariant.deleteMany({
        where: {
          productId: id,
          id: { notIn: incomingVariantIds }
        }
      });

      // 2. Créer ou mettre à jour les variantes
      for (const v of variants) {
        if (v.id) {
          await prisma.productVariant.update({
            where: { id: v.id },
            data: {
              color: v.color || null,
              size: v.size || null,
              stock: Number(v.stock) || 0,
              barcode: v.barcode || null,
              shortId: v.shortId || null,
            }
          });
        } else {
          await prisma.productVariant.create({
            data: {
              productId: id,
              color: v.color || null,
              size: v.size || null,
              stock: Number(v.stock) || 0,
              barcode: v.barcode || null,
              shortId: v.shortId || null,
            }
          });
        }
      }
    }

    // Récupérer le produit complet mis à jour
    const updatedProduct = await prisma.product.findUnique({
      where: { id },
      include: { variants: true }
    });

    return NextResponse.json(updatedProduct);
  } catch (error: any) {
    console.error('[PATCH /api/products/:id]', error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Un code-barres ou ID court est déjà utilisé.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE /api/products/[id] — supprimer un produit
export async function DELETE(_req: Request, { params }: Params) {
  try {
    const { id } = await params;

    // 1. Supprimer les paniers sauvegardés liés
    await prisma.savedCart.deleteMany({ where: { productId: id } });

    // 2. Supprimer les variantes (FK sur ProductVariant → Product est Cascade)
    await prisma.productVariant.deleteMany({ where: { productId: id } });

    // 3. Tenter la suppression du produit
    await prisma.product.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[DELETE /api/products/:id]', error);
    // FK constraint P2003 → OrderItem.productId encore lié
    if (error.code === 'P2003' || error.code === 'P2014') {
      return NextResponse.json({
        error: 'Ce produit est référencé dans des commandes existantes. Désactivez-le plutôt que de le supprimer.',
      }, { status: 409 });
    }
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
