import { Response, NextFunction } from 'express';
import * as teamsService from '../services/teams.service.js';
import * as apiResponse from '../utils/apiResponse.js';
import type { AuthRequest } from '../types/index.js';

// GET /api/v1/teams
export function getTeams(req: AuthRequest, res: Response, next: NextFunction): void {
  try {
    const userId = req.user!.id;
    const teams = teamsService.getUserTeams(userId);
    apiResponse.success(res, teams);
  } catch (error) {
    next(error);
  }
}

// POST /api/v1/teams
export function createTeam(req: AuthRequest, res: Response, next: NextFunction): void {
  try {
    const userId = req.user!.id;
    const { name, description } = req.body;
    const team = teamsService.createTeam(name, description || null, userId);
    apiResponse.created(res, team);
  } catch (error) {
    next(error);
  }
}

// GET /api/v1/teams/:id
export function getTeam(req: AuthRequest, res: Response, next: NextFunction): void {
  try {
    const { id } = req.params;
    const team = teamsService.getTeamById(id);
    if (!team) {
      apiResponse.notFound(res, 'Team not found');
      return;
    }
    apiResponse.success(res, team);
  } catch (error) {
    next(error);
  }
}

// PATCH /api/v1/teams/:id
export function updateTeam(req: AuthRequest, res: Response, next: NextFunction): void {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const team = teamsService.updateTeam(id, name, description);
    apiResponse.success(res, team);
  } catch (error) {
    next(error);
  }
}

// DELETE /api/v1/teams/:id
export function deleteTeam(req: AuthRequest, res: Response, next: NextFunction): void {
  try {
    const { id } = req.params;
    teamsService.deleteTeam(id);
    apiResponse.noContent(res);
  } catch (error) {
    next(error);
  }
}

// GET /api/v1/teams/:id/members
export function getMembers(req: AuthRequest, res: Response, next: NextFunction): void {
  try {
    const { id } = req.params;
    const members = teamsService.getTeamMembers(id);
    apiResponse.success(res, members);
  } catch (error) {
    next(error);
  }
}

// POST /api/v1/teams/:id/members
export function addMember(req: AuthRequest, res: Response, next: NextFunction): void {
  try {
    const { id } = req.params;
    const { userId, role } = req.body;
    const member = teamsService.addMember(id, userId, role || 'member');
    apiResponse.created(res, member);
  } catch (error) {
    next(error);
  }
}

// PATCH /api/v1/teams/:id/members/:userId
export function updateMemberRole(req: AuthRequest, res: Response, next: NextFunction): void {
  try {
    const { id, userId } = req.params;
    const { role } = req.body;
    const member = teamsService.updateMemberRole(id, userId, role);
    apiResponse.success(res, member);
  } catch (error) {
    next(error);
  }
}

// DELETE /api/v1/teams/:id/members/:userId
export function removeMember(req: AuthRequest, res: Response, next: NextFunction): void {
  try {
    const { id, userId } = req.params;
    teamsService.removeMember(id, userId);
    apiResponse.noContent(res);
  } catch (error) {
    next(error);
  }
}

// GET /api/v1/teams/:id/users/search
export function searchUsers(req: AuthRequest, res: Response, next: NextFunction): void {
  try {
    const { id } = req.params;
    const { q } = req.query;
    if (!q || typeof q !== 'string') {
      apiResponse.badRequest(res, 'Search query is required');
      return;
    }
    const users = teamsService.searchUsers(q, id);
    apiResponse.success(res, users);
  } catch (error) {
    next(error);
  }
}
