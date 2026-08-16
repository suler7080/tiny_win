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

export const WinCard: React.FC<WinCardProps> = ({
  win,
  onReact,
  showReaction = true,
}) => {
  const authorName = win.author_display_name || win.author_username;
  const initial = authorName.charAt(0).toUpperCase();

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
        <View style={styles.authorInfo}>
          <View style={styles.nameRow}>
            <Text style={typography.heading}>{authorName}</Text>
            <View style={styles.dailyBadge}>
              <Text style={styles.dailyBadgeText}>Daily Win ✨</Text>
            </View>
          </View>
          <Text style={typography.caption}>@{win.author_username}</Text>
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
    width: 42,
    height: 42,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.accent,
  },
  avatarText: {
    color: colors.accentLight,
    fontWeight: '700',
    fontSize: 16,
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
