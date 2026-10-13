import { pino } from 'pino';

import { env } from './env.js';

/**
 * Application logger.
 * - development: colourful, human readable output (pino-pretty)
 * - qa / production: one JSON object per line, ready for log tools (ELK, Datadog, CloudWatch...)
 *
 * Use it instead of console.log:  logger.info({ productId }, 'Product created');
 */
export const logger = pino({
  level: env.LOG_LEVEL,
  base: { env: env.NODE_ENV },
  timestamp: pino.stdTimeFunctions.isoTime,
  // Never write secrets to logs.
  redact: {
    paths: ['req.headers.authorization', 'req.headers.cookie', '*.password', '*.token'],
    censor: '[REDACTED]',
  },
  ...(env.isDevelopment && {
    transport: {
      target: 'pino-pretty',
      options: { colorize: true, translateTime: 'SYS:HH:MM:ss', ignore: 'pid,hostname,env' },
    },
  }),
});
