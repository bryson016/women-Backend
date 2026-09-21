/**
 * Centralized backend configuration.
 * Reads environment variables once and exposes safe defaults for development.
 * Real secrets must come from `backend/.env` (gitignored) or the host
 * environment — never hard-code them here.
 */
require('dotenv').config();

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  // PostgreSQL connection used by database/persistence.js to make accounts
  // and data survive restarts. Null => in-memory only (development fallback).
  databaseUrl: process.env.DATABASE_URL || null,
  // Verbose auth diagnostics (never logs passwords/hashes/secrets/tokens).
  // Default: on outside production; in production set DEBUG_AUTH=true to
  // temporarily diagnose login failures.
  debugAuth:
    process.env.DEBUG_AUTH === 'true' ||
    (process.env.NODE_ENV || 'development') !== 'production',
  jwt: {
    // In production a strong secret is mandatory (see .env.example).
    secret: process.env.JWT_SECRET || 'dev-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '10', 10),
  adminSeed: {
    username: process.env.ADMIN_SEED_USERNAME || null,
    password: process.env.ADMIN_SEED_PASSWORD || null,
  },
};

if (
  config.env === 'production' &&
  (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'dev-secret-key')
) {
  console.warn('[CONFIG] WARNING: running in production without a strong JWT_SECRET. Set JWT_SECRET.');
}

module.exports = config;