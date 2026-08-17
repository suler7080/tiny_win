/**
 * TypeScript definitions mapping strictly to docs/openapi.yaml
 */

export type ReactionType = '🔥' | '👀' | '🤝';

export interface UserProfile {
  id: string;
  username: string;
  display_name?: string | null;
  timezone: string;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: UserProfile;
}

export interface Win {
  id: string;
  author_id: string;
  author_username: string;
  author_display_name?: string | null;
  content: string;
  date_key: string;
  created_at: string;
  my_reaction?: ReactionType | null;
}

export interface TodayWinStatus {
  has_posted_today: boolean;
  date_key: string;
  win?: Win | null;
}

export interface FeedResponse {
  date_key: string;
  wins: Win[];
  meta: {
    total: number;
    cursor?: string | null;
  };
}

export interface ReactionResponse {
  win_id: string;
  user_id: string;
  type?: ReactionType | null;
  updated_at: string;
}

export interface StreakResponse {
  user_id: string;
  current_streak: number;
  longest_streak: number;
  total_wins: number;
  last_win_date?: string | null;
}

export interface CalendarResponse {
  user_id: string;
  year: number;
  month: number;
  days: string[];
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    detail?: string | null;
  };
}

export interface InviteTokenResponse {
  token: string;
  invite_url: string;
  expires_in_seconds: number;
  user_id: string;
  username: string;
}

export interface FriendUser {
  id: string;
  username: string;
  display_name?: string | null;
  current_streak: number;
}

export interface Friend {
  friendship_id: string;
  friend: FriendUser;
  status: string;
  created_at: string;
}

export interface FriendListResponse {
  friends: Friend[];
  total: number;
}

