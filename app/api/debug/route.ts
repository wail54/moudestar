import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const syncOrderId = searchParams.get('syncOrderId');
    const syncSessionId = searchParams.get('syncSessionId');

    if (syncOrderId && syncSessionId && process.env.STRIPE_SECRET_KEY) {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' as any });
      const session: any = await stripe.checkout.sessions.retrieve(syncSessionId);
      let addrInfo = session.shipping_details?.address || session.customer_details?.address;
      let nameInfo = session.shipping_details?.name || session.customer_details?.name || session.customer_details?.email || '';
      
      let shippingAddress = null;
      if (addrInfo) {
        shippingAddress = [
          nameInfo,
          addrInfo.line1,
          addrInfo.line2,
          `${addrInfo.postal_code} ${addrInfo.city}`,
          addrInfo.country
        ].filter(Boolean).join(', ');
      }
      
      if (shippingAddress) {
        await prisma.order.update({
          where: { id: syncOrderId },
          data: { shippingAddress }
        });
        return NextResponse.json({ success: true, shippingAddress });
      }
      return NextResponse.json({ error: 'No address in session', session });
    }

    const orders = await prisma.order.findMany({
      orderBy: { date: 'desc' },
      take: 5,
    });
    
    let stripeInfo = "No Stripe Key";
    let stripeSessions: any[] = [];
    if (process.env.STRIPE_SECRET_KEY) {
      stripeInfo = process.env.STRIPE_SECRET_KEY.substring(0, 10) + "...";
      try {
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' as any });
        const sessions = await stripe.checkout.sessions.list({ limit: 3 });
        stripeSessions = sessions.data.map((s: any) => ({
          id: s.id,
          payment_status: s.payment_status,
          shipping_details: s.shipping_details,
          customer_details: s.customer_details,
        }));
      } catch (err: any) {
        stripeInfo = "Stripe Error: " + err.message;
      }
    }

    return NextResponse.json({
      orders: orders.map(o => ({ id: o.id, shippingAddress: o.shippingAddress, date: o.date })),
      stripeInfo,
      stripeSessions,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
