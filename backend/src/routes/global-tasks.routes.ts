import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import * as ctrl from '../controllers/global-tasks.controller.js';

const router = Router();

// /me must be registered before /:taskId to avoid being swallowed by the param route
router.get('/me', authenticate, ctrl.getMyTasks);

router.get('/', authenticate, ctrl.listTasks);
router.post('/', authenticate, ctrl.createTask);

router.get('/:taskId', authenticate, ctrl.getTask);
router.patch('/:taskId', authenticate, ctrl.updateTask);
router.delete('/:taskId', authenticate, ctrl.deleteTask);

router.get('/:taskId/comments', authenticate, ctrl.listComments);
router.post('/:taskId/comments', authenticate, ctrl.addComment);
router.patch('/:taskId/comments/:commentId', authenticate, ctrl.updateComment);
router.delete('/:taskId/comments/:commentId', authenticate, ctrl.deleteComment);

export default router;
