import { apiClient } from './client';
import { AuthResponse, UserProfile } from '../types';

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
  timezone: string;
  display_name?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export async function register(payload: RegisterPayload): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>('/auth/register', payload);
  return response.data;
}

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>('/auth/login', payload);
  return response.data;
}

export async function refresh(refreshToken: string): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>('/auth/refresh', {
    refresh_token: refreshToken,
  });
  return response.data;
}

export async function logout(refreshToken: string): Promise<void> {
  await apiClient.post('/auth/logout', { refresh_token: refreshToken });
}

export async function getMe(): Promise<UserProfile> {
  const response = await apiClient.get<UserProfile>('/auth/me');
  return response.data;
}
