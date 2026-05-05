import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

// Fonction utilitaire pour générer un code d'avoir unique
function generateCreditCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'AVOIR-';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// GET /api/store-credits — lister les avoirs (admin)
export async function GET() {
  try {
    const credits = await prisma.storeCredit.findMany({
      include: {
        profile: { select: { email: true, firstName: true, lastName: true } },
      },
      orderBy: { issuedAt: 'desc' },
    });
    return NextResponse.json(credits);
  } catch (error) {
    console.error('[GET /api/store-credits]', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST /api/store-credits — générer un avoir manuel (admin)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { amount, userId, reason, expiresAt } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Montant invalide' }, { status: 400 });
    }

    const code = generateCreditCode();

    const credit = await prisma.storeCredit.create({
      data: {
        code,
        amount: Number(amount),
        remaining: Number(amount),
        userId: userId || null,
        reason: reason || 'manual',
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
      include: {
        profile: { select: { email: true } },
      },
    });

    return NextResponse.json(credit, { status: 201 });
  } catch (error) {
    console.error('[POST /api/store-credits]', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
