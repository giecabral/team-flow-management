import { Router } from 'express';
import authRoutes from './auth.routes.js';
import teamsRoutes from './teams.routes.js';
import usersRoutes from './users.routes.js';
import tasksRoutes from './tasks.routes.js';
import globalTasksRoutes from './global-tasks.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/teams', teamsRoutes);
router.use('/users', usersRoutes);
router.use('/teams/:teamId/tasks', tasksRoutes);
router.use('/tasks', globalTasksRoutes);

export default router;
