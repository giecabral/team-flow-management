import { Link } from 'react-router-dom';
import { CalendarDays, MessageSquare } from 'lucide-react';
import { PRIORITY_DOT, KANBAN_COLUMNS, isOverdue } from './tasks.utils';
import type { TaskWithDetails, TeamWithRole } from '@/types';

interface TaskKanbanViewProps {
  tasks: TaskWithDetails[];
  teams: TeamWithRole[];
}

export default function TaskKanbanView({ tasks, teams }: TaskKanbanViewProps) {
  return (
    <div className="grid grid-cols-3 gap-4">
      {KANBAN_COLUMNS.map(({ status, label, headerClass }) => {
        const columnTasks = tasks.filter((t) => t.status === status);

        return (
          <div key={status} className="flex flex-col gap-3">
            <div className="flex items-center justify-between px-1">
              <span className={`text-sm font-semibold ${headerClass}`}>{label}</span>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {columnTasks.length}
              </span>
            </div>

            <div className="flex flex-col gap-2 min-h-24 bg-muted/40 rounded-lg p-2">
              {columnTasks.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">No tasks</p>
              ) : (
                columnTasks.map((task) => {
                  const teamName = task.teamId
                    ? (teams.find((t) => t.id === task.teamId)?.name ?? 'Unknown Team')
                    : null;

                  return (
                    <Link
                      key={task.id}
                      to={`/tasks/${task.id}`}
                      className="block bg-background rounded-md border p-3 hover:shadow-sm transition-shadow"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`mt-1 h-2 w-2 rounded-full flex-shrink-0 ${PRIORITY_DOT[task.priority]}`}
                          title={`Priority: ${task.priority}`}
                        />
                        <span className="text-sm font-medium leading-snug line-clamp-2">{task.title}</span>
                      </div>

                      <div className="mt-2 flex items-center gap-2 flex-wrap">
                        <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                          {teamName ?? 'Personal'}
                        </span>

                        {task.commentCount > 0 && (
                          <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                            <MessageSquare className="h-3 w-3" />
                            {task.commentCount}
                          </span>
                        )}

                        {task.dueDate && (
                          <span
                            className={`flex items-center gap-0.5 text-xs ml-auto ${
                              isOverdue(task.dueDate, task.status) ? 'text-red-500 font-medium' : 'text-muted-foreground'
                            }`}
                          >
                            <CalendarDays className="h-3 w-3" />
                            {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        )}
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
