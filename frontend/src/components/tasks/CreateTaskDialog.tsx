import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import * as tasksService from '@/services/tasks.service';
import type { TaskWithDetails, TaskStatus, TaskPriority, TeamWithRole, User } from '@/types';

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

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teams: TeamWithRole[];
  allUsers: User[];
  onCreated: (task: TaskWithDetails) => void;
}

export default function CreateTaskDialog({
  open, onOpenChange, teams, allUsers, onCreated,
}: CreateTaskDialogProps) {
  const [form, setForm] = useState<CreateForm>(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleOpenChange(value: boolean) {
    if (!value) setForm(EMPTY_FORM);
    onOpenChange(value);
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
      onCreated(task);
      onOpenChange(false);
      setForm(EMPTY_FORM);
      toast({ title: 'Task created' });
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to create task' });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>New Task</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
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

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">Priority</label>
              <Select value={form.priority} onValueChange={(v) => setForm((f) => ({ ...f, priority: v as TaskPriority }))}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Status</label>
              <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v as TaskStatus }))}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Due Date</label>
            <input
              type="date"
              className="w-full border rounded-md px-3 py-2 text-sm bg-background"
              value={form.dueDate}
              onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Team (optional)</label>
            <Select
              value={form.teamId || '__none__'}
              onValueChange={(v) => setForm((f) => ({ ...f, teamId: v === '__none__' ? '' : v }))}
            >
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Personal (no team)</SelectItem>
                {teams.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Assignee (optional)</label>
            <Select
              value={form.assignedTo || '__none__'}
              onValueChange={(v) => setForm((f) => ({ ...f, assignedTo: v === '__none__' ? '' : v }))}
            >
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Unassigned</SelectItem>
                {allUsers.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.firstName} {u.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleCreate} disabled={!form.title.trim() || isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create Task'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
