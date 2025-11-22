import express from 'express';
import session from 'express-session';
import logger from '#config/logger.js';
import helmet from 'helmet';
import morgan from 'morgan';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import sessionConfig from '#config/session.js';
import authRoutes from '#routes/auth.routes.js';
import securityMiddleware from '#middleware/security.middleware.js';
import usersRoutes from '#routes/users.routes.js';

const app = express();

app.use(helmet());

// CORS configuration for frontend (NextAuth/Clerk)
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    credentials: true, // Allow cookies to be sent
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Session middleware
app.use(session(sessionConfig));

app.use(
  morgan('combined', {
    stream: { write: message => logger.info(message.trim()) },
  })
);

// Health check endpoint - no security middleware (called by monitoring systems)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Apply security middleware to all other routes
app.use(securityMiddleware);

app.get('/', (req, res) => {
  logger.info('Hello from Starter Template!');

  res.status(200).send('Hello from Starter Template!');
});

app.get('/api', (req, res) => {
  res.status(200).json({ message: 'Starter Template API is running!' });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

export default app;
