import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import TaskListView from './TaskListView';
import type { TaskWithDetails, TeamWithRole } from '@/types';

function makeTask(overrides: Partial<TaskWithDetails> = {}): TaskWithDetails {
  return {
    id: 'task-1',
    title: 'Fix login bug',
    status: 'todo',
    priority: 'high',
    teamId: null,
    description: null,
    dueDate: null,
    assignedTo: null,
    createdBy: 'user-1',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    labels: [],
    commentCount: 0,
    creator: { id: 'user-1', email: 'a@b.com', firstName: 'Alice', lastName: 'Smith', createdAt: '', updatedAt: '' },
    ...overrides,
  };
}

const noTeams: TeamWithRole[] = [];

describe('TaskListView', () => {
  describe('empty states', () => {
    it('shows "no tasks yet" message when there are no tasks at all', () => {
      render(
        <MemoryRouter>
          <TaskListView tasks={[]} teams={noTeams} hasAnyTasks={false} />
        </MemoryRouter>
      );
      expect(screen.getByText(/No tasks yet/i)).toBeInTheDocument();
    });

    it('shows "no tasks match" message when filters are active', () => {
      render(
        <MemoryRouter>
          <TaskListView tasks={[]} teams={noTeams} hasAnyTasks={true} />
        </MemoryRouter>
      );
      expect(screen.getByText(/No tasks match the selected filters/i)).toBeInTheDocument();
    });
  });

  describe('task list', () => {
    it('renders a task title', () => {
      render(
        <MemoryRouter>
          <TaskListView tasks={[makeTask()]} teams={noTeams} hasAnyTasks={true} />
        </MemoryRouter>
      );
      expect(screen.getByText('Fix login bug')).toBeInTheDocument();
    });

    it('shows "Personal" label for tasks without a team', () => {
      render(
        <MemoryRouter>
          <TaskListView tasks={[makeTask({ teamId: null })]} teams={noTeams} hasAnyTasks={true} />
        </MemoryRouter>
      );
      expect(screen.getByText('Personal')).toBeInTheDocument();
    });

    it('shows the team name for team tasks', () => {
      const teams: TeamWithRole[] = [{
        id: 'team-1',
        name: 'Alpha Squad',
        description: null,
        createdBy: 'user-1',
        createdAt: '',
        updatedAt: '',
        role: 'dev',
      }];

      render(
        <MemoryRouter>
          <TaskListView tasks={[makeTask({ teamId: 'team-1' })]} teams={teams} hasAnyTasks={true} />
        </MemoryRouter>
      );
      expect(screen.getByText('Alpha Squad')).toBeInTheDocument();
    });

    it('renders multiple tasks', () => {
      const tasks = [
        makeTask({ id: 'task-1', title: 'First task' }),
        makeTask({ id: 'task-2', title: 'Second task' }),
      ];
      render(
        <MemoryRouter>
          <TaskListView tasks={tasks} teams={noTeams} hasAnyTasks={true} />
        </MemoryRouter>
      );
      expect(screen.getByText('First task')).toBeInTheDocument();
      expect(screen.getByText('Second task')).toBeInTheDocument();
    });

    it('shows comment count when task has comments', () => {
      render(
        <MemoryRouter>
          <TaskListView tasks={[makeTask({ commentCount: 3 })]} teams={noTeams} hasAnyTasks={true} />
        </MemoryRouter>
      );
      expect(screen.getByText('3')).toBeInTheDocument();
    });
  });
});
