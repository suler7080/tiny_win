import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
  Share,
  Alert,
  Image,
  Platform,
} from 'react-native';
import { colors, radius, spacing, typography, shadows } from '../theme/colors';
import { Friend, InviteTokenResponse } from '../types';
import * as friendsApi from '../api/friends';

import { useAuthStore } from '../stores/authStore';

interface FriendModalProps {
  visible: boolean;
  onClose: () => void;
  onFriendAdded?: () => void;
}

type TabType = 'my_code' | 'add_friend' | 'list';

export const FriendModal: React.FC<FriendModalProps> = ({
  visible,
  onClose,
  onFriendAdded,
}) => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabType>('my_code');
  const [inviteData, setInviteData] = useState<InviteTokenResponse | null>(null);
  const [friendsList, setFriendsList] = useState<Friend[]>([]);
  const [connectInput, setConnectInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  const defaultIdentifier = user?.username ? `@${user.username}` : user?.id ? user.id.slice(0, 8) : 'friend';
  const currentInviteUrl = inviteData?.invite_url || `https://tinywin.app/join/${defaultIdentifier}`;
  const currentToken = inviteData?.token || defaultIdentifier;

  useEffect(() => {
    if (visible) {
      loadInitialData();
    } else {
      setFeedbackMsg(null);
      setConnectInput('');
      setCopySuccess(false);
    }
  }, [visible]);

  const loadInitialData = async () => {
    setIsLoading(true);
    setFeedbackMsg(null);
    try {
      const [invite, friendsRes] = await Promise.all([
        friendsApi.createInviteToken().catch((e) => {
          console.warn('createInviteToken error:', e);
          return null;
        }),
        friendsApi.getFriends().catch((e) => {
          console.warn('getFriends error:', e);
          return { friends: [], total: 0 };
        }),
      ]);
      if (invite) setInviteData(invite);
      if (friendsRes?.friends) setFriendsList(friendsRes.friends);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(text);
      }
      setCopySuccess(true);
      setFeedbackMsg({
        type: 'success',
        text: 'Đã sao chép link kết bạn vào bộ nhớ tạm! 🎉',
      });
      setTimeout(() => setCopySuccess(false), 3500);
    } catch {
      setFeedbackMsg({
        type: 'success',
        text: `Link kết bạn của bạn: ${text}`,
      });
    }
  };

  const handleCopyLink = async () => {
    await copyToClipboard(currentInviteUrl);
  };

  const handleShareLink = async () => {
    const message = `Cùng mình ghi nhận chiến thắng nhỏ mỗi ngày trên Tiny Win nhé! Kết bạn với mình qua link: ${currentInviteUrl}`;
    try {
      const result = await Share.share({
        message,
        url: currentInviteUrl,
        title: 'Kết bạn trên Tiny Win',
      });
      if (result.action === Share.dismissedAction) {
        // User dismissed
      }
    } catch {
      // Fallback to copy link on web or platforms where Share is unavailable
      await copyToClipboard(currentInviteUrl);
    }
  };

  const handleConnect = async () => {
    const input = connectInput.trim();
    if (!input) return;

    setIsSubmitting(true);
    setFeedbackMsg(null);
    try {
      const isToken = input.includes('/join/') || (!input.startsWith('@') && input.length >= 8);
      const payload = isToken ? { token: input } : { username: input };

      const newFriend = await friendsApi.connectFriend(payload);
      setFeedbackMsg({
        type: 'success',
        text: `Đã kết nối thành công với @${newFriend.friend.username}! 🎉`,
      });
      setConnectInput('');

      // Reload friend list
      const updated = await friendsApi.getFriends();
      if (updated?.friends) {
        setFriendsList(updated.friends);
      }
      onFriendAdded?.();
    } catch (err: any) {
      const msg =
        err?.response?.data?.detail?.error?.message ||
        err?.response?.data?.message ||
        err?.message ||
        'Không thể kết bạn. Vui lòng kiểm tra lại mã hoặc username.';
      setFeedbackMsg({ type: 'error', text: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveFriend = (friend: Friend) => {
    Alert.alert(
      'Hủy kết bạn',
      `Bạn có chắc chắn muốn hủy kết bạn với @${friend.friend.username}?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xác nhận',
          style: 'destructive',
          onPress: async () => {
            try {
              await friendsApi.removeFriend(friend.friend.id);
              setFriendsList((prev) => prev.filter((f) => f.friendship_id !== friend.friendship_id));
              onFriendAdded?.();
            } catch {
              Alert.alert('Lỗi', 'Không thể hủy kết bạn lúc này.');
            }
          },
        },
      ]
    );
  };

  // QR Code Image Generator URL
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
    currentInviteUrl
  )}&bgcolor=18181B&color=10B981&margin=8`;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Kết nối bạn bè ✨</Text>
              <Text style={styles.subtitle}>Cùng nhau duy trì thói quen tích cực</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Tab bar */}
          <View style={styles.tabBar}>
            <TouchableOpacity
              style={[styles.tabItem, activeTab === 'my_code' && styles.tabItemActive]}
              onPress={() => setActiveTab('my_code')}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, activeTab === 'my_code' && styles.tabTextActive]}>
                🎫 Mã QR của tôi
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabItem, activeTab === 'add_friend' && styles.tabItemActive]}
              onPress={() => setActiveTab('add_friend')}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, activeTab === 'add_friend' && styles.tabTextActive]}>
                🔗 Thêm bạn
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabItem, activeTab === 'list' && styles.tabItemActive]}
              onPress={() => setActiveTab('list')}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, activeTab === 'list' && styles.tabTextActive]}>
                👥 Bạn bè ({friendsList.length})
              </Text>
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <View style={styles.centerLoading}>
              <ActivityIndicator size="large" color={colors.accent} />
              <Text style={[typography.caption, { color: colors.textMuted, marginTop: spacing.md }]}>
                Đang tạo mã kết bạn cá nhân...
              </Text>
            </View>
          ) : (
            <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
              {/* Tab 1: My QR / Code */}
              {activeTab === 'my_code' && (
                <View style={styles.qrSection}>
                  <View style={styles.qrVisualContainer}>
                    <View style={styles.qrImageWrapper}>
                      <Image
                        source={{ uri: qrImageUrl }}
                        style={styles.qrImage}
                        resizeMode="contain"
                      />
                    </View>

                    <View style={styles.tokenRow}>
                      <Text style={styles.tokenLabel}>Mã kết bạn:</Text>
                      <Text style={styles.qrTokenText}>{currentToken}</Text>
                    </View>
                    <Text style={styles.qrHint}>
                      Quét mã QR hoặc chia sẻ link bên dưới để kết bạn 1-chạm
                    </Text>
                  </View>

                  {feedbackMsg && (
                    <View
                      style={[
                        styles.feedbackBox,
                        feedbackMsg.type === 'success' ? styles.feedbackSuccess : styles.feedbackError,
                      ]}
                    >
                      <Text
                        style={[
                          styles.feedbackText,
                          feedbackMsg.type === 'success' ? styles.textSuccess : styles.textError,
                        ]}
                      >
                        {feedbackMsg.text}
                      </Text>
                    </View>
                  )}

                  <View style={styles.buttonRow}>
                    <TouchableOpacity
                      style={[styles.actionBtnPrimary, copySuccess && styles.actionBtnSuccess]}
                      onPress={handleCopyLink}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.actionBtnPrimaryText}>
                        {copySuccess ? '✓ Đã sao chép link' : '📋 Sao chép Link'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.actionBtnSecondary}
                      onPress={handleShareLink}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.actionBtnSecondaryText}>📤 Chia sẻ</Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    onPress={loadInitialData}
                    style={styles.refreshLinkBtn}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.refreshLinkText}>🔄 Tạo mã mời mới</Text>
                  </TouchableOpacity>

                  <Text style={styles.expiryNote}>⏳ Mã mời tự động làm mới sau mỗi 48 giờ</Text>
                </View>
              )}

              {/* Tab 2: Add Friend via Input */}
              {activeTab === 'add_friend' && (
                <View style={styles.inputSection}>
                  <Text style={styles.inputLabel}>Nhập Link mời, Mã Token hoặc @Username:</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="VD: https://tinywin.app/join/... hoặc @hoanganh"
                    placeholderTextColor={colors.textMuted}
                    value={connectInput}
                    onChangeText={setConnectInput}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />

                  {feedbackMsg && (
                    <View
                      style={[
                        styles.feedbackBox,
                        feedbackMsg.type === 'success' ? styles.feedbackSuccess : styles.feedbackError,
                      ]}
                    >
                      <Text
                        style={[
                          styles.feedbackText,
                          feedbackMsg.type === 'success' ? styles.textSuccess : styles.textError,
                        ]}
                      >
                        {feedbackMsg.text}
                      </Text>
                    </View>
                  )}

                  <TouchableOpacity
                    style={[styles.actionBtnPrimary, isSubmitting && styles.btnDisabled]}
                    onPress={handleConnect}
                    disabled={isSubmitting || !connectInput.trim()}
                    activeOpacity={0.8}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator color={colors.textInverse} />
                    ) : (
                      <Text style={styles.actionBtnPrimaryText}>🤝 Kết nối ngay</Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}

              {/* Tab 3: Friends List */}
              {activeTab === 'list' && (
                <View style={styles.listSection}>
                  {friendsList.length === 0 ? (
                    <View style={styles.emptyList}>
                      <Text style={styles.emptyEmoji}>👥</Text>
                      <Text style={styles.emptyTitle}>Chưa có bạn bè nào</Text>
                      <Text style={styles.emptySubtitle}>
                        Chia sẻ mã kết bạn của bạn để cùng bạn bè ghi nhận chiến thắng mỗi ngày!
                      </Text>
                    </View>
                  ) : (
                    friendsList.map((item) => (
                      <View key={item.friendship_id} style={styles.friendRow}>
                        <View style={styles.avatarBadge}>
                          <Text style={styles.avatarInitial}>
                            {(item.friend.display_name || item.friend.username)[0].toUpperCase()}
                          </Text>
                        </View>
                        <View style={styles.friendInfo}>
                          <Text style={styles.friendName}>
                            {item.friend.display_name || `@${item.friend.username}`}
                          </Text>
                          <Text style={styles.friendUsername}>@{item.friend.username}</Text>
                        </View>
                        <View style={styles.streakBadge}>
                          <Text style={styles.streakText}>🔥 {item.friend.current_streak}</Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => handleRemoveFriend(item)}
                          style={styles.removeBtn}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.removeBtnText}>✕</Text>
                        </TouchableOpacity>
                      </View>
                    ))
                  )}
                </View>
              )}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: colors.surfaceElevated,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    maxHeight: '88%',
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.heading,
    color: colors.textPrimary,
    fontSize: 18,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceHighlight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  closeBtnText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: 4,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  tabItem: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    alignItems: 'center',
    borderRadius: radius.sm,
  },
  tabItemActive: {
    backgroundColor: colors.surfaceHighlight,
    borderWidth: 1,
    borderColor: colors.borderGlow,
  },
  tabText: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '600',
  },
  tabTextActive: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
  centerLoading: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
  },
  contentContainer: {
    paddingBottom: spacing.lg,
  },
  qrSection: {
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  qrVisualContainer: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    width: '100%',
    ...shadows.subtle,
  },
  qrImageWrapper: {
    width: 190,
    height: 190,
    backgroundColor: '#18181B',
    borderRadius: radius.md,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: colors.accent,
  },
  qrImage: {
    width: 180,
    height: 180,
  },
  qrFallbackBox: {
    width: 140,
    height: 140,
    backgroundColor: colors.bgApp,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  tokenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: 4,
  },
  tokenLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  qrTokenText: {
    ...typography.heading,
    letterSpacing: 1.5,
    color: colors.accentLight,
    fontSize: 16,
  },
  qrHint: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    fontSize: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    width: '100%',
  },
  actionBtnPrimary: {
    flex: 1,
    backgroundColor: colors.accent,
    borderRadius: radius.full,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.glowGreen,
  },
  actionBtnSuccess: {
    backgroundColor: '#059669',
  },
  actionBtnPrimaryText: {
    ...typography.bodyBold,
    color: '#09090B',
    fontWeight: '800',
  },
  actionBtnSecondary: {
    flex: 1,
    backgroundColor: colors.surfaceHighlight,
    borderRadius: radius.full,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  actionBtnSecondaryText: {
    ...typography.bodyBold,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  refreshLinkBtn: {
    marginTop: spacing.md,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  refreshLinkText: {
    ...typography.caption,
    color: colors.accentLight,
    fontWeight: '600',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  expiryNote: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.xs,
    fontSize: 11,
  },
  inputSection: {
    paddingVertical: spacing.sm,
  },
  inputLabel: {
    ...typography.captionBold,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    ...typography.body,
    marginBottom: spacing.md,
  },
  feedbackBox: {
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.md,
    width: '100%',
  },
  feedbackSuccess: {
    backgroundColor: colors.accentMuted,
    borderColor: colors.accent,
    borderWidth: 1,
  },
  feedbackError: {
    backgroundColor: colors.dangerMuted,
    borderColor: colors.danger,
    borderWidth: 1,
  },
  feedbackText: {
    ...typography.caption,
    textAlign: 'center',
  },
  textSuccess: {
    color: colors.accentLight,
  },
  textError: {
    color: colors.dangerLight,
  },
  listSection: {
    paddingVertical: spacing.xs,
  },
  emptyList: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    ...typography.heading,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
  friendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    marginBottom: spacing.sm,
  },
  avatarBadge: {
    width: 38,
    height: 38,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceHighlight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  avatarInitial: {
    ...typography.heading,
    color: colors.accentLight,
    fontSize: 16,
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    ...typography.subheading,
    color: colors.textPrimary,
    fontSize: 14,
  },
  friendUsername: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 12,
  },
  streakBadge: {
    backgroundColor: colors.streakGoldMuted,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
    marginRight: spacing.sm,
  },
  streakText: {
    ...typography.captionBold,
    color: colors.streakGold,
    fontSize: 12,
  },
  removeBtn: {
    padding: spacing.xs,
  },
  removeBtnText: {
    color: colors.textMuted,
    fontSize: 14,
  },
});
