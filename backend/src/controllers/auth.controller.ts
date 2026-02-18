import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/auth.service.js';
import * as apiResponse from '../utils/apiResponse.js';
import type { AuthRequest } from '../types/index.js';

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password, firstName, lastName } = req.body;
    const result = await authService.register({ email, password, firstName, lastName });
    apiResponse.created(res, result);
  } catch (error) {
    next(error);
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    apiResponse.success(res, result);
  } catch (error) {
    next(error);
  }
}

export function logout(req: AuthRequest, res: Response, next: NextFunction): void {
  try {
    const userId = req.user?.id;
    const { refreshToken } = req.body;
    if (userId) {
      authService.logout(userId, refreshToken);
    }
    apiResponse.success(res, { message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
}

export function refresh(req: Request, res: Response, next: NextFunction): void {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      apiResponse.badRequest(res, 'Refresh token is required');
      return;
    }
    const result = authService.refresh(refreshToken);
    apiResponse.success(res, result);
  } catch (error) {
    next(error);
  }
}

export function me(req: AuthRequest, res: Response, next: NextFunction): void {
  try {
    const userId = req.user?.id;
    if (!userId) {
      apiResponse.unauthorized(res);
      return;
    }
    const user = authService.getCurrentUser(userId);
    if (!user) {
      apiResponse.notFound(res, 'User not found');
      return;
    }
    apiResponse.success(res, user);
  } catch (error) {
    next(error);
  }
}
