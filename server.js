/**
 * Women Representative Citizen App — API entry point.
 *
 * Layered architecture:
 *   server.js (bootstrap) -> routes -> controllers -> services -> database/store
 *   cross-cutting: config, middleware/auth, middleware/errorHandler, utils
 *
 * - Listens on 0.0.0.0 so Android devices on the same Wi-Fi can reach it.
 * - No LAN IP is hard-coded; the detected IP is only printed for convenience.
 * - Request logs contain method/path/status only (never tokens or secrets).
 */
const express = require('express');
const cors = require('cors');
const config = require('./config');
const authRoutes = require('./routes/authRoutes');
const citizenRoutes = require('./routes/citizenRoutes');
const bursaryRoutes = require('./routes/bursaryRoutes');
const communityRoutes = require('./routes/communityRoutes');
const adminRoutes = require('./routes/adminRoutes');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const { ensureSeedAdmin } = require('./services/authService');

const app = express();

// Enable CORS for all origins (needed for mobile app communication)
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  })
);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Safe request logging: method + path + status + duration only.
app.use((req, res, next) => {
  const started = Date.now();
  res.on('finish', () => {
    console.log(`[REQ] ${req.method} ${req.path} -> ${res.statusCode} (${Date.now() - started}ms)`);
  });
  next();
});

// Health check (no authentication required).
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Women Rep API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// Domain routers (endpoint paths preserved for the mobile app).
app.use('/api/auth', authRoutes);
app.use('/api/citizen', citizenRoutes);
app.use('/api/bursary', bursaryRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/admin', adminRoutes);

// Centralized 404 + error handling (always JSON, never hangs).
app.use(notFound);
app.use(errorHandler);

// Start server - listen on 0.0.0.0 to accept connections from mobile devices
const server = app.listen(config.port, '0.0.0.0', async () => {
  await ensureSeedAdmin().catch((e) => console.error('[AUTH] Admin seed failed:', e.message));

  const ip = require('os').networkInterfaces();
  let lanIp = 'unknown';

  // Find LAN IP address (display only — never hard-coded into routing).
  for (const name of Object.keys(ip)) {
    for (const configItem of ip[name]) {
      if (configItem.family === 'IPv4' && !configItem.internal) {
        lanIp = configItem.address;
        break;
      }
    }
  }

  console.log('='.repeat(60));
  console.log('Backend server running on port', config.port);
  console.log('Listening on: http://0.0.0.0:' + config.port);
  console.log('LAN IP: http://' + lanIp + ':' + config.port);
  console.log('API Base URL: http://' + lanIp + ':' + config.port + '/api');
  console.log('='.repeat(60));
  console.log('Mobile app should use: http://' + lanIp + ':' + config.port + '/api');
  console.log('='.repeat(60));
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[SERVER] SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('[SERVER] Closed all connections');
    process.exit(0);
  });
});

process.on('uncaughtException', (err) => {
  console.error('[SERVER] Uncaught exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[SERVER] Unhandled rejection at:', promise, 'reason:', reason);
});