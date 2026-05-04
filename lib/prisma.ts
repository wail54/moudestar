import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

/**
 * Singleton PrismaClient — Prisma 7 avec @prisma/adapter-pg.
 *
 * DATABASE_URL doit être défini dans les variables d'environnement Vercel.
 * Sans cette variable, toutes les requêtes DB échoueront avec P1001.
 */

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error(
      '[prisma] ❌ DATABASE_URL is not set! ' +
      'Add it in Vercel → Settings → Environment Variables. ' +
      'Value: postgresql://postgres.ftqnvoyjiuggsdlfdlnd:[password]@aws-1-eu-central-1.pooler.supabase.com:6543/postgres'
    );
  }

  // On utilise un placeholder valide si la variable est absente,
  // pour éviter un crash au démarrage — l'erreur surviendra uniquement
  // lors de la première requête DB (PrismaClientKnownRequestError P1001).
  const adapter = new PrismaPg({
    connectionString: connectionString ?? 'postgresql://placeholder:placeholder@localhost:5432/placeholder',
  });

  return new PrismaClient({ adapter });
}

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: ReturnType<typeof createPrismaClient> | undefined;
}

export const prisma = global.prismaGlobal ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.prismaGlobal = prisma;
}
