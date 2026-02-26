import api from './api';
import type { User, ApiResponse } from '@/types';

export interface CreateUserRequest {
  email: string;
  firstName: string;
  lastName: string;
}

export interface CreateUserResponse {
  user: User;
  password: string;
}

export async function listUsers(search?: string): Promise<User[]> {
  const params = search ? `?search=${encodeURIComponent(search)}` : '';
  const response = await api.get<ApiResponse<User[]>>(`/users${params}`);
  return response.data.data!;
}

export async function createUser(data: CreateUserRequest): Promise<CreateUserResponse> {
  const response = await api.post<ApiResponse<CreateUserResponse>>('/users', data);
  return response.data.data!;
}

export async function getUser(userId: string): Promise<User> {
  const response = await api.get<ApiResponse<User>>(`/users/${userId}`);
  return response.data.data!;
}

export interface UpdateProfileRequest {
  firstName: string;
  lastName: string;
  email: string;
}

export async function updateProfile(data: UpdateProfileRequest): Promise<User> {
  const response = await api.patch<ApiResponse<User>>('/users/me', data);
  return response.data.data!;
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  await api.patch('/users/me/password', { currentPassword, newPassword });
}
