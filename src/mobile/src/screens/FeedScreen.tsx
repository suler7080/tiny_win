import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { colors, radius, spacing, typography, shadows } from '../theme/colors';
import { Header } from '../components/Header';
import { WinCard } from '../components/WinCard';
import { FeedLockedView } from '../components/FeedLockedView';
import { FriendModal } from '../components/FriendModal';
import { useWinStore } from '../stores/winStore';

interface FeedScreenProps {
  onGoToPost: () => void;
}

export const FeedScreen: React.FC<FeedScreenProps> = ({ onGoToPost }) => {
  const [friendModalVisible, setFriendModalVisible] = useState(false);
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

  const handleFriendAdded = () => {
    fetchFeed();
  };

  if (feedLocked) {
    return (
      <View style={styles.container}>
        <Header
          title="Bảng tin Bạn bè"
          subtitle="Không gian chia sẻ tích cực"
          rightElement={
            <TouchableOpacity
              onPress={() => setFriendModalVisible(true)}
              style={styles.friendBtn}
              activeOpacity={0.7}
            >
              <Text style={styles.friendBtnText}>👥 Bạn bè</Text>
            </TouchableOpacity>
          }
        />
        <FeedLockedView onGoToPost={onGoToPost} />
        <FriendModal
          visible={friendModalVisible}
          onClose={() => setFriendModalVisible(false)}
          onFriendAdded={handleFriendAdded}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header
        title="Bảng tin Bạn bè"
        subtitle="Những chiến thắng nhỏ tích cực hôm nay ✨"
        badge={feedWins.length > 0 ? `${feedWins.length} tin` : undefined}
        rightElement={
          <TouchableOpacity
            onPress={() => setFriendModalVisible(true)}
            style={styles.friendBtn}
            activeOpacity={0.7}
          >
            <Text style={styles.friendBtnText}>👥 Bạn bè</Text>
          </TouchableOpacity>
        }
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
            <TouchableOpacity
              style={styles.addFriendActionBtn}
              onPress={() => setFriendModalVisible(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.addFriendActionText}>✨ Kết nối bạn bè ngay</Text>
            </TouchableOpacity>
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

      <FriendModal
        visible={friendModalVisible}
        onClose={() => setFriendModalVisible(false)}
        onFriendAdded={handleFriendAdded}
      />
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
  addFriendActionBtn: {
    marginTop: spacing.lg,
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    ...shadows.glowGreen,
  },
  addFriendActionText: {
    ...typography.bodyBold,
    color: colors.textInverse,
    fontWeight: '700',
  },
  friendBtn: {
    backgroundColor: colors.surfaceHighlight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  friendBtnText: {
    ...typography.captionBold,
    color: colors.textPrimary,
    fontSize: 12,
  },
});

