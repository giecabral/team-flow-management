# TeamFlow

An internal task and team management application for small teams. Built as a portfolio project demonstrating full-stack development skills.

## Tech Stack

**Frontend:**
- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS
- shadcn/ui components
- React Router v6
- Axios

**Backend:**
- Node.js + Express
- TypeScript
- SQLite (via better-sqlite3)
- JWT authentication

## Features

- **User Authentication**
  - Registration with email/password
  - Login with JWT access/refresh tokens
  - Token rotation for security
  - Protected routes

- **Team Management**
  - Create and delete teams
  - Four-level role system: admin, manager, dev, guest
  - Add/remove team members
  - Change member roles via dropdown menu
  - Search users to invite

- **Task Management**
  - Kanban board view per team (To Do / In Progress / Done columns)
  - Personal tasks not tied to any team
  - Global tasks page showing all tasks across all teams
  - Create, edit, and delete tasks
  - Status tracking (To Do, In Progress, Done)
  - Priority levels (Low, Medium, High)
  - Due dates with overdue highlighting
  - Task assignment to team members or any user
  - Role-based assignment rules:
    - Admin/Manager: can assign tasks to any member
    - Dev: self-assign only
  - Filter tasks by status and team

- **Comments**
  - Add comments to any task
  - Edit and delete your own comments
  - Admins can delete any comment within their team

- **My Tasks**
  - Personal view showing all tasks assigned to the current user across all teams

## Project Structure

```
team-flow-management/
├── backend/
│   ├── src/
│   │   ├── config/         # Database and environment config
│   │   ├── controllers/    # Route handlers
│   │   ├── middleware/     # Auth, validation, error handling
│   │   ├── routes/         # API route definitions
│   │   ├── services/       # Business logic
│   │   ├── types/          # TypeScript types
│   │   └── utils/          # Helper functions
│   ├── sql/migrations/     # Database schema migrations
│   └── data/               # SQLite database file
│
└── frontend/
    └── src/
        ├── components/     # React components
        │   ├── ui/         # shadcn/ui components
        │   ├── auth/       # Authentication components
        │   └── layout/     # Layout components (sidebar, header)
        ├── context/        # React context (auth)
        ├── pages/          # Page components
        ├── services/       # API service layer
        └── types/          # TypeScript types
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

1. Clone the repository:
```bash
git clone https://github.com/giecabral/team-flow-management.git
cd team-flow-management
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables (optional — defaults work for development):
```bash
# Backend (backend/.env)
PORT=3001
NODE_ENV=development
JWT_ACCESS_SECRET=your-secret-here
JWT_REFRESH_SECRET=your-secret-here
CORS_ORIGIN=http://localhost:5173

# Frontend (frontend/.env)
VITE_API_URL=http://localhost:3001/api/v1
```

4. Run database migrations:
```bash
npm run db:migrate
```

5. Start development servers:
```bash
npm run dev
```

This starts both backend (port 3001) and frontend (port 5173).

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start both frontend and backend in development mode |
| `npm run dev:backend` | Start only the backend server |
| `npm run dev:frontend` | Start only the frontend dev server |
| `npm run db:migrate` | Run database migrations |
| `npm run build` | Build both frontend and backend for production |

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Register new user |
| POST | `/api/v1/auth/login` | Login |
| POST | `/api/v1/auth/logout` | Logout |
| POST | `/api/v1/auth/refresh` | Refresh access token |
| GET | `/api/v1/auth/me` | Get current user |

### Teams
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/teams` | List user's teams |
| POST | `/api/v1/teams` | Create team |
| GET | `/api/v1/teams/:id` | Get team details |
| PATCH | `/api/v1/teams/:id` | Update team (admin) |
| DELETE | `/api/v1/teams/:id` | Delete team (admin) |
| GET | `/api/v1/teams/:id/members` | List members |
| POST | `/api/v1/teams/:id/members` | Add member (admin) |
| PATCH | `/api/v1/teams/:id/members/:userId` | Update role (admin) |
| DELETE | `/api/v1/teams/:id/members/:userId` | Remove member (admin) |
| GET | `/api/v1/teams/:id/users/search` | Search users to invite |

### Team Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/teams/:teamId/tasks` | List team tasks |
| POST | `/api/v1/teams/:teamId/tasks` | Create task |
| GET | `/api/v1/teams/:teamId/tasks/:taskId` | Get task |
| PATCH | `/api/v1/teams/:teamId/tasks/:taskId` | Update task |
| DELETE | `/api/v1/teams/:teamId/tasks/:taskId` | Delete task |
| GET | `/api/v1/teams/:teamId/tasks/:taskId/comments` | List comments |
| POST | `/api/v1/teams/:teamId/tasks/:taskId/comments` | Add comment |
| PATCH | `/api/v1/teams/:teamId/tasks/:taskId/comments/:commentId` | Edit comment |
| DELETE | `/api/v1/teams/:teamId/tasks/:taskId/comments/:commentId` | Delete comment |

### Global Tasks (personal + cross-team)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/tasks/me` | Tasks assigned to current user |
| GET | `/api/v1/tasks` | All accessible tasks |
| POST | `/api/v1/tasks` | Create task (team optional) |
| GET | `/api/v1/tasks/:taskId` | Get task |
| PATCH | `/api/v1/tasks/:taskId` | Update task |
| DELETE | `/api/v1/tasks/:taskId` | Delete task |
| GET | `/api/v1/tasks/:taskId/comments` | List comments |
| POST | `/api/v1/tasks/:taskId/comments` | Add comment |
| PATCH | `/api/v1/tasks/:taskId/comments/:commentId` | Edit comment |
| DELETE | `/api/v1/tasks/:taskId/comments/:commentId` | Delete comment |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/users` | List users (supports `?search=`) |
| POST | `/api/v1/users` | Create user |
| GET | `/api/v1/users/:userId` | Get user |

## Architecture Decisions

### Why SQLite?
- Zero configuration required
- Perfect for portfolio projects and local development
- Single file database, easy to reset
- Can migrate to PostgreSQL for production

### JWT Strategy
- **Access Token**: Short-lived (15 min), stored in memory
- **Refresh Token**: Long-lived (7 days), stored in localStorage, rotated on each use
- Refresh tokens are hashed before storage for security

### Personal vs Team Tasks
Tasks have a nullable `team_id`. When `team_id` is null the task is personal — only its creator and assignee can see or edit it. Team tasks are visible to all team members. The same `TaskDetailPage` handles both contexts by detecting whether `teamId` is present in the route params.

### Frontend State Management
- React Context for authentication state
- Local state for data fetching
- No Redux/Zustand — keeping it simple for the scope

### Code Organization
- Clear separation between frontend and backend
- Service layer pattern for business logic
- Controller layer for request handling
- Middleware for cross-cutting concerns

## Trade-offs

1. **SQLite vs PostgreSQL**: Chose SQLite for simplicity. For production, would use PostgreSQL for better concurrent access and advanced features.

2. **No ORM**: Using raw SQL queries for clarity and learning. An ORM like Prisma or Drizzle would improve developer experience.

3. **Simple validation**: Basic validation middleware. Could use Zod for more robust schema validation.

4. **No testing**: Would add Jest + React Testing Library for unit/integration tests in a production app.

## License

MIT
