// OurMoney Design Tokens
// Premium fintech design system — calm, modern, trustworthy

export const Colors = {
  // Brand palette
  primary: {
    50: '#F0F4FF',
    100: '#E0E9FF',
    200: '#C7D7FE',
    300: '#A5BFFC',
    400: '#819CF8',
    500: '#5B7BF3',
    600: '#4361E8',
    700: '#3249CC',
    800: '#2A3DA4',
    900: '#273782',
  },
  // Neutral palette
  neutral: {
    0: '#FFFFFF',
    50: '#F8F9FC',
    100: '#F0F2F7',
    200: '#E4E8F0',
    300: '#CDD4E0',
    400: '#A8B3C8',
    500: '#7D8EA8',
    600: '#5A6A82',
    700: '#3D4F6B',
    800: '#253352',
    900: '#0F1D35',
    1000: '#060E1E',
  },
  // Semantic
  success: {
    50: '#F0FDF4',
    100: '#DCFCE7',
    500: '#22C55E',
    600: '#16A34A',
    700: '#15803D',
  },
  warning: {
    50: '#FFFBEB',
    100: '#FEF3C7',
    500: '#F59E0B',
    600: '#D97706',
    700: '#B45309',
  },
  danger: {
    50: '#FFF1F2',
    100: '#FFE4E6',
    500: '#F43F5E',
    600: '#E11D48',
    700: '#BE123C',
  },
  // Category colors
  category: {
    food: '#FF6B6B',
    groceries: '#4ECDC4',
    home: '#45B7D1',
    transport: '#96CEB4',
    shopping: '#DDA0DD',
    medical: '#98D8C8',
    bills: '#F7DC6F',
    entertainment: '#BB8FCE',
    education: '#85C1E9',
    travel: '#F8C471',
    other: '#AEB6BF',
  },
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
} as const;

export const Radii = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  full: 9999,
} as const;

export const FontSize = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 19,
  xl: 22,
  '2xl': 26,
  '3xl': 30,
  '4xl': 36,
  '5xl': 44,
} as const;

export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};

export const LineHeight = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.75,
} as const;

export const Shadow = {
  sm: {
    shadowColor: '#0F1D35',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#0F1D35',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#0F1D35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;

export const Duration = {
  fast: 150,
  normal: 250,
  slow: 400,
} as const;
