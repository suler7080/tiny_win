import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography, radius } from '../theme/colors';

interface HeaderProps {
  title: string;
  subtitle?: string;
  badge?: string;
  rightElement?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle, badge, rightElement }) => {
  return (
    <View style={styles.container}>
      <View style={styles.textContainer}>
        <View style={styles.titleRow}>
          <Text style={typography.title}>{title}</Text>
          {badge && (
            <View style={styles.badgeContainer}>
              <Text style={styles.badgeText}>{badge}</Text>
            </View>
          )}
        </View>
        {subtitle && <Text style={[typography.caption, styles.subtitle]}>{subtitle}</Text>}
      </View>
      {rightElement && <View style={styles.rightContainer}>{rightElement}</View>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.bgApp,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  textContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  badgeContainer: {
    backgroundColor: colors.streakGoldMuted,
    borderWidth: 1,
    borderColor: colors.borderGold,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  badgeText: {
    color: colors.streakGold,
    fontSize: 12,
    fontWeight: '700',
  },
  subtitle: {
    marginTop: spacing.xxs,
    color: colors.textSecondary,
  },
  rightContainer: {
    marginLeft: spacing.md,
  },
});
