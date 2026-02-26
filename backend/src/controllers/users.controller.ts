import { Response, NextFunction } from 'express';
import * as usersService from '../services/users.service.js';
import * as apiResponse from '../utils/apiResponse.js';
import type { AuthRequest } from '../types/index.js';

// GET /api/v1/users
export function listUsers(req: AuthRequest, res: Response, next: NextFunction): void {
  try {
    const { search } = req.query;
    const users = usersService.listUsers(typeof search === 'string' ? search : undefined);
    apiResponse.success(res, users);
  } catch (error) {
    next(error);
  }
}

// POST /api/v1/users
export async function createUser(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, firstName, lastName } = req.body;
    const result = await usersService.createUser({ email, firstName, lastName });
    apiResponse.created(res, result);
  } catch (error) {
    next(error);
  }
}

// GET /api/v1/users/:userId
export function getUser(req: AuthRequest, res: Response, next: NextFunction): void {
  try {
    const { userId } = req.params;
    const user = usersService.getUserById(userId);
    if (!user) {
      apiResponse.notFound(res, 'User not found');
      return;
    }
    apiResponse.success(res, user);
  } catch (error) {
    next(error);
  }
}

// PATCH /api/v1/users/me
export async function updateProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const { firstName, lastName, email } = req.body;
    const user = await usersService.updateProfile(userId, { firstName, lastName, email });
    apiResponse.success(res, user);
  } catch (error) {
    next(error);
  }
}

// PATCH /api/v1/users/me/password
export async function changePassword(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const { currentPassword, newPassword } = req.body;
    await usersService.changePassword(userId, { currentPassword, newPassword });
    apiResponse.noContent(res);
  } catch (error) {
    next(error);
  }
}
