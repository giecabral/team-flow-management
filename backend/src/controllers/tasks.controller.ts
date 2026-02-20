import { Response, NextFunction } from 'express';
import * as tasksService from '../services/tasks.service.js';
import * as apiResponse from '../utils/apiResponse.js';
import type { AuthRequest, TaskStatus } from '../types/index.js';

// GET /api/v1/teams/:teamId/tasks
export function listTasks(req: AuthRequest, res: Response, next: NextFunction): void {
  try {
    const { teamId } = req.params;
    const { status, assignedTo } = req.query;

    const tasks = tasksService.listTasks(teamId, {
      status: typeof status === 'string' ? (status as TaskStatus) : undefined,
      assignedTo: typeof assignedTo === 'string' ? assignedTo : undefined,
    });
    apiResponse.success(res, tasks);
  } catch (error) {
    next(error);
  }
}

// POST /api/v1/teams/:teamId/tasks
export function createTask(req: AuthRequest, res: Response, next: NextFunction): void {
  try {
    const { teamId } = req.params;
    const userId = req.user!.id;
    const { title, description, status, priority, dueDate, assignedTo } = req.body;

    const task = tasksService.createTask({
      teamId,
      title,
      description: description ?? null,
      status,
      priority,
      dueDate: dueDate ?? null,
      assignedTo: assignedTo ?? null,
      createdBy: userId,
    });
    apiResponse.created(res, task);
  } catch (error) {
    next(error);
  }
}

// GET /api/v1/teams/:teamId/tasks/:taskId
export function getTask(req: AuthRequest, res: Response, next: NextFunction): void {
  try {
    const { taskId } = req.params;
    const task = tasksService.getTaskById(taskId);
    if (!task) {
      apiResponse.notFound(res, 'Task not found');
      return;
    }
    apiResponse.success(res, task);
  } catch (error) {
    next(error);
  }
}

// PATCH /api/v1/teams/:teamId/tasks/:taskId
export function updateTask(req: AuthRequest, res: Response, next: NextFunction): void {
  try {
    const { taskId } = req.params;
    const userId = req.user!.id;
    const role = req.teamMembership!.role;
    const { title, description, status, priority, dueDate, assignedTo } = req.body;

    const task = tasksService.updateTask(
      taskId,
      { title, description, status, priority, dueDate, assignedTo },
      userId,
      role,
    );
    apiResponse.success(res, task);
  } catch (error) {
    next(error);
  }
}

// DELETE /api/v1/teams/:teamId/tasks/:taskId
export function deleteTask(req: AuthRequest, res: Response, next: NextFunction): void {
  try {
    const { taskId } = req.params;
    const userId = req.user!.id;
    const role = req.teamMembership!.role;

    tasksService.deleteTask(taskId, userId, role);
    apiResponse.noContent(res);
  } catch (error) {
    next(error);
  }
}

// GET /api/v1/teams/:teamId/tasks/:taskId/comments
export function listComments(req: AuthRequest, res: Response, next: NextFunction): void {
  try {
    const { taskId } = req.params;
    const comments = tasksService.listComments(taskId);
    apiResponse.success(res, comments);
  } catch (error) {
    next(error);
  }
}

// POST /api/v1/teams/:teamId/tasks/:taskId/comments
export function addComment(req: AuthRequest, res: Response, next: NextFunction): void {
  try {
    const { taskId } = req.params;
    const userId = req.user!.id;
    const { content } = req.body;

    const comment = tasksService.addComment(taskId, userId, content);
    apiResponse.created(res, comment);
  } catch (error) {
    next(error);
  }
}

// PATCH /api/v1/teams/:teamId/tasks/:taskId/comments/:commentId
export function updateComment(req: AuthRequest, res: Response, next: NextFunction): void {
  try {
    const { commentId } = req.params;
    const userId = req.user!.id;
    const role = req.teamMembership!.role;
    const { content } = req.body;

    const comment = tasksService.updateComment(commentId, content, userId, role);
    apiResponse.success(res, comment);
  } catch (error) {
    next(error);
  }
}

// DELETE /api/v1/teams/:teamId/tasks/:taskId/comments/:commentId
export function deleteComment(req: AuthRequest, res: Response, next: NextFunction): void {
  try {
    const { commentId } = req.params;
    const userId = req.user!.id;
    const role = req.teamMembership!.role;

    tasksService.deleteComment(commentId, userId, role);
    apiResponse.noContent(res);
  } catch (error) {
    next(error);
  }
}

// GET /api/v1/tasks/me
export function getMyTasks(req: AuthRequest, res: Response, next: NextFunction): void {
  try {
    const userId = req.user!.id;
    const tasks = tasksService.getMyTasks(userId);
    apiResponse.success(res, tasks);
  } catch (error) {
    next(error);
  }
}
