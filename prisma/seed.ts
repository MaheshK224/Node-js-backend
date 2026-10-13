/**
 * Fills the database with sample data for local development.
 * Run: npm run db:seed   (also runs automatically after `npm run db:reset`)
 *
 * Uses upsert so it can be run many times without creating duplicates ("idempotent").
 */
import { logger } from '../src/config/logger.js';
import { disconnectDatabase, prisma } from '../src/db/prisma.js';

const categories = [
  { name: 'Electronics', description: 'Phones, laptops and accessories' },
  { name: 'Books', description: 'Printed and digital books' },
  { name: 'Home & Kitchen', description: 'Appliances and kitchenware' },
];

const products = [
  {
    sku: 'APL-IP16-128',
    name: 'iPhone 16 128GB',
    price: '799.99',
    stock: 25,
    category: 'Electronics',
  },
  {
    sku: 'SMS-S25-256',
    name: 'Samsung Galaxy S25 256GB',
    price: '899.00',
    stock: 12,
    category: 'Electronics',
  },
  {
    sku: 'DEL-XPS13',
    name: 'Dell XPS 13 Laptop',
    price: '1199.50',
    stock: 5,
    category: 'Electronics',
  },
  {
    sku: 'SNY-WH1000XM5',
    name: 'Sony WH-1000XM5 Headphones',
    price: '349.99',
    stock: 40,
    category: 'Electronics',
  },
  { sku: 'BK-CLEAN-CODE', name: 'Clean Code', price: '32.49', stock: 100, category: 'Books' },
  {
    sku: 'BK-PRAG-PROG',
    name: 'The Pragmatic Programmer',
    price: '41.99',
    stock: 60,
    category: 'Books',
  },
  {
    sku: 'BK-DDIA',
    name: 'Designing Data-Intensive Applications',
    price: '45.00',
    stock: 0,
    category: 'Books',
  },
  {
    sku: 'HK-AIRFRY-5L',
    name: 'Air Fryer 5L',
    price: '89.99',
    stock: 18,
    category: 'Home & Kitchen',
  },
  {
    sku: 'HK-KETTLE-17',
    name: 'Electric Kettle 1.7L',
    price: '24.95',
    stock: 33,
    category: 'Home & Kitchen',
  },
];

async function main(): Promise<void> {
  const categoryIds = new Map<string, string>();

  for (const category of categories) {
    const saved = await prisma.category.upsert({
      where: { name: category.name },
      update: { description: category.description },
      create: category,
    });
    categoryIds.set(saved.name, saved.id);
  }

  for (const { category, ...product } of products) {
    const categoryId = categoryIds.get(category);
    if (!categoryId) throw new Error(`Unknown category ${category}`);

    await prisma.product.upsert({
      where: { sku: product.sku },
      update: { ...product, categoryId },
      create: { ...product, categoryId },
    });
  }

  logger.info(`Seeded ${categories.length} categories and ${products.length} products`);
}

main()
  .catch((err: unknown) => {
    logger.error({ err }, 'Seeding failed');
    process.exitCode = 1;
  })
  .finally(() => disconnectDatabase());
