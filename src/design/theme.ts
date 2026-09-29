import { Colors, Spacing, Radii, FontSize, FontWeight, Shadow } from './tokens';

export interface Theme {
  colors: {
    // Backgrounds
    background: string;
    surface: string;
    surfaceElevated: string;
    surfaceOverlay: string;
    // Text
    textPrimary: string;
    textSecondary: string;
    textTertiary: string;
    textOnPrimary: string;
    textOnAccent: string;
    // Brand
    primary: string;
    primaryLight: string;
    primaryDark: string;
    // Borders
    border: string;
    borderLight: string;
    // Semantic
    success: string;
    successLight: string;
    warning: string;
    warningLight: string;
    danger: string;
    dangerLight: string;
    // Special
    accent: string;
    muted: string;
    separator: string;
  };
  spacing: typeof Spacing;
  radii: typeof Radii;
  fontSize: typeof FontSize;
  fontWeight: typeof FontWeight;
  shadow: typeof Shadow;
}

export const lightTheme: Theme = {
  colors: {
    background: Colors.neutral[50],
    surface: Colors.neutral[0],
    surfaceElevated: Colors.neutral[0],
    surfaceOverlay: 'rgba(9, 30, 66, 0.08)',
    textPrimary: Colors.neutral[900],
    textSecondary: Colors.neutral[600],
    textTertiary: Colors.neutral[400],
    textOnPrimary: Colors.neutral[0],
    textOnAccent: Colors.neutral[0],
    primary: Colors.primary[600],
    primaryLight: Colors.primary[50],
    primaryDark: Colors.primary[800],
    border: Colors.neutral[200],
    borderLight: Colors.neutral[100],
    success: Colors.success[600],
    successLight: Colors.success[50],
    warning: Colors.warning[600],
    warningLight: Colors.warning[50],
    danger: Colors.danger[600],
    dangerLight: Colors.danger[50],
    accent: Colors.primary[500],
    muted: Colors.neutral[400],
    separator: Colors.neutral[200],
  },
  spacing: Spacing,
  radii: Radii,
  fontSize: FontSize,
  fontWeight: FontWeight,
  shadow: Shadow,
};

export const darkTheme: Theme = {
  colors: {
    background: Colors.neutral[1000],
    surface: Colors.neutral[900],
    surfaceElevated: Colors.neutral[800],
    surfaceOverlay: 'rgba(255, 255, 255, 0.06)',
    textPrimary: Colors.neutral[50],
    textSecondary: Colors.neutral[300],
    textTertiary: Colors.neutral[500],
    textOnPrimary: Colors.neutral[0],
    textOnAccent: Colors.neutral[0],
    primary: Colors.primary[400],
    primaryLight: Colors.primary[900],
    primaryDark: Colors.primary[200],
    border: Colors.neutral[800],
    borderLight: Colors.neutral[900],
    success: Colors.success[500],
    successLight: '#0A2918',
    warning: Colors.warning[500],
    warningLight: '#2D1A00',
    danger: Colors.danger[500],
    dangerLight: '#2D0A10',
    accent: Colors.primary[400],
    muted: Colors.neutral[600],
    separator: Colors.neutral[800],
  },
  spacing: Spacing,
  radii: Radii,
  fontSize: FontSize,
  fontWeight: FontWeight,
  shadow: Shadow,
};
