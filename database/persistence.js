/**
 * Optional PostgreSQL persistence for the in-memory store.
 *
 * WHY THIS EXISTS
 * ---------------
 * The API keeps its data (users, complaints, ...) in `database/store.js`,
 * which is a plain in-memory object. That is fine for local development but
 * fatal in production: on every restart / redeploy / free-tier spin-down the
 * process memory is wiped, so every registered user disappears and login
 * always fails with 401 "Invalid credentials" (the account simply no longer
 * exists inside the running process).
 *
 * HOW IT FIXES LOGIN
 * ------------------
 * When DATABASE_URL is set, this module:
 *   1. Restores the latest snapshot of the store from PostgreSQL on boot.
 *   2. Saves a fresh snapshot after every write request (debounced), every
 *      60 seconds, and on graceful shutdown.
 * User accounts therefore survive restarts and login keeps working.
 *
 * SECURITY
 * --------
 * - Passwords are stored ONLY as bcrypt hashes (never plaintext) — identical
 *   to the pre-existing in-memory behavior.
 * - Nothing sensitive (passwords, JWT secrets, tokens) is ever logged here.
 *
 * The snapshot approach was chosen over a full relational migration because
 * it keeps every service untouched (`services/*` keep mutating the same
 * in-memory collections) while making the data durable. The Prisma schema in
 * `prisma/schema.prisma` remains the target for a future per-table migration.
 */

const { store } = require('./store');

const SNAPSHOT_TABLE = 'app_state_snapshots';
const SNAPSHOT_KEY = 'store';
const SAVE_DEBOUNCE_MS = 1500;
const SAVE_INTERVAL_MS = 60000;

/** Collection keys persisted/restored (mirrors database/store.js). */
const COLLECTION_KEYS = [
  'users',
  'complaints',
  'announcements',
  'notifications',
  'projects',
  'events',
  'bursaryApplications',
];

let client = null;
let enabled = false;
let saveTimer = null;
let saveInterval = null;
let saving = false;
let pendingSave = false;
let lastSaveAt = null;
let lastError = null;

function isEnabled() {
  return enabled;
}

/** True when the host is local (no TLS needed). */
function isLocalHost(host) {
  if (!host) return true;
  const h = String(host).toLowerCase();
  return (
    h === 'localhost' ||
    h === '127.0.0.1' ||
    h === '::1' ||
    h === '[::1]' ||
    // Render internal networking: plain node name (no dots) or *.render.internal
    !h.includes('.') ||
    h.endsWith('.render.internal')
  );
}

function connectionOptionsFromUrl(rawUrl) {
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch (e) {
    throw new Error('DATABASE_URL is not a valid URL');
  }
  const host = parsed.hostname;
  const options = {
    host,
    port: parsed.port ? parseInt(parsed.port, 10) : 5432,
    database: parsed.pathname ? parsed.pathname.replace(/^\//, '') : undefined,
    user: parsed.username ? decodeURIComponent(parsed.username) : undefined,
    password: parsed.password ? decodeURIComponent(parsed.password) : undefined,
    connectionTimeoutMillis: 10000,
  };
  // Managed providers (Render external, Neon, Supabase, RDS, ...) require TLS;
  // local/Render-internal connections do not. Certificate identity is not
  // enforced (rejectUnauthorized: false) because free-tier providers rotate
  // certificates; the connection is still encrypted.
  if (!isLocalHost(host)) {
    options.ssl = { rejectUnauthorized: false };
  }
  return options;
}

/**
 * Restore a snapshot into the in-memory store. Only well-formed collections
 * are accepted so a corrupt/partial snapshot can never break the runtime.
 */
function restoreSnapshot(data) {
  if (!data || typeof data !== 'object') return false;
  let restored = 0;
  COLLECTION_KEYS.forEach((key) => {
    if (Array.isArray(data[key])) {
      store[key] = data[key];
      restored += data[key].length;
    }
  });
  if (data.dashboardData && typeof data.dashboardData === 'object') {
    store.dashboardData = data.dashboardData;
  }
  return restored > 0;
}

function serializeSnapshot() {
  const snapshot = {
    savedAt: new Date().toISOString(),
  };
  COLLECTION_KEYS.forEach((key) => {
    snapshot[key] = store[key];
  });
  snapshot.dashboardData = store.dashboardData;
  return snapshot;
}

/**
 * Connect to PostgreSQL, ensure the snapshot table exists, and restore the
 * latest snapshot into the in-memory store. Never throws: on any failure the
 * API keeps running in-memory-only (previous behavior) with a loud warning.
 */
async function init() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.warn(
      '[DB] DATABASE_URL is not set — running IN-MEMORY ONLY. ' +
        'All accounts and data will be LOST on every restart/redeploy ' +
        '(this is why logins can fail with "Invalid credentials" in production).'
    );
    return;
  }

  let ClientFactory;
  try {
    ({ Client: ClientFactory } = require('pg'));
  } catch (e) {
    console.error('[DB] The "pg" package is not installed — persistence disabled:', e.message);
    return;
  }

  try {
    const options = connectionOptionsFromUrl(databaseUrl);
    client = new ClientFactory(options);
    await client.connect();

    await client.query(
      `CREATE TABLE IF NOT EXISTS ${SNAPSHOT_TABLE} (
         key TEXT PRIMARY KEY,
         data JSONB NOT NULL,
         updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
       )`
    );

    const result = await client.query(
      `SELECT data FROM ${SNAPSHOT_TABLE} WHERE key = $1 LIMIT 1`,
      [SNAPSHOT_KEY]
    );

    if (result.rows.length > 0 && restoreSnapshot(result.rows[0].data)) {
      const counts = COLLECTION_KEYS.map((k) => `${k}=${store[k].length}`).join(', ');
      console.log(`[DB] Restored previous data snapshot from PostgreSQL (${counts})`);
    } else {
      console.log('[DB] No previous snapshot found — starting with an empty store');
    }

    enabled = true;

    // Periodic safety net: coalesced through scheduleSave().
    saveInterval = setInterval(() => scheduleSave('periodic'), SAVE_INTERVAL_MS);
    saveInterval.unref();

    console.log('[DB] Persistence ENABLED — data now survives restarts (PostgreSQL)');
  } catch (e) {
    lastError = e.message;
    client = null;
    enabled = false;
    console.error(
      '[DB] Could not connect to PostgreSQL — falling back to IN-MEMORY ONLY. ' +
        'Check DATABASE_URL. Reason:',
      e.message
    );
  }
}

/** Save the current store to PostgreSQL immediately. Returns true on success. */
async function saveNow() {
  if (!enabled || !client) return false;
  if (saving) {
    // A save is in flight; coalesce this request into a follow-up save.
    pendingSave = true;
    return true;
  }
  saving = true;
  try {
    const data = serializeSnapshot();
    await client.query(
      `INSERT INTO ${SNAPSHOT_TABLE} (key, data, updated_at)
       VALUES ($1, $2, now())
       ON CONFLICT (key) DO UPDATE
         SET data = EXCLUDED.data, updated_at = now()`,
      [SNAPSHOT_KEY, JSON.stringify(data)]
    );
    lastSaveAt = new Date().toISOString();
    lastError = null;
    return true;
  } catch (e) {
    lastError = e.message;
    console.error('[DB] Snapshot save failed:', e.message);
    return false;
  } finally {
    saving = false;
    if (pendingSave) {
      pendingSave = false;
      scheduleSave('pending');
    }
  }
}

/** Debounced save — multiple writes within the window produce one save. */
function scheduleSave(reason) {
  if (!enabled) return;
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveTimer = null;
    saveNow().catch(() => {}); // errors are logged inside saveNow
  }, SAVE_DEBOUNCE_MS);
  if (saveTimer.unref) saveTimer.unref();
}

/**
 * Express middleware: schedules a snapshot save after every successful
 * non-GET request (all writes go through the API, so this captures every
 * mutation made by any service without touching the service layer).
 */
function persistOnWrite() {
  return (req, res, next) => {
    if (!enabled) return next();
    res.on('finish', () => {
      if (req.method !== 'GET') {
        scheduleSave(`write ${req.method} ${req.path}`);
      }
    });
    next();
  };
}

/** Status for startup/health logging (contains no secrets). */
function status() {
  return {
    enabled,
    lastSaveAt,
    lastError,
  };
}

/** Flush pending data and close the database connection (used on shutdown). */
async function shutdown() {
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }
  if (saveInterval) {
    clearInterval(saveInterval);
    saveInterval = null;
  }
  if (enabled && client) {
    await saveNow();
    try {
      await client.end();
    } catch (e) {
      // ignore — the process is exiting anyway
    }
    client = null;
    enabled = false;
  }
}

module.exports = {
  init,
  saveNow,
  scheduleSave,
  persistOnWrite,
  isEnabled,
  status,
  shutdown,
};