import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL!;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function run() {
    const email = "test" + Date.now() + "@example.com";
    const password = "password123";
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { role: 'USER' } },
    });

    if (error) {
      console.error('Supabase error:', error.message);
      return;
    }

    const user = data?.user;
    if (user) {
      try {
        await prisma.profile.upsert({
          where: { id: user.id },
          update: { role: 'USER' },
          create: { id: user.id, email: email, role: 'USER' },
        });
        console.log('Profile created successfully');
      } catch (e) {
        console.error('Prisma error:', e);
      }
    }
}
run();
