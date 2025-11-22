import aj from '#config/arcjet.js';
import logger from '#config/logger.js';
import { slidingWindow } from '@arcjet/node';
import { isMissingUserAgent } from '@arcjet/inspect';

const securityMiddleware = async (req, res, next) => {
  try {
    const role = req.user?.role || 'guest';

    let limit;

    switch (role) {
      case 'admin':
        limit = 20;
        break;
      case 'user':
        limit = 10;
        break;
      case 'guest':
        limit = 5;
        break;
    }

    const client = aj.withRule(
      slidingWindow({
        mode: 'LIVE',
        interval: '1m',
        max: limit,
        name: `${role}-rate-limit`,
      })
    );

    const decision = await client.protect(req);

    // Check for error results and log them (fail open per Arcjet best practices)
    for (const result of decision.results) {
      if (result.reason.isError()) {
        logger.warn('Arcjet error during rule evaluation', {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          path: req.path,
          error: result.reason.message,
        });
      }
    }

    // Check for missing User-Agent header (requests without it cannot be properly identified)
    // Per Arcjet best practices, we should block these requests
    if (decision.results.some(isMissingUserAgent)) {
      logger.warn('Request missing User-Agent header', {
        ip: req.ip,
        path: req.path,
        method: req.method,
      });

      return res.status(400).json({
        error: 'Bad Request',
        message: 'User-Agent header is required',
      });
    }

    if (decision.isDenied() && decision.reason.isBot()) {
      logger.warn('Bot request blocked', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
      });

      return res.status(403).json({
        error: 'Forbidden',
        message: 'Automated requests are not allowed',
      });
    }

    if (decision.isDenied() && decision.reason.isShield()) {
      logger.warn('Shield Blocked request', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
        method: req.method,
      });

      return res.status(403).json({
        error: 'Forbidden',
        message: 'Request blocked by security policy',
      });
    }

    if (decision.isDenied() && decision.reason.isRateLimit()) {
      logger.warn('Rate limit exceeded', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
      });

      return res
        .status(403)
        .json({ error: 'Forbidden', message: 'Too many requests' });
    }

    next();
  } catch (e) {
    console.error('Arcjet middleware error:', e);
    res.status(500).json({
      errro: 'Internal server error',
      message: 'Something went wrong with security middleware',
    });
  }
};
export default securityMiddleware;
