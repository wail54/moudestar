import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email: string = body.email;
    const password: string = body.password;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email et mot de passe requis' },
        { status: 400 }
      );
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (!url || !key) {
      console.error('[signup] Variables Supabase manquantes', { url: !!url, key: !!key });
      return NextResponse.json(
        { error: 'Configuration serveur manquante' },
        { status: 500 }
      );
    }

    const supabase = createServerClient(url, key, {
      cookies: {
        getAll: () => [],
        setAll: () => {},
      },
    });

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { role: 'USER' },
      },
    });

    if (error) {
      console.error('[signup] Supabase error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const userId = data?.user?.id;

    if (userId) {
      try {
        await prisma.profile.upsert({
          where: { id: userId },
          update: { role: 'USER' },
          create: { id: userId, email, role: 'USER' },
        });
      } catch (dbErr) {
        console.error('[signup] Prisma error:', dbErr);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[signup] Unexpected error:', err);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
