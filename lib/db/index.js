import fs from 'fs';
import path from 'path';
import { thepopebotDb, dataDir, PROJECT_ROOT } from '../paths.js';
import * as schema from './schema.js';

let _db = null;
let _dbInitPromise = null;

/**
 * Detect whether to use libSQL (Turso) or better-sqlite3.
 * @returns {boolean}
 */
function useTurso() {
  return !!process.env.TURSO_DATABASE_URL;
}

/**
 * Internal: create the Drizzle instance using dynamic import()
 * so webpack doesn't statically resolve better-sqlite3 at build time.
 */
async function _createDb() {
  if (useTurso()) {
    const { createClient } = await import('@libsql/client');
    const { drizzle } = await import('drizzle-orm/libsql');
    const client = createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
    return drizzle(client, { schema });
  } else {
    const { default: Database } = await import('better-sqlite3');
    const { drizzle } = await import('drizzle-orm/better-sqlite3');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    const sqlite = new Database(thepopebotDb);
    sqlite.pragma('journal_mode = WAL');
    return drizzle(sqlite, { schema });
  }
}

/**
 * Get or create the Drizzle database instance (lazy async singleton).
 * Returns the same Drizzle query-builder API regardless of backend.
 *
 * Uses dynamic import() internally so webpack doesn't try to bundle
 * better-sqlite3 on platforms where it's unavailable (e.g. Vercel).
 *
 * @returns {Promise<object>} Drizzle database instance
 */
export async function getDb() {
  if (_db) return _db;
  if (!_dbInitPromise) {
    _dbInitPromise = _createDb().then(db => {
      _db = db;
      _dbInitPromise = null;
      return db;
    });
  }
  return _dbInitPromise;
}

/**
 * Initialize the database — apply pending migrations.
 * Called from instrumentation.js at server startup.
 * Uses Drizzle Kit migrations from the package's drizzle/ folder.
 */
export async function initDatabase() {
  // Try installed package path first, fall back to project root (direct deployment)
  let migrationsFolder = path.join(PROJECT_ROOT, 'node_modules', 'thepopebot', 'drizzle');
  if (!fs.existsSync(migrationsFolder)) {
    migrationsFolder = path.join(PROJECT_ROOT, 'drizzle');
  }

  if (useTurso()) {
    const { createClient } = await import('@libsql/client');
    const { drizzle } = await import('drizzle-orm/libsql');
    const { migrate } = await import('drizzle-orm/libsql/migrator');
    const client = createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
    const db = drizzle(client, { schema });
    await migrate(db, { migrationsFolder });
    _db = null;
  } else {
    const { default: Database } = await import('better-sqlite3');
    const { drizzle } = await import('drizzle-orm/better-sqlite3');
    const { migrate } = await import('drizzle-orm/better-sqlite3/migrator');

    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    const sqlite = new Database(thepopebotDb);
    sqlite.pragma('journal_mode = WAL');
    const db = drizzle(sqlite, { schema });
    migrate(db, { migrationsFolder });
    sqlite.close();
    _db = null;
  }
}
