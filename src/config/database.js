import 'dotenv/config';
import { Sequelize } from 'sequelize';
import logger from './logger.js';

// Sequelize instance configuration
const sequelize = new Sequelize(
  process.env.DB_NAME || 'postgres',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    dialect: 'postgres',
    logging:
      process.env.NODE_ENV === 'development' ? msg => logger.debug(msg) : false,
    pool: {
      max: parseInt(process.env.DB_POOL_MAX || '5', 10),
      min: parseInt(process.env.DB_POOL_MIN || '0', 10),
      acquire: 30000,
      idle: 10000,
    },
    dialectOptions: {
      // AWS RDS SSL configuration
      ssl:
        process.env.DB_SSL === 'true'
          ? {
              require: true,
              rejectUnauthorized: false, // For AWS RDS
            }
          : false,
    },
  }
);

// Test database connection with retry logic
const testConnection = async (retries = 5, delay = 5000) => {
  for (let i = 0; i < retries; i++) {
    try {
      await sequelize.authenticate();
      logger.info('Database connection established successfully.');
      return;
    } catch (error) {
      const attempt = i + 1;
      logger.warn(`Database connection attempt ${attempt}/${retries} failed: ${error.message}`);
      
      if (attempt === retries) {
        logger.error('Unable to connect to the database after all retries');
        throw error;
      }
      
      logger.info(`Retrying in ${delay / 1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

export { sequelize, testConnection };
