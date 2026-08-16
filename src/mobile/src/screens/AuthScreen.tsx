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
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');

  const { login, register, isLoading, error, clearError } = useAuthStore();

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
      
      const timezone =
        Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Ho_Chi_Minh';
      try {
        await register({
          email: email.trim(),
          password,
          username: username.trim(),
          display_name: displayName.trim() || undefined,
          timezone,
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
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Brand Header */}
        <View style={styles.header}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoEmoji}>✨</Text>
          </View>
          <Text style={[typography.hero, styles.title]}>Tiny Win</Text>
          <Text style={[typography.body, styles.subtitle]}>
            Mỗi ngày 1 chiến thắng nhỏ — Nuôi dưỡng thói quen lớn.
          </Text>
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
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {isRegister && (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Tên tài khoản (Username)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="hoanganh_dev"
                  placeholderTextColor={colors.textMuted}
                  value={username}
                  onChangeText={(text) => {
                    clearError();
                    setUsername(text);
                  }}
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Tên hiển thị (Tùy chọn)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Hoàng Anh"
                  placeholderTextColor={colors.textMuted}
                  value={displayName}
                  onChangeText={(text) => {
                    clearError();
                    setDisplayName(text);
                  }}
                />
              </View>
            </>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="ban@example.com"
              placeholderTextColor={colors.textMuted}
              value={email}
              onChangeText={(text) => {
                clearError();
                setEmail(text);
              }}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mật khẩu</Text>
            <TextInput
              style={styles.input}
              placeholder="Tối thiểu 8 ký tự"
              placeholderTextColor={colors.textMuted}
              value={password}
              onChangeText={(text) => {
                clearError();
                setPassword(text);
              }}
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}
            disabled={isLoading}
            activeOpacity={0.85}
          >
            {isLoading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.submitButtonText}>
                {isRegister ? 'Bắt đầu hành trình 🚀' : 'Đăng nhập ngay 💫'}
              </Text>
            )}
          </TouchableOpacity>
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
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: radius.xl,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderGlow,
    ...shadows.glowGreen,
  },
  logoEmoji: {
    fontSize: 32,
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
    padding: 3,
    marginBottom: spacing.lg,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: radius.sm,
  },
  segmentBtnActive: {
    backgroundColor: colors.surfaceHighlight,
    borderWidth: 1,
    borderColor: colors.border,
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
  inputGroup: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.captionBold,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: colors.textPrimary,
    fontSize: 15,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  submitButton: {
    backgroundColor: colors.accent,
    borderRadius: radius.full,
    paddingVertical: spacing.md + 2,
    alignItems: 'center',
    marginTop: spacing.md,
    ...shadows.glowGreen,
  },
  submitButtonText: {
    color: '#000',
    fontWeight: '800',
    fontSize: 16,
  },
});
