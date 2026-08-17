import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { colors, radius, spacing, typography, shadows } from '../theme/colors';
import { Header } from '../components/Header';
import { CharacterCounter } from '../components/CharacterCounter';
import { WinCard } from '../components/WinCard';
import { useWinStore } from '../stores/winStore';
import { useAuthStore } from '../stores/authStore';
import * as streaksApi from '../api/streaks';

const INSPIRATION_TIPS = [
  'Đã dậy sớm hơn hôm qua 30 phút ⏰',
  'Đã chạy bộ hoặc đi bộ 3km buổi sáng 🏃',
  'Đã uống đủ 2 lít nước trong ngày 💧',
  'Đã hoàn thành phần khó nhất của công việc hôm nay 🎯',
  'Đã đọc xong 1 chương sách hay 📖',
  'Đã thiền hoặc hít thở sâu 10 phút 🧘',
  'Đã dành thời gian chất lượng bên gia đình 👨‍👩‍👧',
  'Đã dọn dẹp bàn làm việc thật gọn gàng ✨',
  'Đã nói lời cảm ơn một người đồng nghiệp 🤝',
  'Đã học thêm 10 từ vựng hoặc 1 kiến thức mới 💡',
];

export const HomeScreen: React.FC = () => {
  const [content, setContent] = useState('');
  const [streak, setStreak] = useState<number | null>(null);
  const { user } = useAuthStore();
  const { todayStatus, isLoadingStatus, isPosting, fetchTodayStatus, postWin, error } =
    useWinStore();

  useEffect(() => {
    fetchTodayStatus();
    if (user?.id) {
      streaksApi.getUserStreaks(user.id).then((res) => setStreak(res.current_streak)).catch(() => {});
    }
  }, [user?.id]);

  const dayOfYear = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now.getTime() - start.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    return Math.floor(diff / oneDay);
  }, []);

  const currentTip = INSPIRATION_TIPS[dayOfYear % INSPIRATION_TIPS.length];

  const handlePost = async () => {
    if (!content.trim() || content.length > 120) return;
    try {
      await postWin(content.trim());
      setContent('');
      if (user?.id) {
        streaksApi.getUserStreaks(user.id).then((res) => setStreak(res.current_streak)).catch(() => {});
      }
    } catch (e) {
      // Error handled in store
    }
  };

  // Format today's local date YYYY-MM-DD
  const localTodayIso = new Date().toLocaleDateString('en-CA');
  const hasPosted = Boolean(
    todayStatus?.has_posted_today && todayStatus?.date_key === localTodayIso
  );

  // Format today's localized date
  const todayFormatted = new Date().toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: 'numeric',
    month: 'numeric',
  });

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Header
        title="Tiny Win"
        subtitle={
          user?.display_name
            ? `Xin chào, ${user.display_name} 👋`
            : user?.username
            ? `@${user.username}`
            : undefined
        }
        badge={todayFormatted}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {isLoadingStatus ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator color={colors.accent} size="large" />
          </View>
        ) : hasPosted && todayStatus?.win ? (
          <View style={styles.completedContainer}>
            {/* Celebration Hero Card */}
            <View style={styles.celebrationCard}>
              <View style={styles.celebrationTopRow}>
                <View style={styles.celebrationBadge}>
                  <Text style={styles.celebrationEmoji}>🎉</Text>
                  <Text style={styles.celebrationBadgeText}>Đã ghi nhận chiến thắng!</Text>
                </View>
                {streak !== null && streak > 0 ? (
                  <View style={styles.streakPill}>
                    <Text style={styles.streakEmoji}>🔥</Text>
                    <Text style={styles.streakText}>{streak} ngày</Text>
                  </View>
                ) : null}
              </View>

              <Text style={[typography.subheading, styles.celebrationTitle]}>
                Bạn đã hoàn thành xuất sắc mục tiêu ngày ✨
              </Text>

              <Text style={[typography.caption, styles.celebrationSub]}>
                Bảng tin bạn bè đã được mở khóa toàn bộ. Hãy ghé tab Bảng tin để cổ vũ bạn bè và quay lại vào ngày mai để tiếp tục duy trì chuỗi thắng nhé!
              </Text>
            </View>

            <View style={styles.sectionHeader}>
              <Text style={typography.heading}>Chiến thắng của bạn</Text>
            </View>

            <WinCard win={todayStatus.win} showReaction={false} />
          </View>
        ) : (
          <View>
            <View style={styles.composerCard}>
              {/* Prompt Header */}
              <View style={styles.promptHeader}>
                <View style={styles.sparkleIcon}>
                  <Text style={{ fontSize: 20 }}>✍️</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[typography.heading, styles.composerTitle]}>
                    Chiến thắng nhỏ hôm nay là gì?
                  </Text>
                  <Text style={[typography.caption, styles.composerSubtitle]}>
                    Tối đa 120 ký tự — ghi nhận 1 điều tích cực bạn vừa hoàn thành.
                  </Text>
                </View>
              </View>

              {error && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorIcon}>⚠️</Text>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              {/* Input Box */}
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder={`Ví dụ: ${currentTip}`}
                  placeholderTextColor={colors.textMuted}
                  value={content}
                  onChangeText={setContent}
                  maxLength={120}
                  multiline
                  autoFocus
                />
                <CharacterCounter currentLength={content.length} maxLength={120} />
              </View>

              {/* Post CTA */}
              <TouchableOpacity
                style={[
                  styles.postButton,
                  (!content.trim() || isPosting || content.length > 120) && styles.postButtonDisabled,
                ]}
                onPress={handlePost}
                disabled={!content.trim() || isPosting || content.length > 120}
                activeOpacity={0.85}
              >
                {isPosting ? (
                  <ActivityIndicator color="#09090B" />
                ) : (
                  <Text style={styles.postButtonText}>Đăng Tiny Win 🚀</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Daily Tip Banner */}
            <View style={styles.tipCard}>
              <Text style={styles.tipIcon}>💡</Text>
              <Text style={styles.tipText}>
                Gợi ý: "{currentTip}"
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgApp,
  },
  scrollContent: {
    padding: spacing.lg,
    flexGrow: 1,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
  },
  completedContainer: {
    marginTop: spacing.xs,
  },
  celebrationCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderGlow,
    marginBottom: spacing.lg,
    ...shadows.card,
  },
  celebrationTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  celebrationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accentMuted,
    borderRadius: radius.full,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderGlow,
  },
  celebrationEmoji: {
    fontSize: 16,
    marginRight: spacing.xs,
  },
  celebrationBadgeText: {
    color: colors.accentLight,
    fontWeight: '700',
    fontSize: 13,
  },
  streakPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.streakGoldMuted,
    borderRadius: radius.full,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderGold,
  },
  streakEmoji: {
    fontSize: 14,
    marginRight: 4,
  },
  streakText: {
    color: colors.streakGoldLight,
    fontWeight: '700',
    fontSize: 13,
  },
  celebrationTitle: {
    marginBottom: spacing.xs,
    color: colors.textPrimary,
  },
  celebrationSub: {
    lineHeight: 20,
  },
  sectionHeader: {
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  composerCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.xs,
    ...shadows.card,
  },
  promptHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  sparkleIcon: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderGlow,
  },
  composerTitle: {
    marginBottom: 2,
  },
  composerSubtitle: {
    lineHeight: 18,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.dangerMuted,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.danger,
    gap: spacing.xs,
  },
  errorIcon: {
    fontSize: 14,
  },
  errorText: {
    color: colors.dangerLight,
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  inputWrapper: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    marginBottom: spacing.md,
  },
  input: {
    color: colors.textPrimary,
    fontSize: 16,
    lineHeight: 24,
    minHeight: 110,
    textAlignVertical: 'top',
  },
  postButton: {
    backgroundColor: colors.accent,
    borderRadius: radius.full,
    paddingVertical: spacing.md + 2,
    alignItems: 'center',
    ...shadows.glowGreen,
  },
  postButtonDisabled: {
    opacity: 0.45,
    shadowOpacity: 0,
    elevation: 0,
  },
  postButtonText: {
    color: '#09090B',
    fontWeight: '800',
    fontSize: 16,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceGlass,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.surfaceGlassBorder,
  },
  tipIcon: {
    fontSize: 16,
    marginRight: spacing.sm,
  },
  tipText: {
    color: colors.textMuted,
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
});

