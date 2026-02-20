import { Response, NextFunction } from 'express';
import * as tasksService from '../services/tasks.service.js';
import * as apiResponse from '../utils/apiResponse.js';
import type { AuthRequest, TaskStatus } from '../types/index.js';

export async function listTasks(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const status = req.query.status as TaskStatus | undefined;
    const teamId = req.query.teamId as string | undefined;

    const tasks = tasksService.listGlobalTasks(userId, { status, teamId });
    apiResponse.success(res, tasks);
  } catch (err) {
    next(err);
  }
}

export async function createTask(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const task = tasksService.createGlobalTask({
      ...req.body,
      createdBy: req.user!.id,
    });
    apiResponse.created(res, task);
  } catch (err) {
    next(err);
  }
}

export async function getTask(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const task = tasksService.getGlobalTaskById(req.params.taskId, req.user!.id);
    if (!task) {
      apiResponse.notFound(res, 'Task not found');
      return;
    }
    apiResponse.success(res, task);
  } catch (err) {
    next(err);
  }
}

export async function updateTask(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const task = tasksService.updateGlobalTask(req.params.taskId, req.body, req.user!.id);
    apiResponse.success(res, task);
  } catch (err) {
    next(err);
  }
}

export async function deleteTask(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    tasksService.deleteGlobalTask(req.params.taskId, req.user!.id);
    apiResponse.noContent(res);
  } catch (err) {
    next(err);
  }
}

export async function listComments(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    // Verify access
    const task = tasksService.getGlobalTaskById(req.params.taskId, req.user!.id);
    if (!task) {
      apiResponse.notFound(res, 'Task not found');
      return;
    }
    const comments = tasksService.listComments(req.params.taskId);
    apiResponse.success(res, comments);
  } catch (err) {
    next(err);
  }
}

export async function addComment(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const comment = tasksService.addGlobalComment(req.params.taskId, req.user!.id, req.body.content);
    apiResponse.created(res, comment);
  } catch (err) {
    next(err);
  }
}

export async function updateComment(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const comment = tasksService.updateGlobalComment(req.params.commentId, req.body.content, req.user!.id);
    apiResponse.success(res, comment);
  } catch (err) {
    next(err);
  }
}

export async function deleteComment(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    tasksService.deleteGlobalComment(req.params.commentId, req.user!.id);
    apiResponse.noContent(res);
  } catch (err) {
    next(err);
  }
}

export async function getMyTasks(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const tasks = tasksService.getMyTasks(req.user!.id);
    apiResponse.success(res, tasks);
  } catch (err) {
    next(err);
  }
}
