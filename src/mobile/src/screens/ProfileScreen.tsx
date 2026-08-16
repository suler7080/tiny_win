import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { colors, radius, spacing, typography, shadows } from '../theme/colors';
import { Header } from '../components/Header';
import { useAuthStore } from '../stores/authStore';
import * as streaksApi from '../api/streaks';
import { CalendarResponse, StreakResponse } from '../types';

const WEEKDAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

export const ProfileScreen: React.FC = () => {
  const { user, logout } = useAuthStore();
  const [streakData, setStreakData] = useState<StreakResponse | null>(null);
  const [calendarData, setCalendarData] = useState<CalendarResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  const displayName = user?.display_name || user?.username || 'User';

  // Heatmap rendering logic (Day 1 to 31)
  const currentYear = calendarData?.year || new Date().getFullYear();
  const currentMonth = calendarData?.month || new Date().getMonth() + 1;
  const currentDaysInMonth = new Date(currentYear, currentMonth, 0).getDate();

  // First day of month (0 = Sunday, 1 = Monday, etc.)
  // Adjust so Monday is index 0
  const firstDayRaw = new Date(currentYear, currentMonth - 1, 1).getDay();
  const firstDayOffset = firstDayRaw === 0 ? 6 : firstDayRaw - 1;

  const daysWonSet = new Set(
    (calendarData?.days || []).map((d) => parseInt(d.split('-')[2], 10))
  );

  const completedCount = calendarData?.days.length || 0;
  const completionPercentage = Math.round((completedCount / currentDaysInMonth) * 100);

  return (
    <View style={styles.container}>
      <Header
        title="Hồ sơ cá nhân"
        subtitle="Hành trình duy trì thói quen tích cực"
        rightElement={
          <TouchableOpacity onPress={logout} style={styles.logoutButton} activeOpacity={0.7}>
            <Text style={styles.logoutText}>Đăng xuất</Text>
          </TouchableOpacity>
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
              <Text style={styles.timezoneText}>🌐 {user?.timezone || 'UTC'}</Text>
            </View>
          </View>
        </View>

        {isLoading ? (
          <ActivityIndicator color={colors.accent} style={{ marginTop: spacing.xl }} />
        ) : (
          <>
            {/* Streak Metrics 3-Card Grid */}
            <View style={styles.streakGrid}>
              <View style={[styles.statBox, styles.statBoxPrimary]}>
                <View style={styles.statIconBadge}>
                  <Text style={{ fontSize: 18 }}>🔥</Text>
                </View>
                <Text style={styles.statValue}>
                  {streakData?.current_streak ?? 0} <Text style={styles.statUnit}>ngày</Text>
                </Text>
                <Text style={styles.statLabel}>Chuỗi hiện tại</Text>
              </View>

              <View style={styles.statBox}>
                <View style={styles.statIconBadge}>
                  <Text style={{ fontSize: 18 }}>🏆</Text>
                </View>
                <Text style={styles.statValue}>
                  {streakData?.longest_streak ?? 0} <Text style={styles.statUnit}>ngày</Text>
                </Text>
                <Text style={styles.statLabel}>Kỷ lục chuỗi</Text>
              </View>

              <View style={styles.statBox}>
                <View style={styles.statIconBadge}>
                  <Text style={{ fontSize: 18 }}>🎯</Text>
                </View>
                <Text style={styles.statValue}>
                  {streakData?.total_wins ?? 0} <Text style={styles.statUnit}>win</Text>
                </Text>
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
                <View style={styles.completionPill}>
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
                  return (
                    <View
                      key={dayNumber}
                      style={[
                        styles.heatmapCell,
                        hasWon && styles.heatmapCellActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.heatmapCellText,
                          hasWon && styles.heatmapCellTextActive,
                        ]}
                      >
                        {dayNumber}
                      </Text>
                    </View>
                  );
                })}
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
    fontSize: 13,
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
    width: 60,
    height: 60,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.lg,
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
  },
  statIconBadge: {
    marginBottom: 4,
  },
  statValue: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  statUnit: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
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
    backgroundColor: colors.accentMuted,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.borderGlow,
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
  heatmapCellText: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '600',
  },
  heatmapCellTextActive: {
    color: '#000',
    fontWeight: '800',
  },
});
