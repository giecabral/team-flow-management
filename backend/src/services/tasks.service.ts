import { v4 as uuidv4 } from 'uuid';
import db from '../config/database.js';
import type {
  TaskRow, TaskCommentRow, Task, TaskWithDetails, TaskComment,
  TaskStatus, TaskPriority, TeamRole, User, UserRow,
} from '../types/index.js';

// ─── Mappers ────────────────────────────────────────────────────────────────

function toTask(row: TaskRow): Task {
  return {
    id: row.id,
    teamId: row.team_id,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    dueDate: row.due_date,
    assignedTo: row.assigned_to,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    labels: [],
  };
}

function toUser(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toComment(row: TaskCommentRow & Partial<UserRow>): TaskComment {
  const comment: TaskComment = {
    id: row.id,
    taskId: row.task_id,
    userId: row.user_id,
    content: row.content,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
  if (row.email) {
    comment.user = {
      id: row.user_id,
      email: row.email,
      firstName: row.first_name!,
      lastName: row.last_name!,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
  return comment;
}

// ─── Tasks ──────────────────────────────────────────────────────────────────

interface ListTasksFilters {
  status?: TaskStatus;
  assignedTo?: string;
}

export function listTasks(teamId: string, filters: ListTasksFilters = {}): TaskWithDetails[] {
  const conditions: string[] = ['t.team_id = ?'];
  const params: (string | null)[] = [teamId];

  if (filters.status) {
    conditions.push('t.status = ?');
    params.push(filters.status);
  }
  if (filters.assignedTo) {
    conditions.push('t.assigned_to = ?');
    params.push(filters.assignedTo);
  }

  const rows = db.prepare(`
    SELECT
      t.*,
      au.id        AS au_id,  au.email      AS au_email,
      au.first_name AS au_fn, au.last_name  AS au_ln,
      au.created_at AS au_ca, au.updated_at AS au_ua,
      cu.id        AS cu_id,  cu.email      AS cu_email,
      cu.first_name AS cu_fn, cu.last_name  AS cu_ln,
      cu.created_at AS cu_ca, cu.updated_at AS cu_ua,
      (SELECT COUNT(*) FROM task_comments tc WHERE tc.task_id = t.id) AS comment_count
    FROM tasks t
    LEFT JOIN users au ON au.id = t.assigned_to
    JOIN      users cu ON cu.id = t.created_by
    WHERE ${conditions.join(' AND ')}
    ORDER BY t.created_at DESC
  `).all(...params) as (TaskRow & {
    au_id: string | null; au_email: string | null; au_fn: string | null;
    au_ln: string | null; au_ca: string | null; au_ua: string | null;
    cu_id: string; cu_email: string; cu_fn: string;
    cu_ln: string; cu_ca: string; cu_ua: string;
    comment_count: number;
  })[];

  return rows.map((row) => ({
    ...toTask(row),
    commentCount: row.comment_count,
    creator: {
      id: row.cu_id, email: row.cu_email,
      firstName: row.cu_fn, lastName: row.cu_ln,
      createdAt: row.cu_ca, updatedAt: row.cu_ua,
    },
    ...(row.au_id ? {
      assignedUser: {
        id: row.au_id, email: row.au_email!,
        firstName: row.au_fn!, lastName: row.au_ln!,
        createdAt: row.au_ca!, updatedAt: row.au_ua!,
      },
    } : {}),
  }));
}

interface CreateTaskData {
  teamId: string;
  title: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string | null;
  assignedTo?: string | null;
  createdBy: string;
}

export function createTask(data: CreateTaskData): TaskWithDetails {
  const id = uuidv4();
  db.prepare(`
    INSERT INTO tasks (id, team_id, title, description, status, priority, due_date, assigned_to, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    data.teamId,
    data.title,
    data.description ?? null,
    data.status ?? 'todo',
    data.priority ?? 'medium',
    data.dueDate ?? null,
    data.assignedTo ?? null,
    data.createdBy,
  );

  return getTaskById(id)!;
}

export function getTaskById(taskId: string): TaskWithDetails | null {
  const row = db.prepare(`
    SELECT
      t.*,
      au.id        AS au_id,  au.email      AS au_email,
      au.first_name AS au_fn, au.last_name  AS au_ln,
      au.created_at AS au_ca, au.updated_at AS au_ua,
      cu.id        AS cu_id,  cu.email      AS cu_email,
      cu.first_name AS cu_fn, cu.last_name  AS cu_ln,
      cu.created_at AS cu_ca, cu.updated_at AS cu_ua,
      (SELECT COUNT(*) FROM task_comments tc WHERE tc.task_id = t.id) AS comment_count
    FROM tasks t
    LEFT JOIN users au ON au.id = t.assigned_to
    JOIN      users cu ON cu.id = t.created_by
    WHERE t.id = ?
  `).get(taskId) as (TaskRow & {
    au_id: string | null; au_email: string | null; au_fn: string | null;
    au_ln: string | null; au_ca: string | null; au_ua: string | null;
    cu_id: string; cu_email: string; cu_fn: string;
    cu_ln: string; cu_ca: string; cu_ua: string;
    comment_count: number;
  }) | undefined;

  if (!row) return null;

  return {
    ...toTask(row),
    commentCount: row.comment_count,
    creator: {
      id: row.cu_id, email: row.cu_email,
      firstName: row.cu_fn, lastName: row.cu_ln,
      createdAt: row.cu_ca, updatedAt: row.cu_ua,
    },
    ...(row.au_id ? {
      assignedUser: {
        id: row.au_id, email: row.au_email!,
        firstName: row.au_fn!, lastName: row.au_ln!,
        createdAt: row.au_ca!, updatedAt: row.au_ua!,
      },
    } : {}),
  };
}

interface UpdateTaskData {
  title?: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string | null;
  assignedTo?: string | null;
}

export function updateTask(
  taskId: string,
  data: UpdateTaskData,
  requesterId: string,
  requesterRole: TeamRole,
): TaskWithDetails {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId) as TaskRow | undefined;
  if (!task) {
    throw Object.assign(new Error('Task not found'), { statusCode: 404, code: 'TASK_NOT_FOUND' });
  }

  const canEdit = requesterRole === 'admin' || task.assigned_to === requesterId;
  if (!canEdit) {
    throw Object.assign(
      new Error('Only admins or the assigned user can edit this task'),
      { statusCode: 403, code: 'FORBIDDEN' },
    );
  }

  const updates: string[] = ["updated_at = datetime('now')"];
  const values: (string | null)[] = [];

  if (data.title !== undefined) { updates.push('title = ?'); values.push(data.title); }
  if (data.description !== undefined) { updates.push('description = ?'); values.push(data.description); }
  if (data.status !== undefined) { updates.push('status = ?'); values.push(data.status); }
  if (data.priority !== undefined) { updates.push('priority = ?'); values.push(data.priority); }
  if ('dueDate' in data) { updates.push('due_date = ?'); values.push(data.dueDate ?? null); }
  if ('assignedTo' in data) { updates.push('assigned_to = ?'); values.push(data.assignedTo ?? null); }

  values.push(taskId);
  db.prepare(`UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`).run(...values);

  return getTaskById(taskId)!;
}

export function deleteTask(taskId: string, requesterId: string, requesterRole: TeamRole): void {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId) as TaskRow | undefined;
  if (!task) {
    throw Object.assign(new Error('Task not found'), { statusCode: 404, code: 'TASK_NOT_FOUND' });
  }

  const canDelete = requesterRole === 'admin' || task.assigned_to === requesterId;
  if (!canDelete) {
    throw Object.assign(
      new Error('Only admins or the assigned user can delete this task'),
      { statusCode: 403, code: 'FORBIDDEN' },
    );
  }

  db.prepare('DELETE FROM tasks WHERE id = ?').run(taskId);
}

// ─── Comments ───────────────────────────────────────────────────────────────

export function listComments(taskId: string): TaskComment[] {
  const rows = db.prepare(`
    SELECT tc.*, u.email, u.first_name, u.last_name, u.created_at AS u_ca, u.updated_at AS u_ua
    FROM task_comments tc
    JOIN users u ON u.id = tc.user_id
    WHERE tc.task_id = ?
    ORDER BY tc.created_at ASC
  `).all(taskId) as (TaskCommentRow & {
    email: string; first_name: string; last_name: string; u_ca: string; u_ua: string;
  })[];

  return rows.map((row) => ({
    id: row.id,
    taskId: row.task_id,
    userId: row.user_id,
    content: row.content,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    user: {
      id: row.user_id,
      email: row.email,
      firstName: row.first_name,
      lastName: row.last_name,
      createdAt: row.u_ca,
      updatedAt: row.u_ua,
    },
  }));
}

export function addComment(taskId: string, userId: string, content: string): TaskComment {
  const task = db.prepare('SELECT id FROM tasks WHERE id = ?').get(taskId);
  if (!task) {
    throw Object.assign(new Error('Task not found'), { statusCode: 404, code: 'TASK_NOT_FOUND' });
  }

  const id = uuidv4();
  db.prepare(`
    INSERT INTO task_comments (id, task_id, user_id, content)
    VALUES (?, ?, ?, ?)
  `).run(id, taskId, userId, content);

  const row = db.prepare(`
    SELECT tc.*, u.email, u.first_name, u.last_name, u.created_at AS u_ca, u.updated_at AS u_ua
    FROM task_comments tc
    JOIN users u ON u.id = tc.user_id
    WHERE tc.id = ?
  `).get(id) as TaskCommentRow & {
    email: string; first_name: string; last_name: string; u_ca: string; u_ua: string;
  };

  return {
    id: row.id,
    taskId: row.task_id,
    userId: row.user_id,
    content: row.content,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    user: {
      id: row.user_id,
      email: row.email,
      firstName: row.first_name,
      lastName: row.last_name,
      createdAt: row.u_ca,
      updatedAt: row.u_ua,
    },
  };
}

export function updateComment(
  commentId: string,
  content: string,
  requesterId: string,
  requesterRole: TeamRole,
): TaskComment {
  const comment = db.prepare('SELECT * FROM task_comments WHERE id = ?').get(commentId) as
    TaskCommentRow | undefined;

  if (!comment) {
    throw Object.assign(new Error('Comment not found'), { statusCode: 404, code: 'COMMENT_NOT_FOUND' });
  }

  const canEdit = requesterRole === 'admin' || comment.user_id === requesterId;
  if (!canEdit) {
    throw Object.assign(
      new Error('You can only edit your own comments'),
      { statusCode: 403, code: 'FORBIDDEN' },
    );
  }

  db.prepare(`
    UPDATE task_comments SET content = ?, updated_at = datetime('now') WHERE id = ?
  `).run(content, commentId);

  const row = db.prepare(`
    SELECT tc.*, u.email, u.first_name, u.last_name, u.created_at AS u_ca, u.updated_at AS u_ua
    FROM task_comments tc
    JOIN users u ON u.id = tc.user_id
    WHERE tc.id = ?
  `).get(commentId) as TaskCommentRow & {
    email: string; first_name: string; last_name: string; u_ca: string; u_ua: string;
  };

  return {
    id: row.id,
    taskId: row.task_id,
    userId: row.user_id,
    content: row.content,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    user: {
      id: row.user_id,
      email: row.email,
      firstName: row.first_name,
      lastName: row.last_name,
      createdAt: row.u_ca,
      updatedAt: row.u_ua,
    },
  };
}

export function deleteComment(
  commentId: string,
  requesterId: string,
  requesterRole: TeamRole,
): void {
  const comment = db.prepare('SELECT * FROM task_comments WHERE id = ?').get(commentId) as
    TaskCommentRow | undefined;

  if (!comment) {
    throw Object.assign(new Error('Comment not found'), { statusCode: 404, code: 'COMMENT_NOT_FOUND' });
  }

  const canDelete = requesterRole === 'admin' || comment.user_id === requesterId;
  if (!canDelete) {
    throw Object.assign(
      new Error('You can only delete your own comments'),
      { statusCode: 403, code: 'FORBIDDEN' },
    );
  }

  db.prepare('DELETE FROM task_comments WHERE id = ?').run(commentId);
}

// ─── My Tasks ───────────────────────────────────────────────────────────────

export interface MyTask extends Task {
  teamName: string;
  assignedUser?: User;
  creator: User;
  commentCount: number;
}

export function getMyTasks(userId: string): MyTask[] {
  const rows = db.prepare(`
    SELECT
      t.*,
      te.name      AS team_name,
      cu.id        AS cu_id,  cu.email      AS cu_email,
      cu.first_name AS cu_fn, cu.last_name  AS cu_ln,
      cu.created_at AS cu_ca, cu.updated_at AS cu_ua,
      (SELECT COUNT(*) FROM task_comments tc WHERE tc.task_id = t.id) AS comment_count
    FROM tasks t
    JOIN teams te ON te.id = t.team_id
    JOIN users cu ON cu.id = t.created_by
    WHERE t.assigned_to = ?
    ORDER BY
      CASE t.status WHEN 'todo' THEN 0 WHEN 'in_progress' THEN 1 ELSE 2 END,
      t.due_date ASC NULLS LAST,
      t.created_at DESC
  `).all(userId) as (TaskRow & {
    team_name: string;
    cu_id: string; cu_email: string; cu_fn: string;
    cu_ln: string; cu_ca: string; cu_ua: string;
    comment_count: number;
  })[];

  return rows.map((row) => ({
    ...toTask(row),
    teamName: row.team_name,
    commentCount: row.comment_count,
    creator: {
      id: row.cu_id, email: row.cu_email,
      firstName: row.cu_fn, lastName: row.cu_ln,
      createdAt: row.cu_ca, updatedAt: row.cu_ua,
    },
  }));
}
