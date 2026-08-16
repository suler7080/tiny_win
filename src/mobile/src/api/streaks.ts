import { apiClient } from './client';
import { CalendarResponse, StreakResponse } from '../types';

export async function getUserStreaks(userId: string): Promise<StreakResponse> {
  const response = await apiClient.get<StreakResponse>(`/users/${userId}/streaks`);
  return response.data;
}

export async function getUserCalendar(
  userId: string,
  year?: number,
  month?: number
): Promise<CalendarResponse> {
  const params: Record<string, any> = {};
  if (year) params.year = year;
  if (month) params.month = month;
  const response = await apiClient.get<CalendarResponse>(`/users/${userId}/calendar`, {
    params,
  });
  return response.data;
}
