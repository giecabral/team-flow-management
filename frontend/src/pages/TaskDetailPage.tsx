import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import * as tasksService from '@/services/tasks.service';
import * as teamsService from '@/services/teams.service';
import * as usersService from '@/services/users.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { ArrowLeft, Trash2, Pencil, Check, X, Send } from 'lucide-react';
import type { TaskWithDetails, TaskComment, TaskStatus, TaskPriority, TeamMember, TeamRole, User } from '@/types';

const PRIORITY_BADGE: Record<TaskPriority, string> = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-green-100 text-green-700',
};

const STATUS_BADGE: Record<TaskStatus, string> = {
  todo: 'bg-slate-100 text-slate-600',
  in_progress: 'bg-blue-100 text-blue-700',
  done: 'bg-green-100 text-green-700',
};

const STATUS_LABEL: Record<TaskStatus, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  done: 'Done',
};

export default function TaskDetailPage() {
  // teamId is optional — absent when accessed via /tasks/:taskId (global context)
  const { teamId, taskId } = useParams<{ teamId?: string; taskId: string }>();
  const isGlobal = !teamId;
  const navigate = useNavigate();
  const { user } = useAuth();

  const [task, setTask] = useState<TaskWithDetails | null>(null);
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState<TeamRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editStatus, setEditStatus] = useState<TaskStatus>('todo');
  const [editPriority, setEditPriority] = useState<TaskPriority>('medium');
  const [editDueDate, setEditDueDate] = useState('');
  const [editAssignedTo, setEditAssignedTo] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Comment state
  const [commentText, setCommentText] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');

  useEffect(() => {
    if (taskId) fetchData();
  }, [taskId, teamId]);

  const fetchData = async () => {
    try {
      if (isGlobal) {
        const [taskData, commentsData] = await Promise.all([
          tasksService.getGlobalTask(taskId!),
          tasksService.listGlobalComments(taskId!),
        ]);
        setTask(taskData);
        setComments(commentsData);
        // For global context, if task has a team, load members for assignee editing
        if (taskData.teamId) {
          const membersData = await teamsService.getTeamMembers(taskData.teamId);
          setMembers(membersData);
        }
      } else {
        const [taskData, commentsData, membersData] = await Promise.all([
          tasksService.getTask(teamId!, taskId!),
          tasksService.listComments(teamId!, taskId!),
          teamsService.getTeamMembers(teamId!),
        ]);
        setTask(taskData);
        setComments(commentsData);
        setMembers(membersData);
        const me = membersData.find((m) => m.userId === user?.id);
        setCurrentUserRole(me?.role ?? null);
      }
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load task' });
      navigate(isGlobal ? '/tasks' : `/teams/${teamId}/tasks`);
    } finally {
      setIsLoading(false);
    }
  };

  const startEditing = async () => {
    if (!task) return;
    setEditTitle(task.title);
    setEditDescription(task.description ?? '');
    setEditStatus(task.status);
    setEditPriority(task.priority);
    setEditDueDate(task.dueDate ?? '');
    setEditAssignedTo(task.assignedTo ?? '');
    // In global context, fetch the full user list for the assignee dropdown
    if (isGlobal && allUsers.length === 0) {
      const users = await usersService.listUsers().catch(() => []);
      setAllUsers(users);
    }
    setIsEditing(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload = {
        title: editTitle,
        description: editDescription || null,
        status: editStatus,
        priority: editPriority,
        dueDate: editDueDate || null,
        assignedTo: editAssignedTo || null,
      };
      const updated = isGlobal
        ? await tasksService.updateGlobalTask(taskId!, payload)
        : await tasksService.updateTask(teamId!, taskId!, payload);
      setTask(updated);
      setIsEditing(false);
      toast({ title: 'Task saved' });
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to save task' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this task? This cannot be undone.')) return;
    try {
      if (isGlobal) {
        await tasksService.deleteGlobalTask(taskId!);
      } else {
        await tasksService.deleteTask(teamId!, taskId!);
      }
      toast({ title: 'Task deleted' });
      navigate(isGlobal ? '/tasks' : `/teams/${teamId}/tasks`);
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete task' });
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setIsPosting(true);
    try {
      const comment = isGlobal
        ? await tasksService.addGlobalComment(taskId!, commentText.trim())
        : await tasksService.addComment(teamId!, taskId!, commentText.trim());
      setComments((prev) => [...prev, comment]);
      setCommentText('');
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to post comment' });
    } finally {
      setIsPosting(false);
    }
  };

  const handleSaveComment = async (commentId: string) => {
    if (!editingCommentText.trim()) return;
    try {
      const updated = isGlobal
        ? await tasksService.updateGlobalComment(taskId!, commentId, editingCommentText.trim())
        : await tasksService.updateComment(teamId!, taskId!, commentId, editingCommentText.trim());
      setComments((prev) => prev.map((c) => (c.id === commentId ? updated : c)));
      setEditingCommentId(null);
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to update comment' });
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      if (isGlobal) {
        await tasksService.deleteGlobalComment(taskId!, commentId);
      } else {
        await tasksService.deleteComment(teamId!, taskId!, commentId);
      }
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete comment' });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!task) return null;

  // Permission check differs by context
  const canEdit = isGlobal
    ? (task.createdBy === user?.id || task.assignedTo === user?.id)
    : (currentUserRole === 'admin' || task.assignedTo === user?.id);

  // Only admin/manager can change who a task is assigned to in team context.
  // In global context anyone who can edit the task can reassign it.
  const canEditAssignee = isGlobal || currentUserRole === 'admin' || currentUserRole === 'manager';

  const backPath = isGlobal ? '/tasks' : `/teams/${teamId}/tasks`;

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(backPath)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="text-xl font-bold h-auto py-1"
            />
          ) : (
            <h1 className="text-2xl font-bold truncate">{task.title}</h1>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {canEdit && !isEditing && (
            <>
              <Button variant="outline" size="sm" onClick={startEditing}>
                <Pencil className="h-4 w-4 mr-1.5" />
                Edit
              </Button>
              <Button variant="destructive" size="sm" onClick={handleDelete}>
                <Trash2 className="h-4 w-4 mr-1.5" />
                Delete
              </Button>
            </>
          )}
          {isEditing && (
            <>
              <Button size="sm" onClick={handleSave} disabled={isSaving}>
                <Check className="h-4 w-4 mr-1.5" />
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                <X className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Task details */}
      <Card>
        <CardContent className="pt-6 space-y-5">
          {/* Status / Priority / Due / Assignee row */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Status</Label>
              {isEditing ? (
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as TaskStatus)}
                  className="w-full rounded-md border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="done">Done</option>
                </select>
              ) : (
                <span className={`inline-block text-xs font-medium px-2 py-1 rounded-full ${STATUS_BADGE[task.status]}`}>
                  {STATUS_LABEL[task.status]}
                </span>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Priority</Label>
              {isEditing ? (
                <select
                  value={editPriority}
                  onChange={(e) => setEditPriority(e.target.value as TaskPriority)}
                  className="w-full rounded-md border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              ) : (
                <span className={`inline-block text-xs font-medium px-2 py-1 rounded-full ${PRIORITY_BADGE[task.priority]}`}>
                  {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                </span>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Due Date</Label>
              {isEditing ? (
                <Input
                  type="date"
                  value={editDueDate}
                  onChange={(e) => setEditDueDate(e.target.value)}
                  className="h-8 text-sm"
                />
              ) : (
                <p className="text-sm">
                  {task.dueDate
                    ? new Date(task.dueDate).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric',
                      })
                    : <span className="text-muted-foreground">—</span>
                  }
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Assignee</Label>
              {isEditing && canEditAssignee ? (
                <select
                  value={editAssignedTo}
                  onChange={(e) => setEditAssignedTo(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Unassigned</option>
                  {isGlobal
                    ? allUsers.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.firstName} {u.lastName}
                        </option>
                      ))
                    : members.map((m) => (
                        <option key={m.userId} value={m.userId}>
                          {m.user?.firstName} {m.user?.lastName}
                        </option>
                      ))}
                </select>
              ) : task.assignedUser ? (
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                    {task.assignedUser.firstName.charAt(0)}{task.assignedUser.lastName.charAt(0)}
                  </div>
                  <span className="text-sm">
                    {task.assignedUser.firstName} {task.assignedUser.lastName}
                  </span>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Unassigned</p>
              )}
            </div>
          </div>

          {/* Created by */}
          <div className="text-xs text-muted-foreground border-t pt-3">
            Created by <span className="font-medium">{task.creator.firstName} {task.creator.lastName}</span>
            {' · '}
            {new Date(task.createdAt).toLocaleDateString('en-US', {
              month: 'short', day: 'numeric', year: 'numeric',
            })}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Description</Label>
            {isEditing ? (
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={5}
                placeholder="Add a description..."
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
            ) : task.description ? (
              <p className="text-sm whitespace-pre-wrap">{task.description}</p>
            ) : (
              <p className="text-sm text-muted-foreground italic">No description.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Comments */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Comments {comments.length > 0 && <span className="text-muted-foreground font-normal">({comments.length})</span>}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {comments.length === 0 && (
            <p className="text-sm text-muted-foreground">No comments yet.</p>
          )}

          {comments.map((comment) => {
            const isOwnComment = comment.userId === user?.id;
            const canEditComment = isOwnComment || (!isGlobal && currentUserRole === 'admin');

            return (
              <div key={comment.id} className="flex gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-medium flex-shrink-0">
                  {comment.user?.firstName?.charAt(0).toUpperCase()}
                  {comment.user?.lastName?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-medium">
                      {comment.user?.firstName} {comment.user?.lastName}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(comment.createdAt).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric',
                      })}
                      {comment.updatedAt !== comment.createdAt && ' (edited)'}
                    </span>
                  </div>

                  {editingCommentId === comment.id ? (
                    <div className="space-y-2">
                      <textarea
                        value={editingCommentText}
                        onChange={(e) => setEditingCommentText(e.target.value)}
                        rows={3}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleSaveComment(comment.id)}>Save</Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingCommentId(null)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="group flex items-start gap-2">
                      <p className="text-sm flex-1 whitespace-pre-wrap">{comment.content}</p>
                      {canEditComment && (
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                          {isOwnComment && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => {
                                setEditingCommentId(comment.id);
                                setEditingCommentText(comment.content);
                              }}
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-destructive hover:text-destructive"
                            onClick={() => handleDeleteComment(comment.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Comment form */}
          <form onSubmit={handlePostComment} className="flex gap-3 pt-2 border-t">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex-shrink-0">
              {user?.email?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 flex gap-2">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write a comment..."
                rows={1}
                className="flex-1 rounded-md border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handlePostComment(e as unknown as React.FormEvent);
                  }
                }}
              />
              <Button type="submit" size="icon" disabled={isPosting || !commentText.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
