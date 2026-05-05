const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DIRECT_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function migrate() {
  console.log('🚀 Début de la migration des données...\n');

  console.log('📸 Note: ancienne colonne image supprimée — les images[] sont vides. Renseignez-les via l\'admin.\n');

  // ── Créer les ProductVariants (colonnes stockS/M/L/XL déjà supprimées, stock = 0) ─────
  console.log('📦 Création des variantes S/M/L/XL pour tous les produits...');

  const products = await prisma.product.findMany({ select: { id: true } });
  let variantsCreated = 0;

  for (const p of products) {
    for (const size of ['S', 'M', 'L', 'XL']) {
      try {
        await prisma.productVariant.upsert({
          where: { productId_color_size: { productId: p.id, color: null, size } },
          update: {},
          create: { productId: p.id, color: null, size, stock: 0 },
        });
        variantsCreated++;
      } catch (e) {
        // ignore si déjà existant
      }
    }
    // Marquer sizeType = CLOTHING pour les produits existants
    await prisma.product.update({
      where: { id: p.id },
      data: { sizeType: 'CLOTHING' },
    });
  }

  console.log(`   ✅ ${variantsCreated} variantes créées (stock 0 — à remettre à jour dans l'admin).\n`);
  console.log('🎉 Migration terminée avec succès !');
}

migrate()
  .catch((e) => {
    console.error('❌ Erreur de migration :', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
