import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import db from '../../config/database.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// src/test/helpers/ → backend/sql/migrations (3 levels up)
const migrationsDir = path.resolve(__dirname, '../../../sql/migrations');

/** Run all SQL migrations against the in-memory test database. Call once in beforeAll. */
export function runMigrations(): void {
  const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();
  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
    db.exec(sql);
  }
}

/** Delete all rows from every table. Call in afterEach to keep tests isolated. */
export function clearTables(): void {
  db.exec(`
    DELETE FROM task_labels;
    DELETE FROM task_comments;
    DELETE FROM tasks;
    DELETE FROM labels;
    DELETE FROM team_members;
    DELETE FROM refresh_tokens;
    DELETE FROM teams;
    DELETE FROM users;
  `);
}
