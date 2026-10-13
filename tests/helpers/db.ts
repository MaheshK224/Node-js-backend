import { prisma } from '../../src/db/prisma.js';

/** Empties all tables between integration tests. Only ever runs against the test database. */
export async function resetDatabase(): Promise<void> {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('resetDatabase() may only run with NODE_ENV=test');
  }
  await prisma.$executeRaw`TRUNCATE TABLE products, categories RESTART IDENTITY CASCADE`;
}

export { prisma };
