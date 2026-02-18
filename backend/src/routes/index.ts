import { Router } from 'express';
import authRoutes from './auth.routes.js';
import teamsRoutes from './teams.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/teams', teamsRoutes);

export default router;
