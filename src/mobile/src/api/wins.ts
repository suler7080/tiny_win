import { apiClient, generateUUID } from './client';
import { TodayWinStatus, Win } from '../types';

export async function createWin(content: string, customIdempotencyKey?: string): Promise<Win> {
  const idempotencyKey = customIdempotencyKey || generateUUID();
  const response = await apiClient.post<Win>(
    '/wins',
    { content },
    {
      headers: {
        'Idempotency-Key': idempotencyKey,
      },
    }
  );
  return response.data;
}

export async function getTodayStatus(): Promise<TodayWinStatus> {
  const response = await apiClient.get<TodayWinStatus>('/wins/today');
  return response.data;
}

export async function getWinById(winId: string): Promise<Win> {
  const response = await apiClient.get<Win>(`/wins/${winId}`);
  return response.data;
}
