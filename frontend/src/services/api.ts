import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api/v1';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

let getAccessToken: () => string | null = () => null;
let onRefreshToken: () => Promise<string | null> = async () => null;
let onAuthFailure: () => void = () => {};

export function configureApi(config: {
  getAccessToken: () => string | null;
  onRefreshToken: () => Promise<string | null>;
  onAuthFailure: () => void;
}) {
  getAccessToken = config.getAccessToken;
  onRefreshToken = config.onRefreshToken;
  onAuthFailure = config.onAuthFailure;
}

// Request interceptor: attach access token
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: handle 401 and refresh
let isRefreshing = false;

type RefreshSubscriber = {
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
};

let refreshSubscribers: RefreshSubscriber[] = [];

function subscribeTokenRefresh(resolve: (token: string) => void, reject: (err: unknown) => void) {
  refreshSubscribers.push({ resolve, reject });
}

function onTokenRefreshed(token: string) {
  refreshSubscribers.forEach(({ resolve }) => resolve(token));
  refreshSubscribers = [];
}

function onRefreshFailed(err: unknown) {
  refreshSubscribers.forEach(({ reject }) => reject(err));
  refreshSubscribers = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Never retry the refresh endpoint itself — avoids infinite 401 loop
    const isRefreshEndpoint = originalRequest.url?.includes('/auth/refresh');

    if (error.response?.status === 401 && !originalRequest._retry && !isRefreshEndpoint) {
      if (isRefreshing) {
        // Queue until the in-flight refresh resolves or fails
        return new Promise((resolve, reject) => {
          subscribeTokenRefresh(
            (token: string) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(api(originalRequest));
            },
            reject
          );
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const newToken = await onRefreshToken();
        if (newToken) {
          onTokenRefreshed(newToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        }
        throw new Error('No token returned');
      } catch (refreshError) {
        onRefreshFailed(refreshError);
        onAuthFailure();
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
