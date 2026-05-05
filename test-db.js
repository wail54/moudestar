const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const orders = await prisma.order.findMany({ orderBy: { date: 'desc' }, take: 1 });
  console.log(orders);
}
main().catch(console.error).finally(() => prisma.$disconnect());
