import { Router } from 'express';
import * as tasksController from '../controllers/tasks.controller.js';
import { authenticate, requireTeamMembership, requireTeamRole } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';

// mergeParams: true allows access to :teamId from the parent router
const router = Router({ mergeParams: true });

// All task routes require authentication and team membership
router.use(authenticate, requireTeamMembership());

// GET  /api/v1/teams/:teamId/tasks
router.get('/', tasksController.listTasks);

// POST /api/v1/teams/:teamId/tasks  (guests cannot create tasks)
router.post(
  '/',
  requireTeamRole(['admin', 'manager', 'dev']),
  validateBody({
    title: { required: true, type: 'string', minLength: 1, maxLength: 255 },
    description: { type: 'string', maxLength: 5000 },
    status: { type: 'string' },
    priority: { type: 'string' },
    dueDate: { type: 'string' },
    assignedTo: { type: 'string' },
  }),
  tasksController.createTask,
);

// GET    /api/v1/teams/:teamId/tasks/:taskId
router.get('/:taskId', tasksController.getTask);

// PATCH  /api/v1/teams/:teamId/tasks/:taskId  (permission checked in service)
router.patch(
  '/:taskId',
  validateBody({
    title: { type: 'string', minLength: 1, maxLength: 255 },
    description: { type: 'string', maxLength: 5000 },
    status: { type: 'string' },
    priority: { type: 'string' },
    dueDate: { type: 'string' },
    assignedTo: { type: 'string' },
  }),
  tasksController.updateTask,
);

// DELETE /api/v1/teams/:teamId/tasks/:taskId  (permission checked in service)
router.delete('/:taskId', tasksController.deleteTask);

// ── Comments ──────────────────────────────────────────────────────────────

// GET  /api/v1/teams/:teamId/tasks/:taskId/comments
router.get('/:taskId/comments', tasksController.listComments);

// POST /api/v1/teams/:teamId/tasks/:taskId/comments  (any member)
router.post(
  '/:taskId/comments',
  validateBody({
    content: { required: true, type: 'string', minLength: 1, maxLength: 5000 },
  }),
  tasksController.addComment,
);

// PATCH /api/v1/teams/:teamId/tasks/:taskId/comments/:commentId
router.patch(
  '/:taskId/comments/:commentId',
  validateBody({
    content: { required: true, type: 'string', minLength: 1, maxLength: 5000 },
  }),
  tasksController.updateComment,
);

// DELETE /api/v1/teams/:teamId/tasks/:taskId/comments/:commentId
router.delete('/:taskId/comments/:commentId', tasksController.deleteComment);

export default router;
