import { Response } from 'express';
import type { ApiError } from '../types/index.js';

export function success<T>(res: Response, data: T, status = 200): void {
  res.status(status).json({
    success: true,
    data,
  });
}

export function created<T>(res: Response, data: T): void {
  success(res, data, 201);
}

export function noContent(res: Response): void {
  res.status(204).send();
}

export function error(
  res: Response,
  code: string,
  message: string,
  status = 400,
  details?: Record<string, string[]>
): void {
  const errorResponse: { success: false; error: ApiError } = {
    success: false,
    error: { code, message },
  };
  if (details) {
    errorResponse.error.details = details;
  }
  res.status(status).json(errorResponse);
}

export function badRequest(res: Response, message: string, details?: Record<string, string[]>): void {
  error(res, 'BAD_REQUEST', message, 400, details);
}

export function unauthorized(res: Response, message = 'Unauthorized'): void {
  error(res, 'UNAUTHORIZED', message, 401);
}

export function forbidden(res: Response, message = 'Forbidden'): void {
  error(res, 'FORBIDDEN', message, 403);
}

export function notFound(res: Response, message = 'Not found'): void {
  error(res, 'NOT_FOUND', message, 404);
}

export function conflict(res: Response, message: string): void {
  error(res, 'CONFLICT', message, 409);
}

export function serverError(res: Response, message = 'Internal server error'): void {
  error(res, 'SERVER_ERROR', message, 500);
}
