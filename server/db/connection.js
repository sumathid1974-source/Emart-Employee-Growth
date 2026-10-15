const { config } = require('../config');

let sqliteDb = null;
let pgPool = null;

// Normalize parameters: converts Postgres $1, $2 to ? for SQLite or vice-versa
function normalizeSql(sql, isPostgres) {
  if (isPostgres) {
    // If SQL uses ? placeholders, convert to $1, $2, ...
    let paramIndex = 1;
    return sql.replace(/\?/g, () => `$${paramIndex++}`);
  } else {
    // If SQL uses $1, $2, convert to ?
    return sql.replace(/\$\d+/g, '?');
  }
}

function initDb(customPath) {
  if (config.db.client === 'postgres' && config.db.connectionString) {
    const { Pool } = require('pg');
    pgPool = new Pool({
      connectionString: config.db.connectionString,
      ssl: config.env === 'production' ? { rejectUnauthorized: false } : false
    });
    return { client: 'postgres', pool: pgPool };
  } else {
    const { DatabaseSync } = require('node:sqlite');
    const dbPath = customPath || config.db.sqlitePath;
    sqliteDb = new DatabaseSync(dbPath);
    // Enable foreign keys, WAL mode, and 5000ms busy timeout in SQLite for concurrency and integrity
    sqliteDb.exec('PRAGMA foreign_keys = ON;');
    sqliteDb.exec('PRAGMA journal_mode = WAL;');
    sqliteDb.exec('PRAGMA busy_timeout = 5000;');
    return { client: 'sqlite', db: sqliteDb };
  }
}

// Lazy initialization
function getDb() {
  if (!sqliteDb && !pgPool) {
    initDb();
  }
  return { sqliteDb, pgPool };
}

function sanitizeParams(params = []) {
  if (!params || !Array.isArray(params)) return [];
  return params.map(p => (p === undefined ? null : p));
}

/**
 * Execute query returning all rows: { rows: [...] }
 */
async function query(sql, params = []) {
  const { sqliteDb, pgPool } = getDb();
  const safeParams = sanitizeParams(params);

  if (pgPool) {
    const normalized = normalizeSql(sql, true);
    const result = await pgPool.query(normalized, safeParams);
    return { rows: result.rows };
  } else {
    const normalized = normalizeSql(sql, false);
    const stmt = sqliteDb.prepare(normalized);
    const rows = stmt.all(...safeParams);
    return { rows };
  }
}

/**
 * Execute query returning a single row or null
 */
async function get(sql, params = []) {
  const result = await query(sql, params);
  return result.rows.length > 0 ? result.rows[0] : null;
}

/**
 * Execute non-select query: { changes, lastInsertRowid }
 */
async function run(sql, params = []) {
  const { sqliteDb, pgPool } = getDb();
  const safeParams = sanitizeParams(params);

  if (pgPool) {
    const normalized = normalizeSql(sql, true);
    const result = await pgPool.query(normalized, safeParams);
    return {
      changes: result.rowCount || 0,
      lastInsertRowid: result.rows && result.rows[0] ? result.rows[0].id : null
    };
  } else {
    const normalized = normalizeSql(sql, false);
    const stmt = sqliteDb.prepare(normalized);
    const info = stmt.run(...safeParams);
    return {
      changes: info.changes || 0,
      lastInsertRowid: info.lastInsertRowid || null
    };
  }
}

/**
 * Execute multi-statement DDL/SQL batch
 */
async function exec(sql) {
  const { sqliteDb, pgPool } = getDb();

  if (pgPool) {
    await pgPool.query(sql);
  } else {
    sqliteDb.exec(sql);
  }
}

/**
 * Execute transactional function
 */
async function transaction(fn) {
  const { sqliteDb, pgPool } = getDb();

  if (pgPool) {
    const client = await pgPool.connect();
    try {
      await client.query('BEGIN');
      const result = await fn({
        query: (sql, p) => client.query(normalizeSql(sql, true), sanitizeParams(p)).then(r => ({ rows: r.rows })),
        get: (sql, p) => client.query(normalizeSql(sql, true), sanitizeParams(p)).then(r => r.rows[0] || null),
        run: (sql, p) => client.query(normalizeSql(sql, true), sanitizeParams(p)).then(r => ({ changes: r.rowCount, lastInsertRowid: r.rows[0]?.id }))
      });
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } else {
    sqliteDb.exec('BEGIN TRANSACTION;');
    try {
      const result = await fn({
        query: (sql, p) => {
          const stmt = sqliteDb.prepare(normalizeSql(sql, false));
          return Promise.resolve({ rows: stmt.all(...sanitizeParams(p)) });
        },
        get: (sql, p) => {
          const stmt = sqliteDb.prepare(normalizeSql(sql, false));
          const rows = stmt.all(...sanitizeParams(p));
          return Promise.resolve(rows.length > 0 ? rows[0] : null);
        },
        run: (sql, p) => {
          const stmt = sqliteDb.prepare(normalizeSql(sql, false));
          const info = stmt.run(...sanitizeParams(p));
          return Promise.resolve({ changes: info.changes, lastInsertRowid: info.lastInsertRowid });
        }
      });
      sqliteDb.exec('COMMIT;');
      return result;
    } catch (err) {
      sqliteDb.exec('ROLLBACK;');
      throw err;
    }
  }
}

/**
 * Close database connection
 */
async function close() {
  if (pgPool) {
    await pgPool.end();
    pgPool = null;
  }
  if (sqliteDb) {
    sqliteDb = null;
  }
}

module.exports = {
  initDb,
  getDb,
  query,
  get,
  run,
  exec,
  transaction,
  close
};
