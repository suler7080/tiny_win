import { apiClient, generateUUID } from './client';
import { ReactionResponse, ReactionType } from '../types';

export async function upsertReaction(winId: string, type: ReactionType): Promise<ReactionResponse> {
  const idempotencyKey = generateUUID();
  const response = await apiClient.put<ReactionResponse>(
    `/wins/${winId}/reaction`,
    { type },
    {
      headers: {
        'Idempotency-Key': idempotencyKey,
      },
    }
  );
  return response.data;
}

export async function deleteReaction(winId: string): Promise<void> {
  await apiClient.delete(`/wins/${winId}/reaction`);
}
