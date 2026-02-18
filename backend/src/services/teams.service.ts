import { v4 as uuidv4 } from 'uuid';
import db from '../config/database.js';
import type { TeamRow, TeamMemberRow, Team, TeamMember, TeamWithRole, User, UserRow } from '../types/index.js';

function toTeam(row: TeamRow): Team {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toUser(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toTeamMember(row: TeamMemberRow & Partial<UserRow>): TeamMember {
  const member: TeamMember = {
    id: row.id,
    teamId: row.team_id,
    userId: row.user_id,
    role: row.role,
    joinedAt: row.joined_at,
  };
  if (row.email) {
    member.user = {
      id: row.user_id,
      email: row.email,
      firstName: row.first_name!,
      lastName: row.last_name!,
      createdAt: row.created_at!,
      updatedAt: row.updated_at!,
    };
  }
  return member;
}

// Get all teams for a user
export function getUserTeams(userId: string): TeamWithRole[] {
  const rows = db.prepare(`
    SELECT t.*, tm.role,
           (SELECT COUNT(*) FROM team_members WHERE team_id = t.id) as member_count
    FROM teams t
    JOIN team_members tm ON tm.team_id = t.id
    WHERE tm.user_id = ?
    ORDER BY t.created_at DESC
  `).all(userId) as (TeamRow & { role: 'admin' | 'member'; member_count: number })[];

  return rows.map((row) => ({
    ...toTeam(row),
    role: row.role,
    memberCount: row.member_count,
  }));
}

// Create a new team
export function createTeam(name: string, description: string | null, createdBy: string): TeamWithRole {
  const id = uuidv4();
  const memberId = uuidv4();

  db.transaction(() => {
    // Create team
    db.prepare(`
      INSERT INTO teams (id, name, description, created_by)
      VALUES (?, ?, ?, ?)
    `).run(id, name, description, createdBy);

    // Add creator as admin
    db.prepare(`
      INSERT INTO team_members (id, team_id, user_id, role)
      VALUES (?, ?, ?, 'admin')
    `).run(memberId, id, createdBy);
  })();

  const team = db.prepare('SELECT * FROM teams WHERE id = ?').get(id) as TeamRow;

  return {
    ...toTeam(team),
    role: 'admin',
    memberCount: 1,
  };
}

// Get team by ID
export function getTeamById(teamId: string): Team | null {
  const row = db.prepare('SELECT * FROM teams WHERE id = ?').get(teamId) as TeamRow | undefined;
  return row ? toTeam(row) : null;
}

// Update team
export function updateTeam(teamId: string, name?: string, description?: string | null): Team {
  const updates: string[] = [];
  const values: (string | null)[] = [];

  if (name !== undefined) {
    updates.push('name = ?');
    values.push(name);
  }
  if (description !== undefined) {
    updates.push('description = ?');
    values.push(description);
  }

  if (updates.length > 0) {
    updates.push("updated_at = datetime('now')");
    values.push(teamId);
    db.prepare(`UPDATE teams SET ${updates.join(', ')} WHERE id = ?`).run(...values);
  }

  const row = db.prepare('SELECT * FROM teams WHERE id = ?').get(teamId) as TeamRow;
  return toTeam(row);
}

// Delete team
export function deleteTeam(teamId: string): void {
  db.prepare('DELETE FROM teams WHERE id = ?').run(teamId);
}

// Get team members
export function getTeamMembers(teamId: string): TeamMember[] {
  const rows = db.prepare(`
    SELECT tm.*, u.email, u.first_name, u.last_name, u.created_at, u.updated_at
    FROM team_members tm
    JOIN users u ON u.id = tm.user_id
    WHERE tm.team_id = ?
    ORDER BY tm.joined_at ASC
  `).all(teamId) as (TeamMemberRow & UserRow)[];

  return rows.map(toTeamMember);
}

// Add member to team
export function addMember(teamId: string, userId: string, role: 'admin' | 'member'): TeamMember {
  // Check if user exists
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as UserRow | undefined;
  if (!user) {
    throw Object.assign(new Error('User not found'), {
      statusCode: 404,
      code: 'USER_NOT_FOUND',
    });
  }

  // Check if already a member
  const existing = db.prepare(
    'SELECT id FROM team_members WHERE team_id = ? AND user_id = ?'
  ).get(teamId, userId);
  if (existing) {
    throw Object.assign(new Error('User is already a team member'), {
      statusCode: 409,
      code: 'ALREADY_MEMBER',
    });
  }

  const id = uuidv4();
  db.prepare(`
    INSERT INTO team_members (id, team_id, user_id, role)
    VALUES (?, ?, ?, ?)
  `).run(id, teamId, userId, role);

  const row = db.prepare(`
    SELECT tm.*, u.email, u.first_name, u.last_name, u.created_at, u.updated_at
    FROM team_members tm
    JOIN users u ON u.id = tm.user_id
    WHERE tm.id = ?
  `).get(id) as TeamMemberRow & UserRow;

  return toTeamMember(row);
}

// Update member role
export function updateMemberRole(teamId: string, userId: string, role: 'admin' | 'member'): TeamMember {
  const result = db.prepare(`
    UPDATE team_members SET role = ? WHERE team_id = ? AND user_id = ?
  `).run(role, teamId, userId);

  if (result.changes === 0) {
    throw Object.assign(new Error('Team member not found'), {
      statusCode: 404,
      code: 'MEMBER_NOT_FOUND',
    });
  }

  const row = db.prepare(`
    SELECT tm.*, u.email, u.first_name, u.last_name, u.created_at, u.updated_at
    FROM team_members tm
    JOIN users u ON u.id = tm.user_id
    WHERE tm.team_id = ? AND tm.user_id = ?
  `).get(teamId, userId) as TeamMemberRow & UserRow;

  return toTeamMember(row);
}

// Remove member from team
export function removeMember(teamId: string, userId: string): void {
  // Check if this is the last admin
  const adminCount = db.prepare(`
    SELECT COUNT(*) as count FROM team_members
    WHERE team_id = ? AND role = 'admin'
  `).get(teamId) as { count: number };

  const member = db.prepare(`
    SELECT role FROM team_members WHERE team_id = ? AND user_id = ?
  `).get(teamId, userId) as { role: string } | undefined;

  if (!member) {
    throw Object.assign(new Error('Team member not found'), {
      statusCode: 404,
      code: 'MEMBER_NOT_FOUND',
    });
  }

  if (member.role === 'admin' && adminCount.count <= 1) {
    throw Object.assign(new Error('Cannot remove the last admin'), {
      statusCode: 400,
      code: 'LAST_ADMIN',
    });
  }

  db.prepare('DELETE FROM team_members WHERE team_id = ? AND user_id = ?').run(teamId, userId);
}

// Search users to add to team
export function searchUsers(query: string, excludeTeamId?: string): User[] {
  let sql = `
    SELECT * FROM users
    WHERE (email LIKE ? OR first_name LIKE ? OR last_name LIKE ?)
  `;
  const params: string[] = [`%${query}%`, `%${query}%`, `%${query}%`];

  if (excludeTeamId) {
    sql += ` AND id NOT IN (SELECT user_id FROM team_members WHERE team_id = ?)`;
    params.push(excludeTeamId);
  }

  sql += ' LIMIT 10';

  const rows = db.prepare(sql).all(...params) as UserRow[];
  return rows.map(toUser);
}
