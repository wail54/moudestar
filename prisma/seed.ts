/**
 * Seed script — insère les 8 produits par défaut de Moudestar dans Supabase.
 * Lancer avec : npx tsx prisma/seed.ts
 * ou via     : npx prisma db seed
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

function makeStock(s = 10, m = 12, l = 8, xl = 5) {
  return { stockS: s, stockM: m, stockL: l, stockXL: xl };
}

const defaultProducts = [
  {
    name: "T-Shirt Essentiel Blanc",
    description:
      "T-shirt classique en coton bio ultra-doux. Coupe droite et col rond côtelé pour un confort absolu.",
    price: 35,
    image:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&q=80&auto=format&fit=crop",
    category: "Vêtements",
    featured: true,
    ...makeStock(15, 20, 15, 10),
  },
  {
    name: "Chemise Minimaliste Noire",
    description:
      "Chemise en popeline de coton légère. Coupe élégante, col classique et boutons dissimulés.",
    price: 89,
    image:
      "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=600&q=80&auto=format&fit=crop",
    category: "Vêtements",
    featured: true,
    ...makeStock(5, 12, 8, 4),
  },
  {
    name: "Sweat à Capuche Gris",
    description:
      "Sweat à capuche en molleton brossé. Un intemporel chaud et confortable, doté d'une poche kangourou.",
    price: 75,
    image:
      "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600&q=80&auto=format&fit=crop",
    category: "Vêtements",
    featured: true,
    ...makeStock(8, 15, 12, 6),
  },
  {
    name: "Veste en Jean Indigo",
    description:
      "Veste en denim rigide avec surpiqûres contrastées. Coupe vintage modernisée.",
    price: 120,
    image:
      "https://images.unsplash.com/photo-1601333144130-8cbb312386b6?w=600&q=80&auto=format&fit=crop",
    category: "Vêtements",
    featured: false,
    ...makeStock(4, 7, 5, 2),
  },
  {
    name: "Sneakers Épurées Blanches",
    description:
      "Baskets basses en cuir pleine fleur. Semelle en caoutchouc minimaliste et lacets ton sur ton.",
    price: 145,
    image:
      "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=600&q=80&auto=format&fit=crop",
    category: "Chaussures",
    featured: true,
    ...makeStock(3, 5, 4, 2),
  },
  {
    name: "Casquette Signature Noire",
    description:
      "Casquette classique en toile de coton structurée, ajustable à l'arrière.",
    price: 30,
    image:
      "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=600&q=80&auto=format&fit=crop",
    category: "Accessoires",
    featured: false,
    ...makeStock(0, 0, 0, 0),
  },
  {
    name: "Montre Minimaliste Argent",
    description:
      "Montre avec boîtier en acier inoxydable et cadran épuré. Mouvement à quartz de précision.",
    price: 160,
    image:
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80&auto=format&fit=crop",
    category: "Accessoires",
    featured: false,
    ...makeStock(0, 0, 0, 0),
  },
  {
    name: "Sac à Bandoulière",
    description:
      "Sac en cuir premium avec intérieur doublé et bandoulière large ajustable.",
    price: 95,
    image:
      "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&q=80&auto=format&fit=crop",
    category: "Accessoires",
    featured: false,
    ...makeStock(0, 0, 0, 0),
  },
];

async function main() {
  console.log("🌱 Démarrage du seed...");

  // Vider les produits existants pour éviter les doublons
  const existing = await prisma.product.count();
  if (existing > 0) {
    console.log(
      `⚠️  ${existing} produit(s) déjà en base. Le seed ne sera pas relancé.`
    );
    console.log(
      "   Pour réinitialiser : npx prisma db execute --file prisma/reset.sql"
    );
    return;
  }

  for (const product of defaultProducts) {
    const created = await prisma.product.create({ data: product });
    console.log(`✅ Créé : ${created.name} (${created.id})`);
  }

  console.log(`\n✨ Seed terminé : ${defaultProducts.length} produits insérés.`);
}

main()
  .catch((e) => {
    console.error("❌ Erreur seed :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
