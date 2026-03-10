import { randomUUID } from 'crypto';
import { hashSync, genSaltSync, compare } from 'bcrypt-ts';
import { eq, sql } from 'drizzle-orm';
import { getDb } from './index.js';
import { users } from './schema.js';

/**
 * Get the total number of users.
 * Used to detect first-time setup (no users = needs setup).
 * @returns {Promise<number>}
 */
export async function getUserCount() {
  const db = getDb();
  const result = await db.select({ count: sql`count(*)` }).from(users).get();
  return result?.count ?? 0;
}

/**
 * Find a user by email address.
 * @param {string} email
 * @returns {Promise<object|undefined>}
 */
export async function getUserByEmail(email) {
  const db = getDb();
  return await db.select().from(users).where(eq(users.email, email.toLowerCase())).get();
}

/**
 * Create a new user with a hashed password.
 * @param {string} email
 * @param {string} password - Plain text password (will be hashed)
 * @returns {Promise<object>} The created user (without password_hash)
 */
export async function createUser(email, password) {
  const db = getDb();
  const now = Date.now();
  const passwordHash = hashSync(password, genSaltSync(10));

  const user = {
    id: randomUUID(),
    email: email.toLowerCase(),
    passwordHash: passwordHash,
    role: 'admin',
    createdAt: now,
    updatedAt: now,
  };

  await db.insert(users).values(user).run();

  return { id: user.id, email: user.email, role: user.role };
}

/**
 * Create the first user (admin) if no users exist.
 * @param {string} email
 * @param {string} password - Plain text password (will be hashed)
 * @returns {Promise<object|null>} The created user, or null if users already exist
 */
export async function createFirstUser(email, password) {
  const db = getDb();

  const count = await db.select({ count: sql`count(*)` }).from(users).get();
  if (count?.count > 0) return null;

  const now = Date.now();
  const passwordHash = hashSync(password, genSaltSync(10));
  const user = {
    id: randomUUID(),
    email: email.toLowerCase(),
    passwordHash: passwordHash,
    role: 'admin',
    createdAt: now,
    updatedAt: now,
  };
  await db.insert(users).values(user).run();
  return { id: user.id, email: user.email, role: user.role };
}

/**
 * Verify a password against a user's stored hash.
 * @param {object} user - User object with password_hash field
 * @param {string} password - Plain text password to verify
 * @returns {Promise<boolean>}
 */
export async function verifyPassword(user, password) {
  return compare(password, user.passwordHash);
}
