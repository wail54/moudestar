import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16' as any,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { items, discountAmount = 0 } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Panier vide' }, { status: 400 });
    }

    const line_items = items.map((item: any) => {
      return {
        price_data: {
          currency: 'eur',
          product_data: {
            name: item.product.name + (item.size ? ` (Taille: ${item.size})` : ''),
            images: item.product.image ? [item.product.image] : [],
          },
          unit_amount: Math.round(item.product.price * 100), // Stripe takes amounts in cents
        },
        quantity: item.quantity,
      };
    });

    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items,
      mode: 'payment',
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout/cancel`,
      metadata: {
        // You can store custom data here if needed for webhooks
        order_details: JSON.stringify(items.map((i: any) => ({ id: i.product.id, size: i.size, q: i.quantity }))),
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('[STRIPE CHECKOUT ERROR]', error);
    return NextResponse.json({ error: error.message || 'Erreur interne' }, { status: 500 });
  }
}
