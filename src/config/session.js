import 'dotenv/config';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import pg from 'pg';
import logger from './logger.js';

const PgSession = connectPgSimple(session);

// Create PostgreSQL pool for session store
const pgPool = new pg.Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'postgres',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  ssl:
    process.env.DB_SSL === 'true'
      ? {
          require: true,
          rejectUnauthorized: false,
        }
      : false,
});

// Session configuration
export const sessionConfig = {
  store: new PgSession({
    pool: pgPool,
    tableName: 'session', // Table name for storing sessions
    createTableIfMissing: true, // Auto-create session table
  }),
  secret:
    process.env.SESSION_SECRET || 'your-session-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    httpOnly: true, // Prevent XSS attacks
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // Cross-origin for production
  },
  name: 'sessionId', // Custom session cookie name
};

// Test session store connection
export const testSessionStore = async () => {
  try {
    await pgPool.query('SELECT NOW()');
    logger.info('Session store connected successfully');
  } catch (error) {
    logger.error('Session store connection failed:', error);
    throw error;
  }
};

export default sessionConfig;
