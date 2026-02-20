import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import * as tasksService from '@/services/tasks.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { CalendarDays, MessageSquare } from 'lucide-react';
import type { MyTask, TaskStatus, TaskPriority } from '@/types';

const PRIORITY_DOT: Record<TaskPriority, string> = {
  high: 'bg-red-500',
  medium: 'bg-yellow-400',
  low: 'bg-green-500',
};

const STATUS_SECTIONS: { status: TaskStatus; label: string }[] = [
  { status: 'todo', label: 'To Do' },
  { status: 'in_progress', label: 'In Progress' },
  { status: 'done', label: 'Done' },
];

function isOverdue(dueDate: string | null, status: TaskStatus): boolean {
  if (!dueDate || status === 'done') return false;
  return new Date(dueDate) < new Date(new Date().toDateString());
}

export default function MyTasksPage() {
  const [tasks, setTasks] = useState<MyTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    tasksService.getMyTasks()
      .then(setTasks)
      .catch(() => toast({ variant: 'destructive', title: 'Error', description: 'Failed to load tasks' }))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const totalTasks = tasks.length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Tasks</h1>
        <p className="text-muted-foreground mt-1">
          {totalTasks === 0
            ? 'No tasks assigned to you.'
            : `${totalTasks} task${totalTasks !== 1 ? 's' : ''} assigned to you across all teams`}
        </p>
      </div>

      {totalTasks === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            You have no tasks assigned to you yet.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {STATUS_SECTIONS.map(({ status, label }) => {
            const sectionTasks = tasks.filter((t) => t.status === status);
            if (sectionTasks.length === 0) return null;

            return (
              <Card key={status}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    {label}
                    <span className="text-xs font-normal text-muted-foreground">
                      ({sectionTasks.length})
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="divide-y">
                    {sectionTasks.map((task) => (
                      <Link
                        key={task.id}
                        to={`/teams/${task.teamId}/tasks/${task.id}`}
                        className="flex items-center gap-3 py-3 hover:bg-muted/50 -mx-2 px-2 rounded-md transition-colors"
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
                          {task.teamName}
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
                            className={`flex items-center gap-1 text-xs flex-shrink-0 ${
                              isOverdue(task.dueDate, task.status)
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
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
