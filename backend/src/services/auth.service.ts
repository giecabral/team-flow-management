import { v4 as uuidv4 } from 'uuid';
import db from '../config/database.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  getRefreshTokenExpiry,
} from '../utils/jwt.js';
import type { UserRow, User } from '../types/index.js';

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

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

interface AuthResult {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export async function register(data: RegisterData): Promise<AuthResult> {
  // Check if email already exists
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(data.email);
  if (existing) {
    throw Object.assign(new Error('Email already registered'), {
      statusCode: 409,
      code: 'EMAIL_EXISTS',
    });
  }

  const id = uuidv4();
  const passwordHash = await hashPassword(data.password);

  db.prepare(`
    INSERT INTO users (id, email, password_hash, first_name, last_name)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, data.email, passwordHash, data.firstName, data.lastName);

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as UserRow;

  // Generate tokens
  const accessToken = generateAccessToken({ id: user.id, email: user.email });
  const refreshToken = generateRefreshToken();

  // Store refresh token
  const tokenId = uuidv4();
  const tokenHash = hashToken(refreshToken);
  const expiresAt = getRefreshTokenExpiry().toISOString();

  db.prepare(`
    INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at)
    VALUES (?, ?, ?, ?)
  `).run(tokenId, user.id, tokenHash, expiresAt);

  return {
    user: toUser(user),
    accessToken,
    refreshToken,
  };
}

export async function login(email: string, password: string): Promise<AuthResult> {
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as UserRow | undefined;

  if (!user) {
    throw Object.assign(new Error('Invalid email or password'), {
      statusCode: 401,
      code: 'INVALID_CREDENTIALS',
    });
  }

  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) {
    throw Object.assign(new Error('Invalid email or password'), {
      statusCode: 401,
      code: 'INVALID_CREDENTIALS',
    });
  }

  // Generate tokens
  const accessToken = generateAccessToken({ id: user.id, email: user.email });
  const refreshToken = generateRefreshToken();

  // Store refresh token
  const tokenId = uuidv4();
  const tokenHash = hashToken(refreshToken);
  const expiresAt = getRefreshTokenExpiry().toISOString();

  db.prepare(`
    INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at)
    VALUES (?, ?, ?, ?)
  `).run(tokenId, user.id, tokenHash, expiresAt);

  return {
    user: toUser(user),
    accessToken,
    refreshToken,
  };
}

export function logout(userId: string, refreshToken?: string): void {
  if (refreshToken) {
    const tokenHash = hashToken(refreshToken);
    db.prepare('DELETE FROM refresh_tokens WHERE user_id = ? AND token_hash = ?')
      .run(userId, tokenHash);
  } else {
    // Revoke all refresh tokens for user
    db.prepare('DELETE FROM refresh_tokens WHERE user_id = ?').run(userId);
  }
}

export function refresh(refreshToken: string): { accessToken: string; refreshToken: string } {
  const tokenHash = hashToken(refreshToken);

  const stored = db.prepare(`
    SELECT rt.*, u.email FROM refresh_tokens rt
    JOIN users u ON u.id = rt.user_id
    WHERE rt.token_hash = ?
  `).get(tokenHash) as { user_id: string; email: string; expires_at: string } | undefined;

  if (!stored) {
    throw Object.assign(new Error('Invalid refresh token'), {
      statusCode: 401,
      code: 'INVALID_TOKEN',
    });
  }

  if (new Date(stored.expires_at) < new Date()) {
    // Delete expired token
    db.prepare('DELETE FROM refresh_tokens WHERE token_hash = ?').run(tokenHash);
    throw Object.assign(new Error('Refresh token expired'), {
      statusCode: 401,
      code: 'TOKEN_EXPIRED',
    });
  }

  // Delete old token (rotation)
  db.prepare('DELETE FROM refresh_tokens WHERE token_hash = ?').run(tokenHash);

  // Generate new tokens
  const newAccessToken = generateAccessToken({ id: stored.user_id, email: stored.email });
  const newRefreshToken = generateRefreshToken();

  // Store new refresh token
  const tokenId = uuidv4();
  const newTokenHash = hashToken(newRefreshToken);
  const expiresAt = getRefreshTokenExpiry().toISOString();

  db.prepare(`
    INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at)
    VALUES (?, ?, ?, ?)
  `).run(tokenId, stored.user_id, newTokenHash, expiresAt);

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
}

export function getCurrentUser(userId: string): User | null {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as UserRow | undefined;
  return user ? toUser(user) : null;
}
