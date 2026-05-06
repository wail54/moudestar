import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { createServerClient } from '@supabase/ssr';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16' as any,
});

function getSupabase(req: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
  return createServerClient(url, key, { cookies: { getAll: () => [], setAll: () => {} } });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { items, storeCreditCode, shippingAddress } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Panier vide' }, { status: 400 });
    }

    const auth = req.headers.get('Authorization');
    const token = auth?.replace('Bearer ', '');
    let userId = null;
    let userEmail = '';
    
    if (token) {
      const { data: { user } } = await getSupabase(req).auth.getUser(token);
      userId = user?.id || null;
      userEmail = user?.email || '';
    }

    let discountAmount = 0;
    let storeCredit = null;

    // Prix déjà TTC — pas de TVA ajoutée
    let subtotal = 0;
    for (const item of items) {
      subtotal += item.product.price * item.quantity;
    }
    const grandTotal = subtotal;

    if (storeCreditCode) {
      storeCredit = await prisma.storeCredit.findUnique({ where: { code: storeCreditCode } });
      if (storeCredit && storeCredit.isActive && storeCredit.remaining > 0) {
        if (!storeCredit.expiresAt || storeCredit.expiresAt >= new Date()) {
          if (!storeCredit.userId || storeCredit.userId === userId) {
            discountAmount = Math.min(grandTotal, storeCredit.remaining);
          }
        }
      }
    }

    const finalAmount = grandTotal - discountAmount;

    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    if (finalAmount <= 0) {
      // Le total est de 0€, on bypass Stripe
      // On génère un pseudo-session ID pour la validation de commande
      const pseudoSessionId = `sc_${storeCreditCode}_${Date.now()}`;
      return NextResponse.json({ url: `${origin}/checkout/success?session_id=${pseudoSessionId}&free=true` });
    }

    // Calcul de la réduction en pourcentage pour Stripe
    // Stripe Coupons : On peut créer un coupon ou utiliser des discounts. 
    // Mieux: On répartit le discount sur les items ou on crée un coupon éphémère.
    let coupon = null;
    if (discountAmount > 0) {
      coupon = await stripe.coupons.create({
        amount_off: Math.round(discountAmount * 100),
        currency: 'eur',
        duration: 'once',
      });
    }

    // Prix TTC directs — pas de multiplication par 1.20
    const line_items_ttc = items.map((item: any) => {
      const variantName = [item.size, item.color].filter(Boolean).join(' - ');
      return {
        price_data: {
          currency: 'eur',
          product_data: {
            name: item.product.name + (variantName ? ` (${variantName})` : ''),
            images: item.product.images?.length > 0 ? [item.product.images[0]] : (item.product.image ? [item.product.image] : []),
          },
          unit_amount: Math.round(item.product.price * 100), // TTC
        },
        quantity: item.quantity,
      };
    });

    const encodedAddr = shippingAddress ? encodeURIComponent(shippingAddress) : '';
    const encodedSc = storeCreditCode ? encodeURIComponent(storeCreditCode) : '';

    const sessionData: any = {
      payment_method_types: ['card'],
      line_items: line_items_ttc,
      mode: 'payment',
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}${encodedAddr ? `&addr=${encodedAddr}` : ''}${encodedSc ? `&sc=${encodedSc}` : ''}`,
      cancel_url: `${origin}/checkout/cancel`,
      client_reference_id: userId || undefined,
      metadata: {
        order_details: JSON.stringify(items.map((i: any) => ({ id: i.product.id, variantId: i.variantId, q: i.quantity }))),
        storeCreditCode: storeCreditCode || '',
        shippingAddress: shippingAddress || '',
        userId: userId || '',
      },
    };

    if (userEmail) {
      sessionData.customer_email = userEmail;
    }

    if (coupon) {
      sessionData.discounts = [{ coupon: coupon.id }];
    }

    if (!shippingAddress) {
      sessionData.shipping_address_collection = {
        // LU en premier = pays par défaut dans Stripe Checkout
        allowed_countries: ['LU', 'BE', 'FR', 'CH', 'MC'],
      };
    }

    const session = await stripe.checkout.sessions.create(sessionData);

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('[STRIPE CHECKOUT ERROR]', error);
    return NextResponse.json({ error: error.message || 'Erreur interne' }, { status: 500 });
  }
}
