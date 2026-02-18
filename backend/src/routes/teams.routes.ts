import { Router } from 'express';
import * as teamsController from '../controllers/teams.controller.js';
import { authenticate, requireTeamMembership } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/v1/teams - List user's teams
router.get('/', teamsController.getTeams);

// POST /api/v1/teams - Create team
router.post(
  '/',
  validateBody({
    name: { required: true, type: 'string', minLength: 1, maxLength: 200 },
    description: { type: 'string', maxLength: 1000 },
  }),
  teamsController.createTeam
);

// GET /api/v1/teams/:id - Get team details (requires membership)
router.get('/:id', requireTeamMembership(), teamsController.getTeam);

// PATCH /api/v1/teams/:id - Update team (admin only)
router.patch(
  '/:id',
  requireTeamMembership('admin'),
  validateBody({
    name: { type: 'string', minLength: 1, maxLength: 200 },
    description: { type: 'string', maxLength: 1000 },
  }),
  teamsController.updateTeam
);

// DELETE /api/v1/teams/:id - Delete team (admin only)
router.delete('/:id', requireTeamMembership('admin'), teamsController.deleteTeam);

// GET /api/v1/teams/:id/members - List team members
router.get('/:id/members', requireTeamMembership(), teamsController.getMembers);

// POST /api/v1/teams/:id/members - Add member (admin only)
router.post(
  '/:id/members',
  requireTeamMembership('admin'),
  validateBody({
    userId: { required: true, type: 'string' },
    role: { type: 'string' },
  }),
  teamsController.addMember
);

// PATCH /api/v1/teams/:id/members/:userId - Update member role (admin only)
router.patch(
  '/:id/members/:userId',
  requireTeamMembership('admin'),
  validateBody({
    role: { required: true, type: 'string' },
  }),
  teamsController.updateMemberRole
);

// DELETE /api/v1/teams/:id/members/:userId - Remove member (admin only)
router.delete('/:id/members/:userId', requireTeamMembership('admin'), teamsController.removeMember);

// GET /api/v1/teams/:id/users/search - Search users to add
router.get('/:id/users/search', requireTeamMembership('admin'), teamsController.searchUsers);

export default router;
