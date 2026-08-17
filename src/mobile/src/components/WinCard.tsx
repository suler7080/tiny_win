import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, spacing, typography, shadows } from '../theme/colors';
import { ReactionType, Win } from '../types';
import { ReactionBar } from './ReactionBar';

interface WinCardProps {
  win: Win;
  onReact?: (type: ReactionType) => void;
  showReaction?: boolean;
}

const formatRelativeTime = (isoString?: string): string => {
  if (!isoString) return '';
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSeconds < 60) return 'vừa xong';
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)} phút trước`;
    if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)} giờ trước`;
    return `${date.getDate()}/${date.getMonth() + 1}`;
  } catch {
    return '';
  }
};

export const WinCard: React.FC<WinCardProps> = ({
  win,
  onReact,
  showReaction = true,
}) => {
  const authorName = win.author_display_name || win.author_username;
  const initial = authorName.charAt(0).toUpperCase();
  const timeAgo = formatRelativeTime(win.created_at);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
        <View style={styles.authorInfo}>
          <View style={styles.nameRow}>
            <Text style={[typography.heading, styles.authorName]}>{authorName}</Text>
            {timeAgo ? <Text style={styles.timestampText}>{timeAgo}</Text> : null}
          </View>
          <View style={styles.subRow}>
            <Text style={typography.caption}>@{win.author_username}</Text>
            <View style={styles.dailyBadge}>
              <Text style={styles.dailyBadgeText}>Daily Win ✨</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Win Content Container with quote bar */}
      <View style={styles.contentWrapper}>
        <View style={styles.quoteBar} />
        <Text style={[typography.body, styles.content]}>{win.content}</Text>
      </View>

      {showReaction && onReact && (
        <ReactionBar
          currentReaction={win.my_reaction}
          onReact={onReact}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.accent,
    ...shadows.subtle,
  },
  avatarText: {
    color: colors.accentLight,
    fontWeight: '800',
    fontSize: 17,
  },
  authorInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  authorName: {
    flex: 1,
    marginRight: spacing.xs,
  },
  timestampText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dailyBadge: {
    backgroundColor: colors.accentMuted,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: colors.borderGlow,
  },
  dailyBadgeText: {
    color: colors.accentLight,
    fontSize: 11,
    fontWeight: '700',
  },
  contentWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.md,
    padding: spacing.md,
    marginVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  quoteBar: {
    width: 3,
    backgroundColor: colors.accent,
    borderRadius: radius.full,
    alignSelf: 'stretch',
    marginRight: spacing.md,
  },
  content: {
    flex: 1,
    fontSize: 15,
    lineHeight: 23,
    color: colors.textPrimary,
  },
});

