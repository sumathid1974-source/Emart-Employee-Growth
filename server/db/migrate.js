const fs = require('fs');
const path = require('path');
const db = require('./connection');

async function runMigrations() {
  console.log('Running database migrations...');
  db.initDb();

  // Create migrations tracker table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version TEXT PRIMARY KEY,
      applied_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const schemaPath = path.join(__dirname, 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');

  // Check if v1_initial has run
  const migration = await db.get('SELECT version FROM schema_migrations WHERE version = ?', ['v1_initial']);

  if (!migration) {
    console.log('Applying v1_initial schema...');
    await db.exec(schemaSql);
    await db.run('INSERT INTO schema_migrations (version) VALUES (?)', ['v1_initial']);
    console.log('v1_initial migration applied successfully.');
  } else {
    // Re-run schema defensively to guarantee table existence
    await db.exec(schemaSql);
    console.log('Schema is up to date.');
  }

  return true;
}

if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log('Migrations complete.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}

module.exports = {
  runMigrations
};
