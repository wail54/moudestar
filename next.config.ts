import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      // Supabase Storage — hostname exact du projet
      { protocol: 'https', hostname: 'ftqnvoyjiuggsdlfdlnd.supabase.co' },
      // Fallback wildcards
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: '*.supabase.in' },
    ],
    // Désactiver l'optimisation pour les images Supabase Storage (URLs déjà optimisées)
    unoptimized: false,
  },

  devIndicators: false,

  // Prisma 7 + @prisma/adapter-pg : ces packages utilisent des APIs Node.js
  // qui ne sont pas disponibles dans l'Edge Runtime — on les exclut du bundle.
  serverExternalPackages: [
    '@prisma/client',
    '@prisma/adapter-pg',
    'pg',
  ],
};

export default nextConfig;
