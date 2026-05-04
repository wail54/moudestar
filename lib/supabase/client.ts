import { createBrowserClient } from "@supabase/ssr";

// Clés publiques Supabase — sûres à embarquer dans le bundle client
// (le "publishable key" est conçu pour être exposé dans le code front-end)
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://ftqnvoyjiuggsdlfdlnd.supabase.co";

const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  "sb_publishable_FT0NilA3bX8g1kfeoAOd2A_2bKoP05E";

export const createClient = () =>
  createBrowserClient(supabaseUrl, supabaseKey);
