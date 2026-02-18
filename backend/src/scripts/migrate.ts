import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import db from '../config/database.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.resolve(__dirname, '../../sql/migrations');

// Create migrations tracking table
db.exec(`
  CREATE TABLE IF NOT EXISTS migrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    applied_at TEXT DEFAULT (datetime('now'))
  )
`);

// Get applied migrations
const applied = db.prepare('SELECT name FROM migrations').all() as { name: string }[];
const appliedNames = new Set(applied.map((m) => m.name));

// Get migration files
const files = fs.readdirSync(migrationsDir)
  .filter((f) => f.endsWith('.sql'))
  .sort();

// Run pending migrations
let migrationsRun = 0;

for (const file of files) {
  if (appliedNames.has(file)) {
    console.log(`Skipping: ${file} (already applied)`);
    continue;
  }

  const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');

  try {
    db.exec(sql);
    db.prepare('INSERT INTO migrations (name) VALUES (?)').run(file);
    console.log(`Applied: ${file}`);
    migrationsRun++;
  } catch (error) {
    console.error(`Failed to apply ${file}:`, error);
    process.exit(1);
  }
}

if (migrationsRun === 0) {
  console.log('No new migrations to apply.');
} else {
  console.log(`\nSuccessfully applied ${migrationsRun} migration(s).`);
}

process.exit(0);
