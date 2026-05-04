import { NextResponse } from 'next/server';

/**
 * GET /api/health — vérifie que les variables d'environnement sont bien chargées.
 * Ne révèle pas les valeurs, seulement leur présence (boolean).
 */
export async function GET() {
  return NextResponse.json({
    ok: true,
    timestamp: new Date().toISOString(),
    env: {
      DATABASE_URL: !!process.env.DATABASE_URL,
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      SEED_SECRET: !!process.env.SEED_SECRET,
    },
  });
}
