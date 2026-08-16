import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors, radius, spacing, typography } from '../theme/colors';
import { ReactionType } from '../types';

interface ReactionBarProps {
  currentReaction?: ReactionType | null;
  reactionCounts?: { [key in ReactionType]?: number };
  onReact: (type: ReactionType) => void;
  disabled?: boolean;
}

const REACTIONS: { type: ReactionType; label: string; activeColor: string; bgActive: string }[] = [
  { type: '🔥', label: 'Cháy', activeColor: colors.fireActive, bgActive: colors.fireBg },
  { type: '👀', label: 'Ủng hộ', activeColor: colors.eyesActive, bgActive: colors.eyesBg },
  { type: '🤝', label: 'Đồng hành', activeColor: colors.handshakeActive, bgActive: colors.handshakeBg },
];

export const ReactionBar: React.FC<ReactionBarProps> = ({
  currentReaction,
  reactionCounts,
  onReact,
  disabled = false,
}) => {
  return (
    <View style={styles.container}>
      {REACTIONS.map((item) => {
        const isActive = currentReaction === item.type;
        const count = reactionCounts?.[item.type];

        return (
          <TouchableOpacity
            key={item.type}
            onPress={() => onReact(item.type)}
            disabled={disabled}
            activeOpacity={0.7}
            style={[
              styles.button,
              isActive && {
                backgroundColor: item.bgActive,
                borderColor: item.activeColor,
              },
            ]}
          >
            <Text style={styles.emoji}>{item.type}</Text>
            <Text
              style={[
                typography.caption,
                styles.label,
                isActive && { color: item.activeColor, fontWeight: '700' },
              ]}
            >
              {item.label}
              {count !== undefined && count > 0 ? ` ${count}` : ''}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingTop: spacing.sm,
    marginTop: spacing.xs,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emoji: {
    fontSize: 16,
    marginRight: 6,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
});
