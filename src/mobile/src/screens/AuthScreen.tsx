import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { colors, radius, spacing, typography, shadows } from '../theme/colors';
import { useAuthStore } from '../stores/authStore';

export const AuthScreen: React.FC = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');

  const { login, register, isSubmitting, error, clearError } = useAuthStore();

  const detectedTimezone =
    Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Ho_Chi_Minh';

  const handleSubmit = async () => {
    // Client-side validation
    if (!email.trim()) {
      useAuthStore.setState({ error: 'Vui lòng nhập địa chỉ email của bạn.' });
      return;
    }
    if (!password) {
      useAuthStore.setState({ error: 'Vui lòng nhập mật khẩu.' });
      return;
    }

    if (isRegister) {
      if (!username.trim()) {
        useAuthStore.setState({ error: 'Vui lòng nhập tên người dùng (Username).' });
        return;
      }
      if (username.trim().length < 3) {
        useAuthStore.setState({ error: 'Tên người dùng phải có ít nhất 3 ký tự.' });
        return;
      }
      if (password.length < 8) {
        useAuthStore.setState({ error: 'Mật khẩu phải có tối thiểu 8 ký tự.' });
        return;
      }
      
      try {
        await register({
          email: email.trim(),
          password,
          username: username.trim(),
          display_name: displayName.trim() || undefined,
          timezone: detectedTimezone,
        });
      } catch (e) {
        // Handled in store
      }
    } else {
      try {
        await login({
          email: email.trim(),
          password,
        });
      } catch (e) {
        // Handled in store
      }
    }
  };

  const switchTab = (registerMode: boolean) => {
    clearError();
    setIsRegister(registerMode);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Brand Header */}
        <View style={styles.header}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoEmoji}>🌱</Text>
          </View>
          <Text style={[typography.hero, styles.title]}>Tiny Win</Text>
          <Text style={[typography.body, styles.subtitle]}>
            Flex nhỏ thôi — nhưng thật ✨
          </Text>

          {/* Social Proof Pill */}
          <View style={styles.socialProofPill}>
            <Text style={styles.socialProofText}>🔥 1,234+ người đang duy trì streak</Text>
          </View>
        </View>

        {/* Auth Card */}
        <View style={styles.formCard}>
          {/* Segmented Control */}
          <View style={styles.segmentContainer}>
            <TouchableOpacity
              style={[styles.segmentBtn, !isRegister && styles.segmentBtnActive]}
              onPress={() => switchTab(false)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.segmentText,
                  !isRegister && styles.segmentTextActive,
                ]}
              >
                Đăng nhập
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.segmentBtn, isRegister && styles.segmentBtnActive]}
              onPress={() => switchTab(true)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.segmentText,
                  isRegister && styles.segmentTextActive,
                ]}
              >
                Đăng ký
              </Text>
            </TouchableOpacity>
          </View>

          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorIcon}>⚠️</Text>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {isRegister && (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Tên tài khoản (Username)</Text>
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputPrefixIcon}>👤</Text>
                  <TextInput
                    style={styles.inputWithIcon}
                    placeholder="hoanganh_dev"
                    placeholderTextColor={colors.textMuted}
                    value={username}
                    onChangeText={(text) => {
                      clearError();
                      setUsername(text);
                    }}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Tên hiển thị (Tùy chọn)</Text>
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputPrefixIcon}>✏️</Text>
                  <TextInput
                    style={styles.inputWithIcon}
                    placeholder="Hoàng Anh"
                    placeholderTextColor={colors.textMuted}
                    value={displayName}
                    onChangeText={(text) => {
                      clearError();
                      setDisplayName(text);
                    }}
                  />
                </View>
              </View>
            </>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputPrefixIcon}>📧</Text>
              <TextInput
                style={styles.inputWithIcon}
                placeholder="ban@example.com"
                placeholderTextColor={colors.textMuted}
                value={email}
                onChangeText={(text) => {
                  clearError();
                  setEmail(text);
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mật khẩu</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputPrefixIcon}>🔒</Text>
              <TextInput
                style={styles.inputWithIcon}
                placeholder="Tối thiểu 8 ký tự"
                placeholderTextColor={colors.textMuted}
                value={password}
                onChangeText={(text) => {
                  clearError();
                  setPassword(text);
                }}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.eyeIcon}>{showPassword ? '👁️' : '🙈'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {isRegister && (
            <View style={styles.tzBadge}>
              <Text style={styles.tzBadgeText}>🌐 Múi giờ: {detectedTimezone} ✓</Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}
            disabled={isSubmitting}
            activeOpacity={0.85}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#09090B" />
            ) : (
              <Text style={styles.submitButtonText}>
                {isRegister ? 'Bắt đầu hành trình 🚀' : 'Đăng nhập ngay 💫'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Trust Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            ✨ Nuôi dưỡng thói quen tích cực mỗi ngày
          </Text>
        </View>
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
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.lg,
    paddingVertical: spacing.xxl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  logoBadge: {
    width: 68,
    height: 68,
    borderRadius: radius.xl,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.borderGlow,
    ...shadows.glowGreen,
  },
  logoEmoji: {
    fontSize: 34,
  },
  title: {
    marginBottom: spacing.xxs,
    textAlign: 'center',
  },
  subtitle: {
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 20,
    fontWeight: '500',
  },
  socialProofPill: {
    backgroundColor: colors.streakGoldMuted,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderGold,
  },
  socialProofText: {
    color: colors.streakGoldLight,
    fontSize: 12,
    fontWeight: '600',
  },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.md,
    padding: 4,
    marginBottom: spacing.lg,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    alignItems: 'center',
    borderRadius: radius.sm,
  },
  segmentBtnActive: {
    backgroundColor: colors.surfaceHighlight,
    borderWidth: 1,
    borderColor: colors.borderGlow,
  },
  segmentText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  segmentTextActive: {
    color: colors.textPrimary,
    fontWeight: '700',
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
  inputGroup: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.captionBold,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    paddingHorizontal: spacing.md,
  },
  inputPrefixIcon: {
    fontSize: 15,
    marginRight: spacing.sm,
  },
  inputWithIcon: {
    flex: 1,
    paddingVertical: spacing.md,
    color: colors.textPrimary,
    fontSize: 15,
  },
  eyeBtn: {
    padding: spacing.xs,
  },
  eyeIcon: {
    fontSize: 16,
  },
  tzBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceHighlight,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xxs + 1,
    marginBottom: spacing.sm,
  },
  tzBadgeText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: colors.accent,
    borderRadius: radius.full,
    paddingVertical: spacing.md + 2,
    alignItems: 'center',
    marginTop: spacing.sm,
    ...shadows.glowGreen,
  },
  submitButtonText: {
    color: '#09090B',
    fontWeight: '800',
    fontSize: 16,
    letterSpacing: -0.2,
  },
  footer: {
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  footerText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },
});

