import arcjet, { shield, detectBot, slidingWindow } from '@arcjet/node';

// Determine mode based on environment
// Use LIVE mode only in production with proper reverse proxy (when X-Forwarded-For is available)
// Use DRY_RUN for local development/Docker to avoid IP detection errors
const getMode = () => {
  // Only use LIVE mode if explicitly set to production AND running in actual production
  // (not in Docker without reverse proxy)
  const isProduction = process.env.NODE_ENV === 'production' && process.env.ARCJET_ENV === 'production';
  
  // In Docker/local environments, use DRY_RUN to avoid IP detection errors
  // This allows Arcjet to run without blocking requests when IP is unavailable
  if (isProduction && process.env.ENABLE_ARCJET_LIVE === 'true') {
    return 'LIVE';
  }
  
  return 'DRY_RUN';
};

const mode = getMode();

const aj = arcjet({
  key: process.env.ARCJET_KEY,
  rules: [
    shield({ mode }),
    detectBot({
      mode,
      allow: ['CATEGORY:SEARCH_ENGINE', 'CATEGORY:PREVIEW'],
    }),
    slidingWindow({
      mode,
      interval: '2s',
      max: 5,
    }),
  ],
});

export default aj;
