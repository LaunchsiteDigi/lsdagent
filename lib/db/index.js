import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { thepopebotDb, dataDir, PROJECT_ROOT } from '../paths.js';
import * as schema from './schema.js';

const require = createRequire(import.meta.url);

let _db = null;

/**
 * Detect whether to use libSQL (Turso) or better-sqlite3.
 * @returns {boolean}
 */
function useTurso() {
  return !!process.env.TURSO_DATABASE_URL;
}

/**
 * Get or create the Drizzle database instance (lazy singleton).
 * Returns the same Drizzle query-builder API regardless of backend.
 *
 * With better-sqlite3: operations (.get(), .all(), .run()) return values directly.
 * With libSQL/Turso: operations return Promises.
 * All DB module functions use `await` so both backends work.
 */
export function getDb() {
  if (!_db) {
    if (useTurso()) {
      const { createClient } = require('@libsql/client');
      const { drizzle } = require('drizzle-orm/libsql');
      const client = createClient({
        url: process.env.TURSO_DATABASE_URL,
        authToken: process.env.TURSO_AUTH_TOKEN,
      });
      _db = drizzle(client, { schema });
    } else {
      const Database = require('better-sqlite3');
      const { drizzle } = require('drizzle-orm/better-sqlite3');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      const sqlite = new Database(thepopebotDb);
      sqlite.pragma('journal_mode = WAL');
      _db = drizzle(sqlite, { schema });
    }
  }
  return _db;
}

/**
 * Initialize the database — apply pending migrations.
 * Called from instrumentation.js at server startup.
 * Uses Drizzle Kit migrations from the package's drizzle/ folder.
 */
export async function initDatabase() {
  const migrationsFolder = path.join(PROJECT_ROOT, 'node_modules', 'thepopebot', 'drizzle');

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
    const Database = (await import('better-sqlite3')).default;
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
