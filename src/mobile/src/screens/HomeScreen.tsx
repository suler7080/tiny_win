import React, { useEffect, useState } from 'react';
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

export const HomeScreen: React.FC = () => {
  const [content, setContent] = useState('');
  const { user } = useAuthStore();
  const { todayStatus, isLoadingStatus, isPosting, fetchTodayStatus, postWin, error } =
    useWinStore();

  useEffect(() => {
    fetchTodayStatus();
  }, []);

  const handlePost = async () => {
    if (!content.trim() || content.length > 120) return;
    try {
      await postWin(content.trim());
      setContent('');
    } catch (e) {
      // Error handled in store
    }
  };

  const hasPosted = todayStatus?.has_posted_today;

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

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {isLoadingStatus ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator color={colors.accent} size="large" />
          </View>
        ) : hasPosted && todayStatus?.win ? (
          <View style={styles.completedContainer}>
            {/* Celebration Hero Card */}
            <View style={styles.celebrationCard}>
              <View style={styles.celebrationBadge}>
                <Text style={styles.celebrationEmoji}>🎉</Text>
                <Text style={styles.celebrationBadgeText}>Chiến thắng hôm nay đã ghi nhận!</Text>
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
                  Tối đa 120 ký tự — ghi nhận một hành động tích cực bạn vừa hoàn thành.
                </Text>
              </View>
            </View>

            {error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Input Box */}
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Ví dụ: Đã đọc xong 1 chương sách đầu ngày 📚"
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
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.postButtonText}>Đăng Tiny Win 🚀</Text>
              )}
            </TouchableOpacity>
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
  celebrationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.accentMuted,
    borderRadius: radius.full,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
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
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  composerTitle: {
    marginBottom: 2,
  },
  composerSubtitle: {
    lineHeight: 18,
  },
  errorBox: {
    backgroundColor: colors.dangerMuted,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  errorText: {
    color: colors.dangerLight,
    fontSize: 13,
    fontWeight: '600',
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
    paddingVertical: spacing.md,
    alignItems: 'center',
    ...shadows.glowGreen,
  },
  postButtonDisabled: {
    opacity: 0.45,
    shadowOpacity: 0,
    elevation: 0,
  },
  postButtonText: {
    color: '#000',
    fontWeight: '800',
    fontSize: 16,
  },
});
