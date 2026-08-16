import React, { useEffect, useState } from 'react';
import {
  StatusBar,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, spacing, typography, shadows } from './src/theme/colors';
import { useAuthStore } from './src/stores/authStore';
import { AuthScreen } from './src/screens/AuthScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { FeedScreen } from './src/screens/FeedScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';

type Tab = 'home' | 'feed' | 'profile';

export default function App() {
  const { user, isLoading, initAuth } = useAuthStore();
  const [currentTab, setCurrentTab] = useState<Tab>('home');

  useEffect(() => {
    initAuth();
  }, []);

  if (isLoading) {
    return (
      <SafeAreaProvider>
        <View style={styles.loadingContainer}>
          <StatusBar barStyle="light-content" backgroundColor={colors.bgApp} />
          <ActivityIndicator color={colors.accent} size="large" />
        </View>
      </SafeAreaProvider>
    );
  }

  if (!user) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.safeArea}>
          <StatusBar barStyle="light-content" backgroundColor={colors.bgApp} />
          <AuthScreen />
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor={colors.bgApp} />

        {/* Screen Body */}
        <View style={styles.content}>
          {currentTab === 'home' && <HomeScreen />}
          {currentTab === 'feed' && <FeedScreen onGoToPost={() => setCurrentTab('home')} />}
          {currentTab === 'profile' && <ProfileScreen />}
        </View>

        {/* Bottom Navigation Bar */}
        <View style={styles.bottomNavContainer}>
          <View style={styles.bottomNav}>
            <TouchableOpacity
              style={[styles.navItem, currentTab === 'home' && styles.navItemActive]}
              onPress={() => setCurrentTab('home')}
              activeOpacity={0.8}
            >
              <Text style={styles.navEmoji}>✍️</Text>
              <Text
                style={[
                  styles.navLabel,
                  currentTab === 'home' && styles.navLabelActive,
                ]}
              >
                Hôm nay
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.navItem, currentTab === 'feed' && styles.navItemActive]}
              onPress={() => setCurrentTab('feed')}
              activeOpacity={0.8}
            >
              <Text style={styles.navEmoji}>👥</Text>
              <Text
                style={[
                  styles.navLabel,
                  currentTab === 'feed' && styles.navLabelActive,
                ]}
              >
                Bảng tin
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.navItem, currentTab === 'profile' && styles.navItemActive]}
              onPress={() => setCurrentTab('profile')}
              activeOpacity={0.8}
            >
              <Text style={styles.navEmoji}>👤</Text>
              <Text
                style={[
                  styles.navLabel,
                  currentTab === 'profile' && styles.navLabelActive,
                ]}
              >
                Cá nhân
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.bgApp,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.bgApp,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  bottomNavContainer: {
    backgroundColor: colors.bgApp,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.full,
    padding: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.subtle,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
  },
  navItemActive: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.borderGlow,
  },
  navEmoji: {
    fontSize: 18,
    marginBottom: 2,
  },
  navLabel: {
    ...typography.micro,
    color: colors.textSecondary,
    fontSize: 11,
  },
  navLabelActive: {
    color: colors.accentLight,
    fontWeight: '700',
  },
});
