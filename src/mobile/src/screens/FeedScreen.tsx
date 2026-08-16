import React, { useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { colors, radius, spacing, typography, shadows } from '../theme/colors';
import { Header } from '../components/Header';
import { WinCard } from '../components/WinCard';
import { FeedLockedView } from '../components/FeedLockedView';
import { useWinStore } from '../stores/winStore';

interface FeedScreenProps {
  onGoToPost: () => void;
}

export const FeedScreen: React.FC<FeedScreenProps> = ({ onGoToPost }) => {
  const {
    feedWins,
    feedLocked,
    isLoadingFeed,
    fetchFeed,
    toggleReaction,
  } = useWinStore();

  useEffect(() => {
    fetchFeed();
  }, []);

  if (feedLocked) {
    return (
      <View style={styles.container}>
        <Header title="Bảng tin Bạn bè" subtitle="Không gian chia sẻ tích cực" />
        <FeedLockedView onGoToPost={onGoToPost} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header
        title="Bảng tin Bạn bè"
        subtitle="Những chiến thắng nhỏ tích cực hôm nay ✨"
        badge={feedWins.length > 0 ? `${feedWins.length} tin` : undefined}
      />

      {isLoadingFeed && feedWins.length === 0 ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator color={colors.accent} size="large" />
        </View>
      ) : feedWins.length === 0 ? (
        <View style={styles.centerContainer}>
          <View style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>🌱</Text>
            <Text style={[typography.title, styles.emptyTitle]}>
              Chưa có bài đăng nào hôm nay
            </Text>
            <Text style={[typography.body, styles.emptySubtitle]}>
              Bạn bè của bạn chưa đăng Tiny Win hôm nay hoặc bạn chưa kết nối thêm bạn mới.
            </Text>
          </View>
        </View>
      ) : (
        <FlatList
          data={feedWins}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <WinCard
              win={item}
              onReact={(type) => toggleReaction(item.id, type)}
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isLoadingFeed}
              onRefresh={fetchFeed}
              tintColor={colors.accent}
            />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgApp,
  },
  listContent: {
    padding: spacing.lg,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    width: '100%',
    maxWidth: 360,
    ...shadows.card,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  emptySubtitle: {
    textAlign: 'center',
    color: colors.textSecondary,
    lineHeight: 22,
    fontSize: 14,
  },
});
