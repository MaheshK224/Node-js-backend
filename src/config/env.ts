import { existsSync } from 'node:fs';

import { config as loadEnv } from 'dotenv';
import { z } from 'zod';

/**
 * Loads `.env.<NODE_ENV>` and validates every variable with zod.
 * If something is missing or wrong the app crashes at startup with a clear message
 * ("fail fast") instead of failing later on the first request.
 *
 * Variables already set in the real environment (Docker, CI, cloud) are NOT overwritten.
 */
const nodeEnv = process.env.NODE_ENV ?? 'development';
const envFile = `.env.${nodeEnv}`;

if (existsSync(envFile)) {
  loadEnv({ path: envFile, quiet: true });
}

const booleanString = z
  .enum(['true', 'false'])
  .default('false')
  .transform((value) => value === 'true');

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'qa', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),

  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
  DB_POOL_MAX: z.coerce.number().int().positive().default(10),

  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),

  CORS_ORIGINS: z
    .string()
    .default('')
    .transform((value) =>
      value
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean),
    ),

  RATE_LIMIT_WINDOW_MS: z.coerce
    .number()
    .int()
    .positive()
    .default(15 * 60 * 1000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(300),

  SWAGGER_ENABLED: booleanString,
  TRUST_PROXY: z.coerce.number().int().min(0).default(0),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // Logger is not available yet (it depends on env), so console is fine here.
  // eslint-disable-next-line no-console
  console.error(`Invalid environment variables (${envFile}):\n${z.prettifyError(parsed.error)}`);
  process.exit(1);
}

export const env = Object.freeze({
  ...parsed.data,
  isProduction: parsed.data.NODE_ENV === 'production',
  isDevelopment: parsed.data.NODE_ENV === 'development',
  isTest: parsed.data.NODE_ENV === 'test',
});

export type Env = typeof env;
