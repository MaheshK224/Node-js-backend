import { PrismaPg } from '@prisma/adapter-pg';

import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { PrismaClient } from '../generated/prisma/client.js';

/**
 * One shared PrismaClient for the whole app.
 * Creating a client per request would open a new connection pool every time.
 *
 * Prisma 7 talks to Postgres through a "driver adapter" that wraps the `pg` connection pool.
 */
const adapter = new PrismaPg({
  connectionString: env.DATABASE_URL,
  max: env.DB_POOL_MAX,
});

export const prisma = new PrismaClient({
  adapter,
  log: [
    { emit: 'event', level: 'warn' },
    { emit: 'event', level: 'error' },
    ...(env.isDevelopment ? [{ emit: 'event' as const, level: 'query' as const }] : []),
  ],
});

prisma.$on('warn', (e) => logger.warn({ prisma: e }, 'Prisma warning'));
prisma.$on('error', (e) => logger.error({ prisma: e }, 'Prisma error'));
prisma.$on('query', (e) =>
  logger.debug({ query: e.query, params: e.params, durationMs: e.duration }, 'SQL'),
);

/** Verifies the database is reachable. $connect() alone is lazy with driver adapters. */
export async function connectDatabase(): Promise<void> {
  await prisma.$queryRaw`SELECT 1`;
  logger.info('Database connected');
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
  logger.info('Database disconnected');
}
