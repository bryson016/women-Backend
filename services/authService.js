/**
 * Authentication service.
 * - Passwords are stored ONLY as bcrypt hashes (never plain text).
 * - The `role` is always assigned server-side; client-supplied roles are
 *   ignored so a user can never self-register as admin by modifying the app.
 * - Responses never include password material.
 * - Identity model: callers authenticate with an email address OR a phone
 *   number (older clients may still send a `username`, which keeps working
 *   for accounts created before email/phone login existed). The internal
 *   `username` column is derived deterministically from the identifier, so
 *   the existing UNIQUE constraint keeps preventing duplicate accounts
 *   without any schema change.
 */
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');
const { prisma } = require('../prisma/client');
const { sanitizeUser } = require('../middleware/auth');
const { ApiError } = require('../utils/asyncHandler');

const CITIZEN_ROLE = 'citizen';
const ADMIN_ROLE = 'admin';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(value) {
  const v = String(value || '').trim().toLowerCase();
  return EMAIL_REGEX.test(v) ? v : null;
}

function normalizePhone(value) {
  const digits = String(value || '').replace(/\D/g, '');
  let d = digits;
  if (/^0\d{9}$/.test(d)) d = '254' + d.slice(1);
  else if (/^[17]\d{8}$/.test(d)) d = '254' + d;
  else if (/^2540\d{8}$/.test(d)) d = '254' + d.slice(4);
  if (!/^\d{7,15}$/.test(d)) return null;
  return d;
}

function asIdentifier(value) {
  const v = String(value || '').trim();
  if (!v) return null;
  if (v.includes('@')) {
    const email = normalizeEmail(v);
    return email ? { kind: 'email', value: email } : { kind: 'bad-email', value: v };
  }
  const phone = normalizePhone(v);
  return phone ? { kind: 'phone', value: phone } : { kind: 'bad-phone', value: v };
}

/**
 * Resolves the caller's identity from a flexible payload.
 * Accepts { identifier } (new clients), { email } / { phone } (explicit),
 * or legacy { username }. Returns one of:
 *   { kind: 'email'|'phone', value }  - normalized, ready for lookup
 *   { kind: 'legacy', value }          - legacy username passthrough
 *   { kind: 'missing' }                - nothing usable was provided
 *   { kind: 'bad-email'|'bad-phone' }  - provided but malformed
 */
function resolveIdentity(body) {
  const b = body || {};
  const emailRaw = String(b.email || '').trim();
  const phoneRaw = String(b.phone || '').trim();
  const identifierRaw = String(b.identifier || '').trim();
  const usernameRaw = String(b.username || '').trim();

  if (emailRaw) {
    const email = normalizeEmail(emailRaw);
    return email ? { kind: 'email', value: email } : { kind: 'bad-email' };
  }
  if (phoneRaw) {
    const phone = normalizePhone(phoneRaw);
    return phone ? { kind: 'phone', value: phone } : { kind: 'bad-phone' };
  }
  if (identifierRaw) {
    const parsed = asIdentifier(identifierRaw);
    if (parsed.kind === 'email' || parsed.kind === 'phone') return parsed;
    return parsed; // bad-email / bad-phone
  }
  if (usernameRaw) {
    if (usernameRaw.includes('@')) {
      const email = normalizeEmail(usernameRaw);
      return email ? { kind: 'email', value: email } : { kind: 'bad-email' };
    }
    const phone = normalizePhone(usernameRaw);
    if (phone) return { kind: 'phone', value: phone };
    return { kind: 'legacy', value: usernameRaw };
  }
  return { kind: 'missing' };
}

function derivedUsername(identity) {
  if (identity.kind === 'email') return identity.value;
  if (identity.kind === 'phone') return `tel:${identity.value}`;
  return identity.value; // legacy
}

function duplicateMessage(identity) {
  if (identity.kind === 'email') return 'An account with this email address already exists';
  if (identity.kind === 'phone') return 'An account with this phone number already exists';
  return 'Username already exists';
}

async function findByUsername(username) {
  if (!username) return null;
  return prisma.user.findUnique({ where: { username } });
}

async function register(body) {
  const fullName = String((body && body.fullName) || '').trim();
  const password = body && body.password ? String(body.password) : '';
  if (!fullName) {
    throw new ApiError(400, 'Full name is required.');
  }
  if (!password) {
    throw new ApiError(400, 'Password is required.');
  }
  const identity = resolveIdentity(body || {});
  if (identity.kind === 'missing') {
    throw new ApiError(400, 'Email or phone number is required.');
  }
  if (identity.kind === 'bad-email') {
    throw new ApiError(400, 'Please enter a valid email address.');
  }
  if (identity.kind === 'bad-phone') {
    throw new ApiError(400, 'Please enter a valid phone number.');
  }
  const username = derivedUsername(identity);
  const existingUser = await findByUsername(username);
  if (existingUser) {
    throw new ApiError(409, duplicateMessage(identity));
  }
  const passwordHash = await bcrypt.hash(password, config.bcryptRounds);
  const data = {
    username,
    fullName,
    passwordHash,
    role: CITIZEN_ROLE,
  };
  if (identity.kind === 'email') data.email = identity.value;
  if (identity.kind === 'phone') data.phoneNumber = identity.value;
  const newUser = await prisma.user.create({ data });
  return { user: sanitizeUser(newUser) };
}

async function login(body) {
  const password = body && body.password ? String(body.password) : '';
  const identity = resolveIdentity(body || {});
  if (identity.kind === 'missing' || !password) {
    if (config.debugAuth) {
      console.log('[AUTH][DEBUG] login rejected: missing fields', {
        hasIdentifier: identity.kind !== 'missing',
        hasPassword: Boolean(password),
      });
    }
    throw new ApiError(400, 'Email or phone number and password are required.');
  }
  if (identity.kind === 'bad-email') {
    throw new ApiError(400, 'Please enter a valid email address.');
  }
  if (identity.kind === 'bad-phone') {
    throw new ApiError(400, 'Please enter a valid phone number.');
  }
  // Legacy usernames keep working: try the raw value first (preserves exact
  // behavior for pre-existing accounts), then the derived canonical form.
  const candidates = identity.kind === 'legacy'
    ? [identity.value]
    : Array.from(new Set([String((body && (body.username || body.identifier)) || '').trim(), derivedUsername(identity)])).filter(Boolean);
  let user = null;
  for (const candidate of candidates) {
    user = await findByUsername(candidate);
    if (user) break;
  }
  if (!user) {
    if (config.debugAuth) {
      // The identifier itself is not a secret; passwords, hashes and
      // tokens are NEVER logged.
      console.log('[AUTH][DEBUG] login failed: no account with that identifier');
    }
    throw new ApiError(401, 'Invalid email/phone number or password.');
  }
  const ok = await bcrypt.compare(password, user.passwordHash || '');
  if (!ok) {
    if (config.debugAuth) {
      console.log('[AUTH][DEBUG] login failed: password does not match stored hash', {
        hasPasswordHash: Boolean(user.passwordHash),
      });
    }
    throw new ApiError(401, 'Invalid email/phone number or password.');
  }
  const token = jwt.sign(
    { userId: user.id, username: user.username, role: user.role },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
  return { token, user: sanitizeUser(user) };
}

async function getMe(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new ApiError(401, 'Session expired. Please log in again.');
  }
  return { user: sanitizeUser(user) };
}

/**
 * Seeds an admin account ONLY when ADMIN_SEED_USERNAME + ADMIN_SEED_PASSWORD
 * are provided via environment (documented in .env.example). Never logs or
 * returns the password.
 */
async function ensureSeedAdmin() {
  const { username, password } = config.adminSeed;
  if (!username || !password) return null;
  const admin = await prisma.user.upsert({
    where: { username },
    update: { role: ADMIN_ROLE },
    create: {
      username,
      fullName: username,
      passwordHash: await bcrypt.hash(String(password), config.bcryptRounds),
      role: ADMIN_ROLE,
    },
  });
  if (admin.role === ADMIN_ROLE) {
    console.log('[AUTH] Admin account seeded/verified:', username);
  }
  return sanitizeUser(admin);
}

module.exports = { register, login, getMe, ensureSeedAdmin, CITIZEN_ROLE, ADMIN_ROLE };
