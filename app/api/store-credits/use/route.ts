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

async function getUserIdFromRequest(req: Request): Promise<string | null> {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) return null;
  const { data: { user } } = await getSupabase().auth.getUser(token);
  return user?.id ?? null;
}

// POST /api/store-credits/use — utiliser un avoir en caisse et générer l'avoir de monnaie si besoin
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { code, voucherAmount, orderTotal } = body;
    // voucherAmount = montant du bon "client en compte" (ex: Mairie)
    // code = code d'avoir existant
    // orderTotal = total de la commande TTC

    if (!orderTotal || orderTotal <= 0) {
      return NextResponse.json({ error: 'Total invalide' }, { status: 400 });
    }

    let discountFromCredit = 0;
    let credit = null;

    if (code) {
      credit = await prisma.storeCredit.findUnique({ where: { code } });
      if (!credit || !credit.isActive || credit.remaining <= 0) {
        return NextResponse.json({ error: 'Code avoir invalide ou épuisé' }, { status: 400 });
      }
      if (credit.expiresAt && credit.expiresAt < new Date()) {
        return NextResponse.json({ error: 'Code avoir expiré' }, { status: 400 });
      }
      discountFromCredit = Math.min(orderTotal, credit.remaining);
    }

    let discountFromVoucher = 0;
    let changeCredit: { code: string; amount: number } | null = null;

    if (voucherAmount && voucherAmount > 0) {
      const remainingAfterCredit = orderTotal - discountFromCredit;
      if (voucherAmount >= remainingAfterCredit) {
        discountFromVoucher = remainingAfterCredit;
        const change = voucherAmount - remainingAfterCredit;
        if (change > 0.01) {
          // Générer un avoir pour la monnaie
          const newCode = `AVOIR-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
          const newCredit = await prisma.storeCredit.create({
            data: {
              code: newCode,
              amount: Math.round(change * 100) / 100,
              remaining: Math.round(change * 100) / 100,
              isActive: true,
              reason: 'voucher_change',
            },
          });
          changeCredit = { code: newCode, amount: newCredit.amount };
        }
      } else {
        discountFromVoucher = voucherAmount;
      }
    }

    const totalDiscount = discountFromCredit + discountFromVoucher;
    const amountDue = Math.max(0, orderTotal - totalDiscount);

    return NextResponse.json({
      discountFromCredit,
      discountFromVoucher,
      totalDiscount,
      amountDue,
      changeCredit, // Code avoir pour la monnaie si bon > total
    });
  } catch (error) {
    console.error('[POST /api/store-credits/use]', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
