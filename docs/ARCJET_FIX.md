# Arcjet Bot Detection User-Agent Header Fix

## Problem

The application was logging errors: `"Failure running rule: BOT due to bot detection requires user-agent header"`

This occurred because:

1. Health check requests (`/health`) were being made without User-Agent headers (by Docker health checks, monitoring systems, etc.)
2. Arcjet's BOT detection rule cannot identify bots without the User-Agent header, resulting in ERROR results
3. The middleware wasn't properly handling these error cases per Arcjet best practices

## Solution

Implemented Arcjet best practices for handling missing User-Agent headers:

### 1. **Updated Security Middleware** (`src/middleware/security.middleware.js`)

- Added `isMissingUserAgent` import from `@arcjet/inspect`
- Added error result logging (fail open per Arcjet best practices)
- Added explicit check for missing User-Agent headers using `isMissingUserAgent()`
- Returns 400 Bad Request for requests without User-Agent header
- Logs all Arcjet errors for monitoring and debugging

### 2. **Updated App Configuration** (`src/app.js`)

- Moved `/health` endpoint BEFORE security middleware
- Health check endpoint is now excluded from bot detection
- All other routes are protected by security middleware

## Arcjet Best Practices Applied

✅ **Fail Open**: Errors are logged but don't block requests (except missing User-Agent)
✅ **User-Agent Validation**: Requests without User-Agent headers are explicitly blocked with 400 status
✅ **Proper Error Handling**: All error results are logged with context (IP, path, error message)
✅ **Bot Detection**: Still active for all protected routes with proper identification
✅ **Monitoring Friendly**: Health checks work without User-Agent (required for Docker/K8s)

## Key Changes

### Security Middleware

```javascript
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

// Check for missing User-Agent header
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
```

### App Configuration

```javascript
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
```

## Testing

The errors should now be resolved:

1. Health check requests will succeed without User-Agent headers
2. Other requests without User-Agent will receive 400 Bad Request
3. Bot detection continues to work for legitimate requests
4. All errors are properly logged for monitoring

## References

- [Arcjet Bot Protection Concepts](https://docs.arcjet.com/bot-protection/concepts/)
- [Arcjet Bot Protection Reference](https://docs.arcjet.com/bot-protection/reference/)
- [Arcjet Error Handling](https://docs.arcjet.com/bot-protection/reference/#error-handling)
