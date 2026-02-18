import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import * as authService from '@/services/auth.service';
import { configureApi } from '@/services/api';
import { toast } from '@/components/ui/use-toast';
import type { User, LoginRequest, RegisterRequest } from '@/types';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextType extends AuthState {
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const REFRESH_TOKEN_KEY = 'refreshToken';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });

  const accessTokenRef = useRef<string | null>(null);
  const navigate = useNavigate();

  // Configure API interceptors
  useEffect(() => {
    configureApi({
      getAccessToken: () => accessTokenRef.current,
      onRefreshToken: async () => {
        const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
        if (!refreshToken) return null;

        try {
          const tokens = await authService.refreshTokens(refreshToken);
          accessTokenRef.current = tokens.accessToken;
          localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
          return tokens.accessToken;
        } catch {
          localStorage.removeItem(REFRESH_TOKEN_KEY);
          accessTokenRef.current = null;
          return null;
        }
      },
      onAuthFailure: () => {
        accessTokenRef.current = null;
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        setState({ user: null, isAuthenticated: false, isLoading: false });
        toast({
          variant: 'destructive',
          title: 'Session expired',
          description: 'Your session is no longer valid. Please sign in again.',
        });
        navigate('/login');
      },
    });
  }, [navigate]);

  // Initialize auth state on mount
  useEffect(() => {
    const initAuth = async () => {
      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
      if (!refreshToken) {
        setState({ user: null, isAuthenticated: false, isLoading: false });
        return;
      }

      try {
        const tokens = await authService.refreshTokens(refreshToken);
        accessTokenRef.current = tokens.accessToken;
        localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);

        const user = await authService.getCurrentUser();
        setState({ user, isAuthenticated: true, isLoading: false });
      } catch {
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        setState({ user: null, isAuthenticated: false, isLoading: false });
      }
    };

    initAuth();
  }, []);

  const login = async (data: LoginRequest) => {
    const response = await authService.login(data);
    accessTokenRef.current = response.accessToken;
    localStorage.setItem(REFRESH_TOKEN_KEY, response.refreshToken);
    setState({ user: response.user, isAuthenticated: true, isLoading: false });
  };

  const register = async (data: RegisterRequest) => {
    const response = await authService.register(data);
    accessTokenRef.current = response.accessToken;
    localStorage.setItem(REFRESH_TOKEN_KEY, response.refreshToken);
    setState({ user: response.user, isAuthenticated: true, isLoading: false });
  };

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
      await authService.logout(refreshToken || undefined);
    } finally {
      accessTokenRef.current = null;
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      setState({ user: null, isAuthenticated: false, isLoading: false });
      navigate('/login');
    }
  };

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
