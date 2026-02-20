import api from './api';
import type {
  TaskWithDetails, TaskComment, MyTask, TaskStatus, TaskPriority, ApiResponse,
} from '@/types';

export interface CreateTaskRequest {
  title: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string | null;
  assignedTo?: string | null;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string | null;
  assignedTo?: string | null;
}

export async function listTasks(
  teamId: string,
  filters?: { status?: TaskStatus; assignedTo?: string },
): Promise<TaskWithDetails[]> {
  const params = new URLSearchParams();
  if (filters?.status) params.set('status', filters.status);
  if (filters?.assignedTo) params.set('assignedTo', filters.assignedTo);
  const query = params.toString() ? `?${params.toString()}` : '';
  const response = await api.get<ApiResponse<TaskWithDetails[]>>(`/teams/${teamId}/tasks${query}`);
  return response.data.data!;
}

export async function createTask(
  teamId: string,
  data: CreateTaskRequest,
): Promise<TaskWithDetails> {
  const response = await api.post<ApiResponse<TaskWithDetails>>(`/teams/${teamId}/tasks`, data);
  return response.data.data!;
}

export async function getTask(teamId: string, taskId: string): Promise<TaskWithDetails> {
  const response = await api.get<ApiResponse<TaskWithDetails>>(`/teams/${teamId}/tasks/${taskId}`);
  return response.data.data!;
}

export async function updateTask(
  teamId: string,
  taskId: string,
  data: UpdateTaskRequest,
): Promise<TaskWithDetails> {
  const response = await api.patch<ApiResponse<TaskWithDetails>>(
    `/teams/${teamId}/tasks/${taskId}`,
    data,
  );
  return response.data.data!;
}

export async function deleteTask(teamId: string, taskId: string): Promise<void> {
  await api.delete(`/teams/${teamId}/tasks/${taskId}`);
}

export async function listComments(teamId: string, taskId: string): Promise<TaskComment[]> {
  const response = await api.get<ApiResponse<TaskComment[]>>(
    `/teams/${teamId}/tasks/${taskId}/comments`,
  );
  return response.data.data!;
}

export async function addComment(
  teamId: string,
  taskId: string,
  content: string,
): Promise<TaskComment> {
  const response = await api.post<ApiResponse<TaskComment>>(
    `/teams/${teamId}/tasks/${taskId}/comments`,
    { content },
  );
  return response.data.data!;
}

export async function updateComment(
  teamId: string,
  taskId: string,
  commentId: string,
  content: string,
): Promise<TaskComment> {
  const response = await api.patch<ApiResponse<TaskComment>>(
    `/teams/${teamId}/tasks/${taskId}/comments/${commentId}`,
    { content },
  );
  return response.data.data!;
}

export async function deleteComment(
  teamId: string,
  taskId: string,
  commentId: string,
): Promise<void> {
  await api.delete(`/teams/${teamId}/tasks/${taskId}/comments/${commentId}`);
}

export async function getMyTasks(): Promise<MyTask[]> {
  const response = await api.get<ApiResponse<MyTask[]>>('/tasks/me');
  return response.data.data!;
}

// ─── Global Tasks ────────────────────────────────────────────────────────────

export interface CreateGlobalTaskRequest {
  title: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string | null;
  teamId?: string | null;
  assignedTo?: string | null;
}

export async function listGlobalTasks(
  filters?: { status?: TaskStatus; teamId?: string },
): Promise<TaskWithDetails[]> {
  const params = new URLSearchParams();
  if (filters?.status) params.set('status', filters.status);
  if (filters?.teamId) params.set('teamId', filters.teamId);
  const query = params.toString() ? `?${params.toString()}` : '';
  const response = await api.get<ApiResponse<TaskWithDetails[]>>(`/tasks${query}`);
  return response.data.data!;
}

export async function createGlobalTask(data: CreateGlobalTaskRequest): Promise<TaskWithDetails> {
  const response = await api.post<ApiResponse<TaskWithDetails>>('/tasks', data);
  return response.data.data!;
}

export async function getGlobalTask(taskId: string): Promise<TaskWithDetails> {
  const response = await api.get<ApiResponse<TaskWithDetails>>(`/tasks/${taskId}`);
  return response.data.data!;
}

export async function updateGlobalTask(
  taskId: string,
  data: UpdateTaskRequest,
): Promise<TaskWithDetails> {
  const response = await api.patch<ApiResponse<TaskWithDetails>>(`/tasks/${taskId}`, data);
  return response.data.data!;
}

export async function deleteGlobalTask(taskId: string): Promise<void> {
  await api.delete(`/tasks/${taskId}`);
}

export async function listGlobalComments(taskId: string): Promise<TaskComment[]> {
  const response = await api.get<ApiResponse<TaskComment[]>>(`/tasks/${taskId}/comments`);
  return response.data.data!;
}

export async function addGlobalComment(taskId: string, content: string): Promise<TaskComment> {
  const response = await api.post<ApiResponse<TaskComment>>(`/tasks/${taskId}/comments`, { content });
  return response.data.data!;
}

export async function updateGlobalComment(
  taskId: string,
  commentId: string,
  content: string,
): Promise<TaskComment> {
  const response = await api.patch<ApiResponse<TaskComment>>(
    `/tasks/${taskId}/comments/${commentId}`,
    { content },
  );
  return response.data.data!;
}

export async function deleteGlobalComment(taskId: string, commentId: string): Promise<void> {
  await api.delete(`/tasks/${taskId}/comments/${commentId}`);
}
