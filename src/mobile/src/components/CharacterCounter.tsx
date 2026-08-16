import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, spacing, typography } from '../theme/colors';

interface CharacterCounterProps {
  currentLength: number;
  maxLength?: number;
}

export const CharacterCounter: React.FC<CharacterCounterProps> = ({
  currentLength,
  maxLength = 120,
}) => {
  const remaining = maxLength - currentLength;
  const progress = Math.min(Math.max(currentLength / maxLength, 0), 1);
  const isNearLimit = remaining <= 20 && remaining >= 0;
  const isOverLimit = remaining < 0;

  const barColor = isOverLimit
    ? colors.danger
    : isNearLimit
    ? colors.streakGold
    : colors.accent;

  return (
    <View style={styles.container}>
      {/* Progress Track */}
      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            {
              width: `${progress * 100}%`,
              backgroundColor: barColor,
            },
          ]}
        />
      </View>

      <View style={styles.metaRow}>
        <Text style={[typography.micro, styles.guideText]}>
          {currentLength === 0
            ? 'Tối đa 120 ký tự'
            : isOverLimit
            ? 'Vượt quá giới hạn'
            : isNearLimit
            ? 'Sắp chạm mốc'
            : 'Độ dài tối ưu'}
        </Text>
        <Text
          style={[
            typography.micro,
            styles.countText,
            isNearLimit && styles.textWarning,
            isOverLimit && styles.textDanger,
          ]}
        >
          {remaining >= 0 ? `${remaining} ký tự còn lại` : `Quá ${Math.abs(remaining)} ký tự`}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.xs,
    marginTop: spacing.xs,
  },
  track: {
    height: 4,
    backgroundColor: colors.surfaceHighlight,
    borderRadius: radius.full,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  fill: {
    height: '100%',
    borderRadius: radius.full,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  guideText: {
    color: colors.textMuted,
    fontSize: 11,
  },
  countText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  textWarning: {
    color: colors.streakGold,
    fontWeight: '700',
  },
  textDanger: {
    color: colors.danger,
    fontWeight: '700',
  },
});
