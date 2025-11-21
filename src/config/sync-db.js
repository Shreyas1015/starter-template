import 'dotenv/config';
import { sequelize, testConnection } from './database.js';
import logger from './logger.js';

/**
 * Synchronize database models with the database
 * This will create tables if they don't exist
 *
 * Options:
 * - force: true - Drop tables and recreate (WARNING: Data loss!)
 * - alter: true - Alter tables to match models (safer for development)
 */
const syncDatabase = async (options = {}) => {
  try {
    // Test connection first
    await testConnection();

    // Sync all models
    await sequelize.sync(options);

    logger.info('Database synchronized successfully');

    if (options.force) {
      logger.warn('Database was force synced - all data was dropped!');
    } else if (options.alter) {
      logger.info('Database was altered to match models');
    }

    return true;
  } catch (error) {
    logger.error('Error synchronizing database:', error);
    throw error;
  }
};

// If run directly from command line
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const force = args.includes('--force');
  const alter = args.includes('--alter');

  syncDatabase({ force, alter })
    .then(() => {
      logger.info('Database sync completed');
      process.exit(0);
    })
    .catch(error => {
      logger.error('Database sync failed:', error);
      process.exit(1);
    });
}

export default syncDatabase;
