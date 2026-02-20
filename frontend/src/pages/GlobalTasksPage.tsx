import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import * as tasksService from '@/services/tasks.service';
import * as teamsService from '@/services/teams.service';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  CalendarDays, MessageSquare, Plus, ListTodo,
} from 'lucide-react';
import type {
  TaskWithDetails, TaskStatus, TaskPriority, TeamWithRole, TeamMember,
} from '@/types';

const PRIORITY_DOT: Record<TaskPriority, string> = {
  high: 'bg-red-500',
  medium: 'bg-yellow-400',
  low: 'bg-green-500',
};

const STATUS_LABEL: Record<TaskStatus, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  done: 'Done',
};

const STATUS_BADGE: Record<TaskStatus, string> = {
  todo: 'bg-muted text-muted-foreground',
  in_progress: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  done: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
};

function isOverdue(dueDate: string | null, status: TaskStatus): boolean {
  if (!dueDate || status === 'done') return false;
  return new Date(dueDate) < new Date(new Date().toDateString());
}

const STATUS_FILTERS: { value: TaskStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
];

interface CreateForm {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  teamId: string;
  assignedTo: string;
}

const EMPTY_FORM: CreateForm = {
  title: '',
  description: '',
  status: 'todo',
  priority: 'medium',
  dueDate: '',
  teamId: '',
  assignedTo: '',
};

export default function GlobalTasksPage() {
  const [tasks, setTasks] = useState<TaskWithDetails[]>([]);
  const [teams, setTeams] = useState<TeamWithRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [teamFilter, setTeamFilter] = useState<string>('all');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<CreateForm>(EMPTY_FORM);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([
      tasksService.listGlobalTasks(),
      teamsService.getTeams(),
    ])
      .then(([t, tm]) => { setTasks(t); setTeams(tm); })
      .catch(() => toast({ variant: 'destructive', title: 'Error', description: 'Failed to load tasks' }))
      .finally(() => setIsLoading(false));
  }, []);

  // Load team members when team is selected in create dialog
  useEffect(() => {
    if (!form.teamId) {
      setTeamMembers([]);
      setForm((f) => ({ ...f, assignedTo: '' }));
      return;
    }
    teamsService.getTeamMembers(form.teamId)
      .then(setTeamMembers)
      .catch(() => setTeamMembers([]));
  }, [form.teamId]);

  const filteredTasks = tasks.filter((t) => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (teamFilter === 'personal' && t.teamId !== null) return false;
    if (teamFilter !== 'all' && teamFilter !== 'personal' && t.teamId !== teamFilter) return false;
    return true;
  });

  function openDialog() {
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  }

  async function handleCreate() {
    if (!form.title.trim()) return;
    setIsSubmitting(true);
    try {
      const task = await tasksService.createGlobalTask({
        title: form.title.trim(),
        description: form.description.trim() || null,
        status: form.status,
        priority: form.priority,
        dueDate: form.dueDate || null,
        teamId: form.teamId || null,
        assignedTo: form.assignedTo || null,
      });
      setTasks((prev) => [task, ...prev]);
      setDialogOpen(false);
      toast({ title: 'Task created' });
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to create task' });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ListTodo className="h-8 w-8" />
            Tasks
          </h1>
          <p className="text-muted-foreground mt-1">
            {tasks.length === 0
              ? 'No tasks yet.'
              : `${tasks.length} task${tasks.length !== 1 ? 's' : ''} across all teams`}
          </p>
        </div>
        <Button onClick={openDialog}>
          <Plus className="h-4 w-4 mr-1" />
          New Task
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Status tabs */}
        <div className="flex rounded-lg border overflow-hidden text-sm">
          {STATUS_FILTERS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setStatusFilter(value)}
              className={`px-3 py-1.5 transition-colors ${statusFilter === value
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-muted'
                }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Team filter */}
        <Select value={teamFilter} onValueChange={setTeamFilter}>
          <SelectTrigger className="w-40 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className='bg-white'>
            <SelectItem value="all">All Teams</SelectItem>
            <SelectItem value="personal">Personal</SelectItem>
            {teams.map((t) => (
              <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Task list */}
      {filteredTasks.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {tasks.length === 0 ? 'No tasks yet. Create your first task!' : 'No tasks match the selected filters.'}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {filteredTasks.map((task) => {
                const teamName = task.teamId
                  ? (teams.find((t) => t.id === task.teamId)?.name ?? 'Unknown Team')
                  : null;

                return (
                  <Link
                    key={task.id}
                    to={`/tasks/${task.id}`}
                    className="flex items-center gap-3 py-3 px-4 hover:bg-muted/50 transition-colors"
                  >
                    {/* Priority dot */}
                    <span
                      className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${PRIORITY_DOT[task.priority]}`}
                      title={`Priority: ${task.priority}`}
                    />

                    {/* Title */}
                    <span className="flex-1 text-sm font-medium truncate">{task.title}</span>

                    {/* Team badge */}
                    <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground flex-shrink-0">
                      {teamName ?? 'Personal'}
                    </span>

                    {/* Status badge */}
                    <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${STATUS_BADGE[task.status]}`}>
                      {STATUS_LABEL[task.status]}
                    </span>

                    {/* Comment count */}
                    {task.commentCount > 0 && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                        <MessageSquare className="h-3 w-3" />
                        {task.commentCount}
                      </span>
                    )}

                    {/* Due date */}
                    {task.dueDate && (
                      <span
                        className={`flex items-center gap-1 text-xs flex-shrink-0 ${isOverdue(task.dueDate, task.status)
                          ? 'text-red-500 font-medium'
                          : 'text-muted-foreground'
                          }`}
                      >
                        <CalendarDays className="h-3 w-3" />
                        {new Date(task.dueDate).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric',
                        })}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Task Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New Task</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Title */}
            <div className="space-y-1">
              <label className="text-sm font-medium">Title *</label>
              <input
                className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Task title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              />
            </div>

            {/* Description */}
            <div className="space-y-1">
              <label className="text-sm font-medium">Description</label>
              <textarea
                className="w-full border rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                rows={2}
                placeholder="Optional description"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>

            {/* Priority + Status row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-sm font-medium">Priority</label>
                <select
                  className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                  value={form.priority}
                  onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value as TaskPriority }))}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Status</label>
                <select
                  className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as TaskStatus }))}
                >
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="done">Done</option>
                </select>
              </div>
            </div>

            {/* Due date */}
            <div className="space-y-1">
              <label className="text-sm font-medium">Due Date</label>
              <input
                type="date"
                className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                value={form.dueDate}
                onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
              />
            </div>

            {/* Team (optional) */}
            <div className="space-y-1">
              <label className="text-sm font-medium">Team (optional)</label>
              <select
                className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                value={form.teamId}
                onChange={(e) => setForm((f) => ({ ...f, teamId: e.target.value }))}
              >
                <option value="">Personal (no team)</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            {/* Assignee — only shown when team is selected */}
            {form.teamId && (
              <div className="space-y-1">
                <label className="text-sm font-medium">Assignee (optional)</label>
                <select
                  className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                  value={form.assignedTo}
                  onChange={(e) => setForm((f) => ({ ...f, assignedTo: e.target.value }))}
                >
                  <option value="">Unassigned</option>
                  {teamMembers.map((m) => (
                    <option key={m.userId} value={m.userId}>
                      {m.user ? `${m.user.firstName} ${m.user.lastName}` : m.userId}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={!form.title.trim() || isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Task'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
