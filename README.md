# TeamFlow

An internal scheduling and task management application for small teams. Built as a portfolio project demonstrating full-stack development skills.

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

## Features (Current)

- **User Authentication**
  - Registration with email/password
  - Login with JWT access/refresh tokens
  - Token rotation for security
  - Protected routes

- **Team Management**
  - Create teams
  - Role-based access (admin/member)
  - Add/remove team members
  - Change member roles
  - Search users to invite

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
│   ├── sql/migrations/     # Database schema
│   └── data/               # SQLite database file
│
└── frontend/
    └── src/
        ├── components/     # React components
        │   ├── ui/         # shadcn/ui components
        │   ├── auth/       # Authentication components
        │   └── layout/     # Layout components
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

3. Set up environment variables (optional - defaults work for development):
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
| POST | `/api/v1/auth/login` | Login user |
| POST | `/api/v1/auth/logout` | Logout user |
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

## Architecture Decisions

### Why SQLite?
- Zero configuration required
- Perfect for portfolio projects and local development
- Single file database, easy to reset
- Can migrate to PostgreSQL for production

### JWT Strategy
- **Access Token**: Short-lived (15 min), stored in memory
- **Refresh Token**: Long-lived (7 days), stored in localStorage, rotated on each use
- Tokens are hashed before storage for security

### Frontend State Management
- React Context for authentication state
- Local state + custom hooks for data fetching
- No Redux/Zustand - keeping it simple for the scope

### Code Organization
- Clear separation between frontend and backend
- Service layer pattern for business logic
- Controller layer for request handling
- Middleware for cross-cutting concerns

## Future Enhancements (Roadmap)

- [ ] Task management (CRUD, assignments, status tracking)
- [ ] Weekly schedules with time entries
- [ ] Dashboard with activity feed
- [ ] User profile management
- [ ] Email notifications
- [ ] Dark mode support

## Trade-offs

1. **SQLite vs PostgreSQL**: Chose SQLite for simplicity. For production, would use PostgreSQL for better concurrent access and advanced features.

2. **No ORM**: Using raw SQL queries for clarity and learning. An ORM like Prisma or Drizzle would improve developer experience.

3. **Simple validation**: Basic validation middleware. Could use Zod for more robust schema validation.

4. **No testing**: Would add Jest + React Testing Library for unit/integration tests in a production app.

## License

MIT
