import { existsSync } from 'node:fs';

import { config as loadEnv } from 'dotenv';
import { defineConfig } from 'prisma/config';

// Load the same .env.<NODE_ENV> file the app uses, so `NODE_ENV=qa prisma migrate deploy`
// targets the QA database. Real environment variables (Docker, CI) always win.
const envFile = `.env.${process.env.NODE_ENV ?? 'development'}`;
if (existsSync(envFile)) {
  loadEnv({ path: envFile, quiet: true });
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    // Not wrapped in env() so `prisma generate` works without a database (e.g. Docker build).
    url: process.env.DATABASE_URL,
  },
});
