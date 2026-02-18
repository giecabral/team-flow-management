import { Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt.js';
import * as apiResponse from '../utils/apiResponse.js';
import type { AuthRequest } from '../types/index.js';
import db from '../config/database.js';

export function authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    apiResponse.unauthorized(res, 'No token provided');
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, email: payload.email };
    next();
  } catch {
    apiResponse.unauthorized(res, 'Invalid or expired token');
  }
}

export function requireTeamMembership(roleRequired?: 'admin') {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const teamId = req.params.teamId || req.params.id;
    const userId = req.user?.id;

    if (!userId) {
      apiResponse.unauthorized(res);
      return;
    }

    const membership = db.prepare(`
      SELECT role FROM team_members
      WHERE team_id = ? AND user_id = ?
    `).get(teamId, userId) as { role: 'admin' | 'member' } | undefined;

    if (!membership) {
      apiResponse.forbidden(res, 'Not a team member');
      return;
    }

    if (roleRequired === 'admin' && membership.role !== 'admin') {
      apiResponse.forbidden(res, 'Admin access required');
      return;
    }

    req.teamMembership = { role: membership.role };
    next();
  };
}
