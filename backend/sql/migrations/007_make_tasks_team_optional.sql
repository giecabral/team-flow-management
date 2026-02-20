-- Make team_id nullable in tasks table to support personal (teamless) tasks.
-- SQLite does not support ALTER COLUMN, so we rebuild the table.

PRAGMA foreign_keys = OFF;
BEGIN TRANSACTION;

CREATE TABLE tasks_new (
    id TEXT PRIMARY KEY,
    team_id TEXT REFERENCES teams(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'todo'
        CHECK (status IN ('todo', 'in_progress', 'done')),
    priority TEXT NOT NULL DEFAULT 'medium'
        CHECK (priority IN ('low', 'medium', 'high')),
    due_date TEXT,
    assigned_to TEXT REFERENCES users(id) ON DELETE SET NULL,
    created_by TEXT NOT NULL REFERENCES users(id),
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

INSERT INTO tasks_new SELECT * FROM tasks;
DROP TABLE tasks;
ALTER TABLE tasks_new RENAME TO tasks;

CREATE INDEX idx_tasks_team_id  ON tasks(team_id);
CREATE INDEX idx_tasks_assigned ON tasks(assigned_to);
CREATE INDEX idx_tasks_status   ON tasks(team_id, status);

COMMIT;
PRAGMA foreign_keys = ON;
