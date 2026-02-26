import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import db from '../config/database.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import type { UserRow, User } from '../types/index.js';

export function toUser(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Generates a readable random password: 3 groups of 4 chars separated by dashes
// e.g. "aB3x-Kp9m-Tz2w"
export function generatePassword(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  const bytes = crypto.randomBytes(12);
  const raw = Array.from(bytes).map((b) => chars[b % chars.length]).join('');
  return `${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8, 12)}`;
}

interface CreateUserData {
  email: string;
  firstName: string;
  lastName: string;
}

export async function createUser(data: CreateUserData): Promise<{ user: User; password: string }> {
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(data.email);
  if (existing) {
    throw Object.assign(new Error('Email already registered'), { statusCode: 409, code: 'EMAIL_EXISTS' });
  }

  const plainPassword = generatePassword();
  const id = uuidv4();
  const passwordHash = await hashPassword(plainPassword);

  db.prepare(`
    INSERT INTO users (id, email, password_hash, first_name, last_name)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, data.email, passwordHash, data.firstName, data.lastName);

  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as UserRow;
  return { user: toUser(row), password: plainPassword };
}

export function listUsers(search?: string): User[] {
  if (search && search.trim().length > 0) {
    const pattern = `%${search.trim()}%`;
    const rows = db.prepare(`
      SELECT * FROM users
      WHERE email LIKE ? OR first_name LIKE ? OR last_name LIKE ?
      ORDER BY first_name, last_name
      LIMIT 100
    `).all(pattern, pattern, pattern) as UserRow[];
    return rows.map(toUser);
  }

  const rows = db.prepare(`
    SELECT * FROM users ORDER BY first_name, last_name LIMIT 100
  `).all() as UserRow[];
  return rows.map(toUser);
}

export function getUserById(userId: string): User | null {
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as UserRow | undefined;
  return row ? toUser(row) : null;
}

interface UpdateProfileData {
  firstName: string;
  lastName: string;
  email: string;
}

export async function updateProfile(userId: string, data: UpdateProfileData): Promise<User> {
  const emailTaken = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(data.email, userId);
  if (emailTaken) {
    throw Object.assign(new Error('Email already in use'), { statusCode: 409, code: 'EMAIL_EXISTS' });
  }

  db.prepare(`
    UPDATE users SET first_name = ?, last_name = ?, email = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(data.firstName, data.lastName, data.email, userId);

  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as UserRow;
  return toUser(row);
}

interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export async function changePassword(userId: string, data: ChangePasswordData): Promise<void> {
  const row = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(userId) as { password_hash: string } | undefined;
  if (!row) {
    throw Object.assign(new Error('User not found'), { statusCode: 404, code: 'NOT_FOUND' });
  }

  const valid = await verifyPassword(data.currentPassword, row.password_hash);
  if (!valid) {
    throw Object.assign(new Error('Current password is incorrect'), { statusCode: 400, code: 'INVALID_PASSWORD' });
  }

  const newHash = await hashPassword(data.newPassword);
  db.prepare(`UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?`).run(newHash, userId);
}
