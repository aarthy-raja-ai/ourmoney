import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, StatusBar, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';

export interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  hideBack?: boolean;
  leftAction?: {
    icon: React.ReactNode;
    onPress: () => void;
    label: string;
  };
  rightAction?: React.ReactNode | {
    icon: React.ReactNode;
    onPress: () => void;
    label: string;
  };
  style?: ViewStyle;
}

export function ScreenHeader({ title, subtitle, leftAction, rightAction, style }: ScreenHeaderProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const topInset = Math.max(
    insets.top,
    Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) : 0,
  );

  return (
    <View style={[styles.container, { paddingTop: topInset + 6 }, style]}>
      <View style={styles.side}>
        {leftAction && (
          <TouchableOpacity
            onPress={leftAction.onPress}
            style={[styles.iconBtn, { backgroundColor: theme.colors.surfaceOverlay, borderRadius: theme.radii.full }]}
            accessibilityRole="button"
            accessibilityLabel={leftAction.label}
          >
            {leftAction.icon}
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.center}>
        <Text style={[styles.title, { color: theme.colors.textPrimary, fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.bold }]}>
          {title}
        </Text>
        {subtitle && (
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary, fontSize: theme.fontSize.xs }]}>
            {subtitle}
          </Text>
        )}
      </View>
      <View style={styles.side}>
        {rightAction && (
          React.isValidElement(rightAction) ? rightAction : (
            <TouchableOpacity
              onPress={(rightAction as any).onPress}
              style={[styles.iconBtn, { backgroundColor: theme.colors.surfaceOverlay, borderRadius: theme.radii.full }]}
              accessibilityRole="button"
              accessibilityLabel={(rightAction as any).label}
            >
              {(rightAction as any).icon}
            </TouchableOpacity>
          )
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12, gap: 8 },
  side: { width: 44, alignItems: 'center' },
  center: { flex: 1, alignItems: 'center' },
  title: {},
  subtitle: {},
  iconBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
});
