import { Router } from 'express';
import authRoutes from './auth.routes.js';
import teamsRoutes from './teams.routes.js';
import usersRoutes from './users.routes.js';
import tasksRoutes from './tasks.routes.js';
import { authenticate } from '../middleware/auth.js';
import { getMyTasks } from '../controllers/tasks.controller.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/teams', teamsRoutes);
router.use('/users', usersRoutes);
router.use('/teams/:teamId/tasks', tasksRoutes);

// Cross-team: tasks assigned to the authenticated user
router.get('/tasks/me', authenticate, getMyTasks);

export default router;
