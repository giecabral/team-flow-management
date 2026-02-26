import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi } from 'vitest';
import ProtectedRoute from './ProtectedRoute';

vi.mock('@/context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from '@/context/AuthContext';

const mockUseAuth = useAuth as ReturnType<typeof vi.fn>;

describe('ProtectedRoute', () => {
  it('shows a loading spinner while auth state is resolving', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false, isLoading: true });

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<div>Dashboard</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('redirects to /login when the user is not authenticated', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false, isLoading: false });

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<div>Dashboard</div>} />
          </Route>
          <Route path="/login" element={<div>Login page</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Login page')).toBeInTheDocument();
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
  });

  it('renders the child route when the user is authenticated', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, isLoading: false });

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<div>Dashboard</div>} />
          </Route>
          <Route path="/login" element={<div>Login page</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.queryByText('Login page')).not.toBeInTheDocument();
  });
});
