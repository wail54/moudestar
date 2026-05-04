import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

/**
 * Singleton PrismaClient pour Next.js — Prisma 7 avec adapter pg.
 * Résistant à l'absence de DATABASE_URL (ex : build-time sans env vars).
 */

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    // En prod sans DATABASE_URL : retourner un client factice qui throw
    // uniquement lors des vraies requêtes DB (pas au boot).
    console.warn('[prisma] DATABASE_URL is not set — DB calls will fail');
  }

  const adapter = new PrismaPg({
    connectionString: connectionString ?? 'postgresql://localhost:5432/placeholder',
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
