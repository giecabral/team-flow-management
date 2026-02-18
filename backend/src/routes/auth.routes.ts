import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';

const router = Router();

// POST /api/v1/auth/register
router.post(
  '/register',
  validateBody({
    email: { required: true, type: 'email' },
    password: { required: true, type: 'string', minLength: 6 },
    firstName: { required: true, type: 'string', minLength: 1, maxLength: 100 },
    lastName: { required: true, type: 'string', minLength: 1, maxLength: 100 },
  }),
  authController.register
);

// POST /api/v1/auth/login
router.post(
  '/login',
  validateBody({
    email: { required: true, type: 'email' },
    password: { required: true, type: 'string' },
  }),
  authController.login
);

// POST /api/v1/auth/logout
router.post('/logout', authenticate, authController.logout);

// POST /api/v1/auth/refresh
router.post(
  '/refresh',
  validateBody({
    refreshToken: { required: true, type: 'string' },
  }),
  authController.refresh
);

// GET /api/v1/auth/me
router.get('/me', authenticate, authController.me);

export default router;
