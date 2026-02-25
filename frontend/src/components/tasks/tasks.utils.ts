import type { TaskPriority, TaskStatus } from '@/types';

export const PRIORITY_DOT: Record<TaskPriority, string> = {
  high: 'bg-red-500',
  medium: 'bg-yellow-400',
  low: 'bg-green-500',
};

export const STATUS_LABEL: Record<TaskStatus, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  done: 'Done',
};

export const STATUS_BADGE: Record<TaskStatus, string> = {
  todo: 'bg-muted text-muted-foreground',
  in_progress: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  done: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
};

export const KANBAN_COLUMNS: { status: TaskStatus; label: string; headerClass: string }[] = [
  { status: 'todo',        label: 'To Do',       headerClass: 'text-foreground' },
  { status: 'in_progress', label: 'In Progress',  headerClass: 'text-blue-600 dark:text-blue-400' },
  { status: 'done',        label: 'Done',         headerClass: 'text-green-600 dark:text-green-400' },
];

export function isOverdue(dueDate: string | null, status: TaskStatus): boolean {
  if (!dueDate || status === 'done') return false;
  return new Date(dueDate) < new Date(new Date().toDateString());
}
