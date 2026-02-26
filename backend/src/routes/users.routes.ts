import { Router } from 'express';
import * as usersController from '../controllers/users.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/v1/users - List all users (with optional ?search=)
router.get('/', usersController.listUsers);

// POST /api/v1/users - Create a new user with generated password
router.post(
  '/',
  validateBody({
    email: { required: true, type: 'string', minLength: 1, maxLength: 255 },
    firstName: { required: true, type: 'string', minLength: 1, maxLength: 100 },
    lastName: { required: true, type: 'string', minLength: 1, maxLength: 100 },
  }),
  usersController.createUser
);

// PATCH /api/v1/users/me - Update own profile (name, email)
router.patch(
  '/me',
  validateBody({
    firstName: { required: true, type: 'string', minLength: 1, maxLength: 100 },
    lastName: { required: true, type: 'string', minLength: 1, maxLength: 100 },
    email: { required: true, type: 'string', minLength: 1, maxLength: 255 },
  }),
  usersController.updateProfile
);

// PATCH /api/v1/users/me/password - Change own password
router.patch(
  '/me/password',
  validateBody({
    currentPassword: { required: true, type: 'string', minLength: 1 },
    newPassword: { required: true, type: 'string', minLength: 8 },
  }),
  usersController.changePassword
);

// GET /api/v1/users/:userId - Get a single user
router.get('/:userId', usersController.getUser);

export default router;
