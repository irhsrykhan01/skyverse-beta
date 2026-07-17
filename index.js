import { config } from './src/config/config.js';
import { logger } from './src/utils/logger.js';
import { Database } from './src/database/db.js';
import { loadCommands } from './src/plugins/loader.js';
import { startSocket } from './src/core/client.js';

function printBanner() {
  console.log('');
  console.log(`  ${config.botName} — Stage 1`);
  console.log('  Backend WhatsApp Multi-Device Bot Framework');
  console.log('');
}

function registerShutdownHooks(db) {
  const shutdown = async (signal) => {
    logger.warn(`Received ${signal}. Shutting down gracefully...`);
    try {
      await db.save();
    } catch (err) {
      logger.error(`Failed to save database during shutdown: ${err.message}`);
    }
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

async function bootstrap() {
  printBanner();

  logger.info('Initializing database...');
  const db = await Database.init(config.databasePath);
  logger.success('Database ready.');

  logger.info('Loading commands...');
  const { commands, aliases } = await loadCommands(logger);
  logger.success(`Loaded ${commands.size} command(s): ${[...commands.keys()].join(', ')}`);

  logger.info('Starting WhatsApp connection...');
  await startSocket({ db, commands, aliases });

  registerShutdownHooks(db);
}

bootstrap().catch((err) => {
  logger.error(`Fatal error during bootstrap: ${err.stack || err.message}`);
  process.exit(1);
});
