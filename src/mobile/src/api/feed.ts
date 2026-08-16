import { apiClient } from './client';
import { FeedResponse } from '../types';

export async function getFeed(cursor?: string | null, limit: number = 20): Promise<FeedResponse> {
  const params: Record<string, any> = { limit };
  if (cursor) {
    params.cursor = cursor;
  }
  const response = await apiClient.get<FeedResponse>('/feed', { params });
  return response.data;
}
