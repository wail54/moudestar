import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      // Ajouter d'autres domaines d'images ici si nécessaire
    ],
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
