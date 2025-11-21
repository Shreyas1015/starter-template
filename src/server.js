import app from './app.js';
import { testConnection } from './config/database.js';
import { testSessionStore } from './config/session.js';
import syncDatabase from './config/sync-db.js';
import logger from './config/logger.js';

const PORT = process.env.PORT || 3000;

// Initialize database and start server
const startServer = async () => {
  try {
    // Test session store connection
    await testSessionStore();

    // Sync database (includes connection test)
    if (process.env.NODE_ENV === 'development') {
      await syncDatabase({ alter: true });
    } else {
      // In production, just verify connection without altering
      await testConnection();
      logger.info('Production mode: Skipping database sync');
    }

    // Start server
    app.listen(PORT, () => {
      logger.info(`Server listening on http://localhost:${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
