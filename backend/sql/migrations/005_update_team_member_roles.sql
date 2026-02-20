-- SQLite does not support ALTER TABLE to modify CHECK constraints,
-- so we recreate the table with the updated role set.
-- Existing 'member' rows are migrated to 'dev'.

PRAGMA foreign_keys = OFF;

CREATE TABLE team_members_new (
    id TEXT PRIMARY KEY,
    team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'dev'
        CHECK (role IN ('admin', 'manager', 'dev', 'guest')),
    joined_at TEXT DEFAULT (datetime('now')),
    UNIQUE(team_id, user_id)
);

INSERT INTO team_members_new (id, team_id, user_id, role, joined_at)
SELECT
    id,
    team_id,
    user_id,
    CASE WHEN role = 'member' THEN 'dev' ELSE role END,
    joined_at
FROM team_members;

DROP TABLE team_members;
ALTER TABLE team_members_new RENAME TO team_members;

CREATE INDEX idx_team_members_team_id ON team_members(team_id);
CREATE INDEX idx_team_members_user_id ON team_members(user_id);

PRAGMA foreign_keys = ON;
