import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { colors, radius, spacing, typography, shadows } from '../theme/colors';
import { Header } from '../components/Header';
import { FriendModal } from '../components/FriendModal';
import { useAuthStore } from '../stores/authStore';
import * as streaksApi from '../api/streaks';
import { CalendarResponse, StreakResponse } from '../types';

const WEEKDAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

export const ProfileScreen: React.FC = () => {
  const { user, logout } = useAuthStore();
  const [streakData, setStreakData] = useState<StreakResponse | null>(null);
  const [calendarData, setCalendarData] = useState<CalendarResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [friendModalVisible, setFriendModalVisible] = useState(false);

  useEffect(() => {
    if (user) {
      loadProfileData();
    }
  }, [user]);

  const loadProfileData = async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      const [streaks, calendar] = await Promise.all([
        streaksApi.getUserStreaks(user.id).catch(() => null),
        streaksApi.getUserCalendar(user.id).catch(() => null),
      ]);
      setStreakData(streaks);
      setCalendarData(calendar);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất khỏi tài khoản?',
      [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Đăng xuất', style: 'destructive', onPress: logout },
      ]
    );
  };

  const displayName = user?.display_name || user?.username || 'User';

  // Heatmap rendering logic (Day 1 to 31)
  const now = new Date();
  const currentYear = calendarData?.year || now.getFullYear();
  const currentMonth = calendarData?.month || now.getMonth() + 1;
  const currentDaysInMonth = new Date(currentYear, currentMonth, 0).getDate();
  const isCurrentMonthNow =
    now.getFullYear() === currentYear && now.getMonth() + 1 === currentMonth;
  const todayDateNum = now.getDate();

  // First day of month (0 = Sunday, 1 = Monday, etc.)
  // Adjust so Monday is index 0
  const firstDayRaw = new Date(currentYear, currentMonth - 1, 1).getDay();
  const firstDayOffset = firstDayRaw === 0 ? 6 : firstDayRaw - 1;

  const daysWonSet = new Set(
    (calendarData?.days || []).map((d) => parseInt(d.split('-')[2], 10))
  );

  const completedCount = calendarData?.days.length || 0;
  const completionPercentage = Math.round((completedCount / currentDaysInMonth) * 100);

  // Dynamic color for completion pill
  const pillStyle =
    completionPercentage >= 90
      ? styles.pillGold
      : completionPercentage >= 50
      ? styles.pillEmerald
      : styles.pillAmber;

  return (
    <View style={styles.container}>
      <Header
        title="Hồ sơ cá nhân"
        subtitle="Hành trình duy trì thói quen tích cực"
        rightElement={
          <View style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'center' }}>
            <TouchableOpacity
              onPress={() => setFriendModalVisible(true)}
              style={styles.qrHeaderBtn}
              activeOpacity={0.7}
            >
              <Text style={styles.qrHeaderBtnText}>🎫 QR</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleLogout} style={styles.logoutButton} activeOpacity={0.7}>
              <Text style={styles.logoutText}>Đăng xuất</Text>
            </TouchableOpacity>
          </View>
        }
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* User Bio Card */}
        <View style={styles.userCard}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarLargeText}>
              {displayName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={typography.title}>{displayName}</Text>
            <Text style={typography.caption}>@{user?.username}</Text>
            <View style={styles.timezoneBadge}>
              <Text style={styles.timezoneText}>🌐 {user?.timezone || 'Asia/Ho_Chi_Minh'}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.friendActionBtn}
            onPress={() => setFriendModalVisible(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.friendActionText}>👥 Bạn bè</Text>
          </TouchableOpacity>
        </View>

        <FriendModal
          visible={friendModalVisible}
          onClose={() => setFriendModalVisible(false)}
        />

        {isLoading ? (
          <ActivityIndicator color={colors.accent} style={{ marginTop: spacing.xl }} />
        ) : (
          <>
            {/* Streak Metrics 3-Card Grid */}
            <View style={styles.streakGrid}>
              <View style={[styles.statBox, styles.statBoxPrimary]}>
                <View style={styles.statIconBadge}>
                  <Text style={{ fontSize: 20 }}>🔥</Text>
                </View>
                <Text style={[typography.stat, styles.statValueGold]}>
                  {streakData?.current_streak ?? 0}
                </Text>
                <Text style={styles.statUnit}>ngày</Text>
                <Text style={styles.statLabel}>Chuỗi hiện tại</Text>
              </View>

              <View style={styles.statBox}>
                <View style={styles.statIconBadge}>
                  <Text style={{ fontSize: 20 }}>🏆</Text>
                </View>
                <Text style={[typography.stat, styles.statValue]}>
                  {streakData?.longest_streak ?? 0}
                </Text>
                <Text style={styles.statUnit}>ngày</Text>
                <Text style={styles.statLabel}>Kỷ lục chuỗi</Text>
              </View>

              <View style={styles.statBox}>
                <View style={styles.statIconBadge}>
                  <Text style={{ fontSize: 20 }}>🎯</Text>
                </View>
                <Text style={[typography.stat, styles.statValue]}>
                  {streakData?.total_wins ?? 0}
                </Text>
                <Text style={styles.statUnit}>win</Text>
                <Text style={styles.statLabel}>Tổng Tiny Win</Text>
              </View>
            </View>

            {/* Monthly Heatmap Calendar */}
            <View style={styles.calendarCard}>
              <View style={styles.calendarHeader}>
                <View>
                  <Text style={typography.heading}>
                    Tháng {currentMonth}/{currentYear}
                  </Text>
                  <Text style={typography.caption}>
                    {completedCount}/{currentDaysInMonth} ngày hoàn thành
                  </Text>
                </View>
                <View style={[styles.completionPill, pillStyle]}>
                  <Text style={styles.completionText}>{completionPercentage}%</Text>
                </View>
              </View>

              {/* Weekday Labels Header */}
              <View style={styles.weekdayHeaderRow}>
                {WEEKDAYS.map((wd) => (
                  <Text key={wd} style={styles.weekdayLabel}>
                    {wd}
                  </Text>
                ))}
              </View>

              {/* 7-Column Heatmap Grid */}
              <View style={styles.heatmapGrid}>
                {/* Empty offset cells before day 1 */}
                {Array.from({ length: firstDayOffset }).map((_, idx) => (
                  <View key={`offset-${idx}`} style={styles.heatmapCellEmpty} />
                ))}

                {/* Day cells */}
                {Array.from({ length: currentDaysInMonth }).map((_, idx) => {
                  const dayNumber = idx + 1;
                  const hasWon = daysWonSet.has(dayNumber);
                  const isToday = isCurrentMonthNow && dayNumber === todayDateNum;
                  return (
                    <View
                      key={dayNumber}
                      style={[
                        styles.heatmapCell,
                        hasWon && styles.heatmapCellActive,
                        isToday && !hasWon && styles.heatmapCellToday,
                        isToday && hasWon && styles.heatmapCellTodayActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.heatmapCellText,
                          hasWon && styles.heatmapCellTextActive,
                          isToday && !hasWon && styles.heatmapCellTextToday,
                        ]}
                      >
                        {dayNumber}
                      </Text>
                    </View>
                  );
                })}
              </View>

              {/* Monthly Progress Bar */}
              <View style={styles.progressContainer}>
                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${Math.min(100, Math.max(0, completionPercentage))}%` },
                    ]}
                  />
                </View>
                <Text style={styles.progressLabel}>
                  Đã đạt {completionPercentage}% mục tiêu tháng này ✨
                </Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgApp,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  logoutButton: {
    backgroundColor: colors.dangerMuted,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  logoutText: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: '700',
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  avatarLarge: {
    width: 62,
    height: 62,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    borderWidth: 2,
    borderColor: colors.accent,
    ...shadows.glowGreen,
  },
  avatarLargeText: {
    color: colors.accentLight,
    fontWeight: '800',
    fontSize: 24,
  },
  userInfo: {
    flex: 1,
  },
  timezoneBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    marginTop: spacing.xs,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  timezoneText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '500',
  },
  streakGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statBox: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.subtle,
  },
  statBoxPrimary: {
    borderColor: colors.borderGold,
    backgroundColor: colors.surfaceElevated,
    ...shadows.glowGold,
  },
  statIconBadge: {
    marginBottom: 2,
  },
  statValue: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.textPrimary,
    lineHeight: 30,
  },
  statValueGold: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.streakGoldLight,
    lineHeight: 30,
  },
  statUnit: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
    fontWeight: '600',
  },
  calendarCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  completionPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  pillEmerald: {
    backgroundColor: colors.accentMuted,
    borderColor: colors.borderGlow,
  },
  pillGold: {
    backgroundColor: colors.streakGoldMuted,
    borderColor: colors.borderGold,
  },
  pillAmber: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  completionText: {
    color: colors.accentLight,
    fontWeight: '800',
    fontSize: 13,
  },
  weekdayHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    paddingHorizontal: 2,
  },
  weekdayLabel: {
    width: 38,
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  heatmapGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'flex-start',
  },
  heatmapCellEmpty: {
    width: 38,
    height: 38,
  },
  heatmapCell: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  heatmapCellActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accentLight,
    ...shadows.glowGreen,
  },
  heatmapCellToday: {
    borderColor: colors.accentLight,
    borderWidth: 2,
  },
  heatmapCellTodayActive: {
    borderWidth: 2,
    borderColor: '#FFF',
  },
  heatmapCellText: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '600',
  },
  heatmapCellTextActive: {
    color: '#09090B',
    fontWeight: '800',
  },
  heatmapCellTextToday: {
    color: colors.accentLight,
    fontWeight: '800',
  },
  progressContainer: {
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  progressTrack: {
    height: 6,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.full,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: radius.full,
  },
  progressLabel: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
  qrHeaderBtn: {
    backgroundColor: colors.surfaceHighlight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.borderGlow,
  },
  qrHeaderBtnText: {
    ...typography.captionBold,
    color: colors.accentLight,
    fontSize: 12,
  },
  friendActionBtn: {
    backgroundColor: colors.surfaceHighlight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  friendActionText: {
    ...typography.captionBold,
    color: colors.textPrimary,
    fontSize: 12,
  },
});


