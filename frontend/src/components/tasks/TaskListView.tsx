import { Link } from 'react-router-dom';
import { CalendarDays, MessageSquare } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { PRIORITY_DOT, STATUS_LABEL, STATUS_BADGE, isOverdue } from './tasks.utils';
import type { TaskWithDetails, TeamWithRole } from '@/types';

interface TaskListViewProps {
  tasks: TaskWithDetails[];
  teams: TeamWithRole[];
  hasAnyTasks: boolean;
}

export default function TaskListView({ tasks, teams, hasAnyTasks }: TaskListViewProps) {
  if (tasks.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          {hasAnyTasks ? 'No tasks match the selected filters.' : 'No tasks yet. Create your first task!'}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="divide-y">
          {tasks.map((task) => {
            const teamName = task.teamId
              ? (teams.find((t) => t.id === task.teamId)?.name ?? 'Unknown Team')
              : null;

            return (
              <Link
                key={task.id}
                to={`/tasks/${task.id}`}
                className="flex items-center gap-3 py-3 px-4 hover:bg-muted/50 transition-colors"
              >
                <span
                  className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${PRIORITY_DOT[task.priority]}`}
                  title={`Priority: ${task.priority}`}
                />

                <span className="flex-1 text-sm font-medium truncate">{task.title}</span>

                <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground flex-shrink-0">
                  {teamName ?? 'Personal'}
                </span>

                <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${STATUS_BADGE[task.status]}`}>
                  {STATUS_LABEL[task.status]}
                </span>

                {task.commentCount > 0 && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                    <MessageSquare className="h-3 w-3" />
                    {task.commentCount}
                  </span>
                )}

                {task.dueDate && (
                  <span
                    className={`flex items-center gap-1 text-xs flex-shrink-0 ${
                      isOverdue(task.dueDate, task.status) ? 'text-red-500 font-medium' : 'text-muted-foreground'
                    }`}
                  >
                    <CalendarDays className="h-3 w-3" />
                    {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
