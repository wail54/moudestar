import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

/**
 * Crée un client Supabase côté navigateur.
 * Retourne null si les variables d'environnement sont absentes
 * (évite le crash au runtime si NEXT_PUBLIC_* ne sont pas set au build).
 */
export const createClient = () => {
  if (!supabaseUrl || !supabaseKey) {
    // Env vars absentes — pas de crash, les features auth seront désactivées
    console.warn("[supabase/client] Missing env vars — auth disabled");
    return null;
  }
  return createBrowserClient(supabaseUrl, supabaseKey);
};
