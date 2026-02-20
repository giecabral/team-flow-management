import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { Toaster } from '@/components/ui/toaster';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import MainLayout from '@/components/layout/MainLayout';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import DashboardPage from '@/pages/DashboardPage';
import TeamsPage from '@/pages/TeamsPage';
import TeamDetailPage from '@/pages/TeamDetailPage';
import UsersPage from '@/pages/UsersPage';

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/teams" element={<TeamsPage />} />
            <Route path="/teams/:teamId" element={<TeamDetailPage />} />
            <Route path="/users" element={<UsersPage />} />
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
      <Toaster />
    </AuthProvider>
  );
}

export default App;
