import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Clés publiques Supabase — sûres à embarquer (publishable key)
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://ftqnvoyjiuggsdlfdlnd.supabase.co";

const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  "sb_publishable_FT0NilA3bX8g1kfeoAOd2A_2bKoP05E";

export const createClient = (cookieStore: Awaited<ReturnType<typeof cookies>>) => {
  return createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Appelé depuis un Server Component — lecture seule, ignoré.
            // Le middleware se charge de rafraîchir la session.
          }
        },
      },
    },
  );
};
