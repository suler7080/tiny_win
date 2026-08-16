import { create } from 'zustand';
import { ReactionType, TodayWinStatus, Win } from '../types';
import * as winsApi from '../api/wins';
import * as feedApi from '../api/feed';
import * as reactionsApi from '../api/reactions';

interface WinState {
  todayStatus: TodayWinStatus | null;
  feedWins: Win[];
  feedLocked: boolean;
  isLoadingStatus: boolean;
  isLoadingFeed: boolean;
  isPosting: boolean;
  error: string | null;

  fetchTodayStatus: () => Promise<void>;
  postWin: (content: string) => Promise<Win>;
  fetchFeed: () => Promise<void>;
  toggleReaction: (winId: string, type: ReactionType) => Promise<void>;
}

export const useWinStore = create<WinState>((set, get) => ({
  todayStatus: null,
  feedWins: [],
  feedLocked: false,
  isLoadingStatus: false,
  isLoadingFeed: false,
  isPosting: false,
  error: null,

  fetchTodayStatus: async () => {
    try {
      set({ isLoadingStatus: true });
      const status = await winsApi.getTodayStatus();
      set({ todayStatus: status, isLoadingStatus: false });
    } catch (e: any) {
      console.warn('fetchTodayStatus error:', e);
      set({ isLoadingStatus: false });
    }
  },

  postWin: async (content: string) => {
    try {
      set({ isPosting: true, error: null });
      const newWin = await winsApi.createWin(content);

      // Refresh today status and unlock feed
      set((state) => ({
        isPosting: false,
        todayStatus: {
          has_posted_today: true,
          date_key: newWin.date_key,
          win: newWin,
        },
        feedLocked: false,
      }));

      // Immediately refresh feed
      get().fetchFeed();
      return newWin;
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || 'Không thể đăng Tiny Win lúc này';
      set({ error: msg, isPosting: false });
      throw new Error(msg);
    }
  },

  fetchFeed: async () => {
    try {
      set({ isLoadingFeed: true, error: null });
      const feed = await feedApi.getFeed();
      set({
        feedWins: feed.wins,
        feedLocked: false,
        isLoadingFeed: false,
      });
    } catch (err: any) {
      if (err.response?.status === 403) {
        set({ feedLocked: true, isLoadingFeed: false });
      } else {
        set({
          error: err.response?.data?.error?.message || 'Không thể tải bảng tin',
          isLoadingFeed: false,
        });
      }
    }
  },

  toggleReaction: async (winId: string, type: ReactionType) => {
    const { feedWins } = get();
    const target = feedWins.find((w) => w.id === winId);
    if (!target) return;

    const previousReaction = target.my_reaction;
    const isRemoving = previousReaction === type;

    // Optimistic UI update
    const updatedWins = feedWins.map((w) => {
      if (w.id === winId) {
        return {
          ...w,
          my_reaction: isRemoving ? null : type,
        };
      }
      return w;
    });
    set({ feedWins: updatedWins });

    try {
      if (isRemoving) {
        await reactionsApi.deleteReaction(winId);
      } else {
        await reactionsApi.upsertReaction(winId, type);
      }
    } catch (err) {
      // Rollback on failure
      const rollbackWins = get().feedWins.map((w) => {
        if (w.id === winId) {
          return { ...w, my_reaction: previousReaction };
        }
        return w;
      });
      set({ feedWins: rollbackWins });
      console.warn('Reaction toggle failed:', err);
    }
  },
}));
