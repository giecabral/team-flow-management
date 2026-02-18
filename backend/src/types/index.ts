import { Request } from 'express';

// Database row types
export interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  created_at: string;
  updated_at: string;
}

export interface TeamRow {
  id: string;
  name: string;
  description: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface TeamMemberRow {
  id: string;
  team_id: string;
  user_id: string;
  role: 'admin' | 'member';
  joined_at: string;
}

export interface RefreshTokenRow {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: string;
  created_at: string;
}

// API types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: string;
  updatedAt: string;
}

export interface Team {
  id: string;
  name: string;
  description: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  role: 'admin' | 'member';
  joinedAt: string;
  user?: User;
}

export interface TeamWithRole extends Team {
  role: 'admin' | 'member';
  memberCount?: number;
}

// Request types
export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
  teamMembership?: {
    role: 'admin' | 'member';
  };
}

// JWT types
export interface JWTPayload {
  sub: string;
  email: string;
  iat: number;
  exp: number;
}

// API Response types
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string[]>;
}
