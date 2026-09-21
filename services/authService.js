/**
 * Authentication service.
 * - Passwords are stored ONLY as bcrypt hashes (never plain text).
 * - The `role` is always assigned server-side; client-supplied roles are
 *   ignored so a user can never self-register as admin by modifying the app.
 * - Responses never include password material.
 */
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');
const { store, nextId } = require('../database/store');
const { sanitizeUser } = require('../middleware/auth');
const { ApiError } = require('../utils/asyncHandler');

const CITIZEN_ROLE = 'citizen';
const ADMIN_ROLE = 'admin';

async function register({ username, fullName, password }) {
  if (!username || !fullName || !password) {
    throw new ApiError(400, 'Username, full name, and password are required');
  }
  const existingUser = store.users.find((u) => u.username === username);
  if (existingUser) {
    throw new ApiError(409, 'Username already exists');
  }
  const passwordHash = await bcrypt.hash(String(password), config.bcryptRounds);
  const newUser = {
    id: nextId(store.users),
    username,
    fullName,
    passwordHash,
    role: CITIZEN_ROLE,
    createdAt: new Date().toISOString(),
  };
  store.users.push(newUser);
  return { user: sanitizeUser(newUser) };
}

async function login({ username, password }) {
  if (!username || !password) {
    if (config.debugAuth) {
      // Safe diagnostics only — never log the password itself.
      console.log('[AUTH][DEBUG] login rejected: missing fields', {
        hasUsername: Boolean(username),
        hasPassword: Boolean(password),
      });
    }
    throw new ApiError(400, 'Username and password are required');
  }
  const user = store.users.find((u) => u.username === username);
  if (!user) {
    if (config.debugAuth) {
      // Pinpoints the #1 production failure mode: the account does not exist
      // in the running process (e.g. store wiped by a restart because no
      // DATABASE_URL/persistence was configured). Username is not a secret;
      // passwords, hashes and tokens are NEVER logged.
      console.log('[AUTH][DEBUG] login failed: no account with that username', {
        username,
        accountsInStore: store.users.length,
      });
    }
    throw new ApiError(401, 'Invalid credentials');
  }
  const ok = await bcrypt.compare(String(password), user.passwordHash || '');
  if (!ok) {
    if (config.debugAuth) {
      console.log('[AUTH][DEBUG] login failed: password does not match stored hash', {
        username,
        hasPasswordHash: Boolean(user.passwordHash),
      });
    }
    throw new ApiError(401, 'Invalid credentials');
  }
  const token = jwt.sign(
    { userId: user.id, username: user.username, role: user.role },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
  return { token, user: sanitizeUser(user) };
}

function getMe(userId) {
  const user = store.users.find((u) => u.id === userId);
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
  let admin = store.users.find((u) => u.username === username);
  if (admin) {
    if (admin.role !== ADMIN_ROLE) {
      admin.role = ADMIN_ROLE;
      console.log('[AUTH] Existing seed user promoted to admin:', username);
    }
    return sanitizeUser(admin);
  }
  admin = {
    id: nextId(store.users),
    username,
    fullName: username,
    passwordHash: await bcrypt.hash(String(password), config.bcryptRounds),
    role: ADMIN_ROLE,
    createdAt: new Date().toISOString(),
  };
  store.users.push(admin);
  console.log('[AUTH] Admin account seeded:', username);
  return sanitizeUser(admin);
}

module.exports = { register, login, getMe, ensureSeedAdmin, CITIZEN_ROLE, ADMIN_ROLE };