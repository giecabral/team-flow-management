import api from './api';
import type { Team, TeamMember, TeamRole, TeamWithRole, User, ApiResponse } from '@/types';

export async function getTeams(): Promise<TeamWithRole[]> {
  const response = await api.get<ApiResponse<TeamWithRole[]>>('/teams');
  return response.data.data!;
}

export async function createTeam(data: { name: string; description?: string }): Promise<TeamWithRole> {
  const response = await api.post<ApiResponse<TeamWithRole>>('/teams', data);
  return response.data.data!;
}

export async function getTeam(teamId: string): Promise<Team> {
  const response = await api.get<ApiResponse<Team>>(`/teams/${teamId}`);
  return response.data.data!;
}

export async function updateTeam(teamId: string, data: { name?: string; description?: string }): Promise<Team> {
  const response = await api.patch<ApiResponse<Team>>(`/teams/${teamId}`, data);
  return response.data.data!;
}

export async function deleteTeam(teamId: string): Promise<void> {
  await api.delete(`/teams/${teamId}`);
}

export async function getTeamMembers(teamId: string): Promise<TeamMember[]> {
  const response = await api.get<ApiResponse<TeamMember[]>>(`/teams/${teamId}/members`);
  return response.data.data!;
}

export async function addTeamMember(
  teamId: string,
  data: { userId: string; role?: TeamRole }
): Promise<TeamMember> {
  const response = await api.post<ApiResponse<TeamMember>>(`/teams/${teamId}/members`, data);
  return response.data.data!;
}

export async function updateMemberRole(
  teamId: string,
  userId: string,
  role: TeamRole
): Promise<TeamMember> {
  const response = await api.patch<ApiResponse<TeamMember>>(
    `/teams/${teamId}/members/${userId}`,
    { role }
  );
  return response.data.data!;
}

export async function removeMember(teamId: string, userId: string): Promise<void> {
  await api.delete(`/teams/${teamId}/members/${userId}`);
}

export async function searchUsers(teamId: string, query: string): Promise<User[]> {
  const response = await api.get<ApiResponse<User[]>>(
    `/teams/${teamId}/users/search?q=${encodeURIComponent(query)}`
  );
  return response.data.data!;
}
