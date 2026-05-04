import { defineConfig } from "prisma/config";

/**
 * prisma.config.ts — Prisma 7
 *
 * DATABASE_URL est utilisé pour toutes les opérations CLI (generate, db push…).
 * On utilise une seule URL pour éviter la dépendance à DIRECT_URL
 * qui n'est pas disponible pendant le postinstall de Vercel.
 *
 * Note : `prisma generate` ne se connecte pas à la DB, mais Prisma 7
 * charge quand même ce fichier. On utilise donc une valeur par défaut
 * si DATABASE_URL est absent (cas de `postinstall` sans env vars).
 */
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Fallback vide si l'env var est absent (generate ne se connecte pas)
    url: process.env.DATABASE_URL ?? "postgresql://localhost:5432/placeholder",
  },
});
