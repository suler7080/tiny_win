import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, radius, spacing, typography, shadows } from '../theme/colors';

interface FeedLockedViewProps {
  onGoToPost: () => void;
}

export const FeedLockedView: React.FC<FeedLockedViewProps> = ({ onGoToPost }) => {
  return (
    <View style={styles.container}>
      {/* Background teaser placeholders */}
      <View style={styles.teaserBackground} pointerEvents="none">
        <View style={[styles.ghostCard, { opacity: 0.25 }]}>
          <View style={styles.ghostAvatar} />
          <View style={styles.ghostLine} />
        </View>
        <View style={[styles.ghostCard, { opacity: 0.15 }]}>
          <View style={styles.ghostAvatar} />
          <View style={styles.ghostLine} />
        </View>
      </View>

      {/* Main Lock Card */}
      <View style={styles.card}>
        <View style={styles.iconCircle}>
          <Text style={styles.icon}>🔒</Text>
        </View>

        <Text style={[typography.title, styles.title]}>Bảng tin đang khóa</Text>
        
        <Text style={[typography.body, styles.message]}>
          Ghi nhận <Text style={{ color: colors.accent, fontWeight: '700' }}>1 Tiny Win</Text> của bạn hôm nay để mở khóa bảng tin và cùng theo dõi thành tựu nhỏ của bạn bè!
        </Text>

        <View style={styles.incentivePill}>
          <Text style={styles.incentiveText}>⚡ Giữ vững chuỗi Streak & kết nối tích cực</Text>
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={onGoToPost}
          activeOpacity={0.85}
        >
          <Text style={styles.buttonText}>Đăng Tiny Win của bạn 🚀</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    position: 'relative',
  },
  teaserBackground: {
    position: 'absolute',
    top: spacing.xl,
    left: spacing.lg,
    right: spacing.lg,
    gap: spacing.md,
  },
  ghostCard: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ghostAvatar: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceHighlight,
    marginBottom: spacing.sm,
  },
  ghostLine: {
    height: 14,
    width: '80%',
    borderRadius: radius.xs,
    backgroundColor: colors.surfaceHighlight,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    width: '100%',
    maxWidth: 360,
    ...shadows.card,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderGold,
    ...shadows.glowGold,
  },
  icon: {
    fontSize: 28,
  },
  title: {
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  message: {
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
    lineHeight: 22,
    fontSize: 14,
  },
  incentivePill: {
    backgroundColor: colors.streakGoldMuted,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderGold,
  },
  incentiveText: {
    color: colors.streakGold,
    fontSize: 12,
    fontWeight: '600',
  },
  button: {
    backgroundColor: colors.accent,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.full,
    width: '100%',
    alignItems: 'center',
    ...shadows.glowGreen,
  },
  buttonText: {
    color: '#000',
    fontWeight: '800',
    fontSize: 15,
  },
});
