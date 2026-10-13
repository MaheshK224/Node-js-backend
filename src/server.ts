import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { connectDatabase, disconnectDatabase } from './db/prisma.js';

const SHUTDOWN_TIMEOUT_MS = 10_000;

async function bootstrap(): Promise<void> {
  // Fail fast: don't accept traffic if the database is unreachable.
  await connectDatabase();

  const app = createApp();
  const server = app.listen(env.PORT, () => {
    logger.info(`Server running on http://localhost:${env.PORT} [${env.NODE_ENV}]`);
    if (env.SWAGGER_ENABLED) {
      logger.info(`API docs at http://localhost:${env.PORT}/api-docs`);
    }
  });

  /**
   * Graceful shutdown: on Ctrl+C (SIGINT) or `docker stop` / Kubernetes (SIGTERM),
   * stop accepting new requests, let in-flight requests finish, then close the DB pool.
   */
  let shuttingDown = false;
  const shutdown = (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info(`${signal} received, shutting down gracefully...`);

    const forceExit = setTimeout(() => {
      logger.error('Could not close connections in time, forcing shutdown');
      process.exit(1);
    }, SHUTDOWN_TIMEOUT_MS);
    forceExit.unref();

    server.close(async (err) => {
      if (err) logger.error({ err }, 'Error while closing HTTP server');
      await disconnectDatabase();
      logger.info('Shutdown complete');
      process.exit(err ? 1 : 0);
    });
    server.closeIdleConnections();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

// Crash on bugs that would otherwise leave the app in an unknown state.
// A process manager (Docker restart policy, Kubernetes, PM2) starts it again.
process.on('unhandledRejection', (reason) => {
  logger.fatal({ err: reason }, 'Unhandled promise rejection');
  process.exit(1);
});
process.on('uncaughtException', (err) => {
  logger.fatal({ err }, 'Uncaught exception');
  process.exit(1);
});

bootstrap().catch((err: unknown) => {
  logger.fatal({ err }, 'Failed to start server');
  process.exit(1);
});
