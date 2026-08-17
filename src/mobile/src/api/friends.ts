import { apiClient } from './client';
import { Friend, FriendListResponse, InviteTokenResponse } from '../types';

export async function createInviteToken(): Promise<InviteTokenResponse> {
  const response = await apiClient.post<InviteTokenResponse>('/friends/invite');
  return response.data;
}

export async function connectFriend(payload: {
  token?: string;
  username?: string;
}): Promise<Friend> {
  const response = await apiClient.post<Friend>('/friends/connect', payload);
  return response.data;
}

export async function getFriends(): Promise<FriendListResponse> {
  const response = await apiClient.get<FriendListResponse>('/friends');
  return response.data;
}

export async function removeFriend(friendId: string): Promise<{ message: string }> {
  const response = await apiClient.delete<{ message: string }>(`/friends/${friendId}`);
  return response.data;
}
