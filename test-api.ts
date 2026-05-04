import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
    const email = "test" + Date.now() + "@example.com";
    const password = "password123";
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
    console.log({ supabaseUrl, supabaseKey });
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { role: 'USER' },
      },
    });

    if (error) {
      console.log('Error:', error);
      return;
    }

    const user = data?.user;
    if (user) {
      try {
        await prisma.profile.upsert({
          where: { id: user.id },
          update: { role: 'USER' },
          create: {
            id: user.id,
            email: email,
            role: 'USER',
          },
        });
        console.log('Created profile', user.id);
      } catch (e) {
        console.log('Prisma error:', e);
      }
    }
}
run();
