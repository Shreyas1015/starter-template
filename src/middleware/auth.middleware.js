import logger from '#config/logger.js';

/**
 * Session-based authentication middleware
 * Checks if user is authenticated via session
 * Compatible with NextAuth, Clerk, and other frontend auth libraries
 */
export const authenticateSession = (req, res, next) => {
  try {
    // Check if session exists and has user data
    if (!req.session || !req.session.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'No active session found',
      });
    }

    // Attach user to request object
    req.user = req.session.user;

    logger.info(`User authenticated: ${req.user.email} (${req.user.role})`);
    next();
  } catch (e) {
    logger.error('Authentication error:', e);
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Error during authentication',
    });
  }
};

export const requireRole = allowedRoles => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Authentication required',
          message: 'User not authenticated',
        });
      }

      if (!allowedRoles.includes(req.user.role)) {
        logger.warn(
          `Access denied for user ${req.user.email} with role ${req.user.role}. Required: ${allowedRoles.join(', ')}`
        );
        return res.status(403).json({
          error: 'Access denied',
          message: 'Insufficient permissions',
        });
      }

      next();
    } catch (e) {
      logger.error('Role verification error:', e);
      return res.status(500).json({
        error: 'Internal server error',
        message: 'Error during role verification',
      });
    }
  };
};
