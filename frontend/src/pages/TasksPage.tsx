import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import * as tasksService from '@/services/tasks.service';
import * as teamsService from '@/services/teams.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import { ArrowLeft, Plus, CalendarDays, MessageSquare } from 'lucide-react';
import type { TaskWithDetails, TaskStatus, TaskPriority, TeamMember, TeamRole } from '@/types';

const COLUMNS: { status: TaskStatus; label: string }[] = [
  { status: 'todo', label: 'To Do' },
  { status: 'in_progress', label: 'In Progress' },
  { status: 'done', label: 'Done' },
];

const PRIORITY_DOT: Record<TaskPriority, string> = {
  high: 'bg-red-500',
  medium: 'bg-yellow-400',
  low: 'bg-green-500',
};

const STATUS_BADGE: Record<TaskStatus, string> = {
  todo: 'bg-slate-100 text-slate-600',
  in_progress: 'bg-blue-100 text-blue-700',
  done: 'bg-green-100 text-green-700',
};

function isOverdue(dueDate: string | null): boolean {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date(new Date().toDateString());
}

const CAN_CREATE_ROLES: TeamRole[] = ['admin', 'manager', 'dev'];

export default function TasksPage() {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [tasks, setTasks] = useState<TaskWithDetails[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserRole, setCurrentUserRole] = useState<TeamRole | null>(null);
  const [teamName, setTeamName] = useState('');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [defaultStatus, setDefaultStatus] = useState<TaskStatus>('todo');

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [dueDate, setDueDate] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (teamId) fetchData();
  }, [teamId]);

  const fetchData = async () => {
    try {
      const [tasksData, teamData, membersData] = await Promise.all([
        tasksService.listTasks(teamId!),
        teamsService.getTeam(teamId!),
        teamsService.getTeamMembers(teamId!),
      ]);
      setTasks(tasksData);
      setTeamName(teamData.name);
      setMembers(membersData);
      const me = membersData.find((m) => m.userId === user?.id);
      setCurrentUserRole(me?.role ?? null);
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load tasks' });
      navigate(`/teams/${teamId}`);
    } finally {
      setIsLoading(false);
    }
  };

  const openCreateDialog = (columnStatus: TaskStatus) => {
    setDefaultStatus(columnStatus);
    setStatus(columnStatus);
    setTitle('');
    setDescription('');
    setPriority('medium');
    setDueDate('');
    setAssignedTo('');
    setDialogOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const newTask = await tasksService.createTask(teamId!, {
        title,
        description: description || null,
        status,
        priority,
        dueDate: dueDate || null,
        assignedTo: assignedTo || null,
      });
      setTasks((prev) => [newTask, ...prev]);
      setDialogOpen(false);
      toast({ title: 'Task created' });
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to create task' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const canCreate = currentUserRole && CAN_CREATE_ROLES.includes(currentUserRole);

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
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/teams/${teamId}`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Tasks</h1>
          <p className="text-muted-foreground mt-0.5">{teamName}</p>
        </div>
        {canCreate && (
          <Button onClick={() => openCreateDialog('todo')}>
            <Plus className="h-4 w-4 mr-2" />
            New Task
          </Button>
        )}
      </div>

      {/* Kanban board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
        {COLUMNS.map(({ status: colStatus, label }) => {
          const colTasks = tasks.filter((t) => t.status === colStatus);
          return (
            <div key={colStatus} className="space-y-3">
              {/* Column header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold text-sm">{label}</h2>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_BADGE[colStatus]}`}>
                    {colTasks.length}
                  </span>
                </div>
                {canCreate && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => openCreateDialog(colStatus)}
                    title={`Add task to ${label}`}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>

              {/* Task cards */}
              <div className="space-y-2 min-h-[4rem]">
                {colTasks.map((task) => (
                  <Link
                    key={task.id}
                    to={`/teams/${teamId}/tasks/${task.id}`}
                    className="block"
                  >
                    <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                      <CardContent className="p-3 space-y-2">
                        <div className="flex items-start gap-2">
                          <span
                            className={`mt-1.5 h-2 w-2 rounded-full flex-shrink-0 ${PRIORITY_DOT[task.priority]}`}
                            title={`Priority: ${task.priority}`}
                          />
                          <p className="text-sm font-medium leading-snug line-clamp-2">
                            {task.title}
                          </p>
                        </div>

                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <div className="flex items-center gap-2">
                            {task.dueDate && (
                              <span
                                className={`flex items-center gap-1 ${
                                  isOverdue(task.dueDate) && colStatus !== 'done'
                                    ? 'text-red-500'
                                    : ''
                                }`}
                              >
                                <CalendarDays className="h-3 w-3" />
                                {new Date(task.dueDate).toLocaleDateString('en-US', {
                                  month: 'short', day: 'numeric',
                                })}
                              </span>
                            )}
                            {task.commentCount > 0 && (
                              <span className="flex items-center gap-1">
                                <MessageSquare className="h-3 w-3" />
                                {task.commentCount}
                              </span>
                            )}
                          </div>
                          {task.assignedUser && (
                            <div
                              className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex-shrink-0"
                              title={`${task.assignedUser.firstName} ${task.assignedUser.lastName}`}
                            >
                              {task.assignedUser.firstName.charAt(0).toUpperCase()}
                              {task.assignedUser.lastName.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}

                {colTasks.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">
                    No tasks
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Task Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New Task</DialogTitle>
            <DialogDescription>Add a task to the board.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Task title"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional description..."
                  rows={3}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as TaskStatus)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  >
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="done">Done</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <select
                    id="priority"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as TaskPriority)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="assignedTo">Assignee</Label>
                  <select
                    id="assignedTo"
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  >
                    <option value="">Unassigned</option>
                    {members.map((m) => (
                      <option key={m.userId} value={m.userId}>
                        {m.user?.firstName} {m.user?.lastName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Task'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
