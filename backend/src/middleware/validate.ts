import { Request, Response, NextFunction } from 'express';
import * as apiResponse from '../utils/apiResponse.js';

type ValidationSchema = {
  [key: string]: {
    required?: boolean;
    type?: 'string' | 'number' | 'boolean' | 'email';
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
  };
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateBody(schema: ValidationSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const errors: Record<string, string[]> = {};
    const body = req.body || {};

    for (const [field, rules] of Object.entries(schema)) {
      const value = body[field];
      const fieldErrors: string[] = [];

      // Required check
      if (rules.required && (value === undefined || value === null || value === '')) {
        fieldErrors.push(`${field} is required`);
      }

      // Only validate if value exists
      if (value !== undefined && value !== null && value !== '') {
        // Type checks
        if (rules.type === 'email') {
          if (typeof value !== 'string' || !EMAIL_REGEX.test(value)) {
            fieldErrors.push(`${field} must be a valid email`);
          }
        } else if (rules.type === 'string' && typeof value !== 'string') {
          fieldErrors.push(`${field} must be a string`);
        } else if (rules.type === 'number' && typeof value !== 'number') {
          fieldErrors.push(`${field} must be a number`);
        } else if (rules.type === 'boolean' && typeof value !== 'boolean') {
          fieldErrors.push(`${field} must be a boolean`);
        }

        // Length checks for strings
        if (typeof value === 'string') {
          if (rules.minLength && value.length < rules.minLength) {
            fieldErrors.push(`${field} must be at least ${rules.minLength} characters`);
          }
          if (rules.maxLength && value.length > rules.maxLength) {
            fieldErrors.push(`${field} must be at most ${rules.maxLength} characters`);
          }
        }

        // Pattern check
        if (rules.pattern && typeof value === 'string' && !rules.pattern.test(value)) {
          fieldErrors.push(`${field} has invalid format`);
        }
      }

      if (fieldErrors.length > 0) {
        errors[field] = fieldErrors;
      }
    }

    if (Object.keys(errors).length > 0) {
      apiResponse.badRequest(res, 'Validation failed', errors);
      return;
    }

    next();
  };
}
