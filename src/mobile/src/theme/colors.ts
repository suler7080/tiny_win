/**
 * Tiny Win Design System & Tokens
 * Calm Focused Dark Aesthetic with Vibrant Accents & High Tactility
 * Adheres to 3-layer token architecture: Primitive -> Semantic -> Component
 */

export const colors = {
  // Primitives - Dark Surfaces
  bgApp: '#09090B',
  bgSubtle: '#121215',
  surface: '#18181B',
  surfaceElevated: '#222227',
  surfaceHighlight: '#2E2E36',
  
  // Primitives - Borders
  border: '#2A2A32',
  borderSubtle: '#1E1E24',
  borderGlow: 'rgba(16, 185, 129, 0.35)',
  borderGold: 'rgba(245, 158, 11, 0.4)',

  // Typography Tokens (High contrast WCAG >= 4.5:1)
  textPrimary: '#F4F4F6',
  textSecondary: '#A1A1AA',
  textMuted: '#71717A',
  textInverse: '#09090B',
  
  // Brand & Semantic Accents
  accent: '#10B981',        // Emerald Vitality
  accentLight: '#6EE7B7',
  accentMuted: 'rgba(16, 185, 129, 0.15)',
  accentGlow: 'rgba(16, 185, 129, 0.25)',

  streakGold: '#F59E0B',    // Amber Flame
  streakGoldLight: '#FDE68A',
  streakGoldMuted: 'rgba(245, 158, 11, 0.16)',

  blueHighlight: '#38BDF8', // Cyan/Sky Accent
  blueMuted: 'rgba(56, 189, 248, 0.15)',

  danger: '#EF4444',
  dangerLight: '#FCA5A5',
  dangerMuted: 'rgba(239, 68, 68, 0.15)',

  warning: '#F59E0B',
  success: '#10B981',

  // Reaction highlights
  fireActive: '#FF6B00',
  fireBg: 'rgba(255, 107, 0, 0.16)',
  eyesActive: '#38BDF8',
  eyesBg: 'rgba(56, 189, 248, 0.16)',
  handshakeActive: '#10B981',
  handshakeBg: 'rgba(16, 185, 129, 0.16)',

  // Aliases for compatibility
  background: '#09090B',
};

export const typography = {
  hero: {
    fontSize: 30,
    fontWeight: '800' as const,
    color: colors.textPrimary,
    letterSpacing: -0.6,
  },
  title: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: colors.textPrimary,
    letterSpacing: -0.4,
  },
  heading: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  subheading: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: colors.textPrimary,
  },
  body: {
    fontSize: 15,
    fontWeight: '400' as const,
    color: colors.textPrimary,
    lineHeight: 23,
  },
  bodyBold: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    lineHeight: 23,
  },
  caption: {
    fontSize: 13,
    fontWeight: '400' as const,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  captionBold: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: colors.textSecondary,
  },
  micro: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: colors.textMuted,
    letterSpacing: 0.2,
  },
};

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  huge: 40,
};

export const radius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  full: 9999,
};

export const shadows = {
  subtle: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 3,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 6,
  },
  glowGreen: {
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 5,
  },
  glowGold: {
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 5,
  },
};
