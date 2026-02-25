import { useEffect, useState } from 'react';
import * as tasksService from '@/services/tasks.service';
import * as teamsService from '@/services/teams.service';
import * as usersService from '@/services/users.service';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { ListTodo, LayoutGrid, List, Plus } from 'lucide-react';
import TaskListView from '@/components/tasks/TaskListView';
import TaskKanbanView from '@/components/tasks/TaskKanbanView';
import CreateTaskDialog from '@/components/tasks/CreateTaskDialog';
import type { TaskWithDetails, TaskStatus, TeamWithRole, User } from '@/types';

const STATUS_FILTERS: { value: TaskStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
];

export default function GlobalTasksPage() {
  const [tasks, setTasks] = useState<TaskWithDetails[]>([]);
  const [teams, setTeams] = useState<TeamWithRole[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [teamFilter, setTeamFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    Promise.all([
      tasksService.listGlobalTasks(),
      teamsService.getTeams(),
      usersService.listUsers(),
    ])
      .then(([t, tm, u]) => { setTasks(t); setTeams(tm); setAllUsers(u); })
      .catch(() => toast({ variant: 'destructive', title: 'Error', description: 'Failed to load tasks' }))
      .finally(() => setIsLoading(false));
  }, []);

  // List view: filtered by status + team
  const filteredTasks = tasks.filter((t) => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (teamFilter === 'personal' && t.teamId !== null) return false;
    if (teamFilter !== 'all' && teamFilter !== 'personal' && t.teamId !== teamFilter) return false;
    return true;
  });

  // Kanban view: filtered by team only (columns handle status)
  const kanbanTasks = tasks.filter((t) => {
    if (teamFilter === 'personal' && t.teamId !== null) return false;
    if (teamFilter !== 'all' && teamFilter !== 'personal' && t.teamId !== teamFilter) return false;
    return true;
  });

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
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          New Task
        </Button>
      </div>

      {/* Filters + View toggle */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Status tabs — hidden in kanban mode since columns already separate by status */}
        {viewMode === 'list' && (
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
        )}

        {/* Team filter */}
        <Select value={teamFilter} onValueChange={setTeamFilter}>
          <SelectTrigger className="w-40 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Teams</SelectItem>
            <SelectItem value="personal">Personal</SelectItem>
            {teams.map((t) => (
              <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* View mode toggle */}
        <div className="flex rounded-lg border overflow-hidden ml-auto">
          <button
            onClick={() => setViewMode('list')}
            className={`p-1.5 transition-colors ${viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
            title="List view"
          >
            <List className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode('kanban')}
            className={`p-1.5 transition-colors ${viewMode === 'kanban' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
            title="Kanban view"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Views */}
      {viewMode === 'list' && (
        <TaskListView tasks={filteredTasks} teams={teams} hasAnyTasks={tasks.length > 0} />
      )}
      {viewMode === 'kanban' && (
        <TaskKanbanView tasks={kanbanTasks} teams={teams} />
      )}

      {/* Dialog */}
      <CreateTaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        teams={teams}
        allUsers={allUsers}
        onCreated={(task) => setTasks((prev) => [task, ...prev])}
      />
    </div>
  );
}
