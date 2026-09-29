import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, type ViewStyle } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  leftAction?: {
    icon: React.ReactNode;
    onPress: () => void;
    label: string;
  };
  rightAction?: {
    icon: React.ReactNode;
    onPress: () => void;
    label: string;
  };
  style?: ViewStyle;
}

export function ScreenHeader({ title, subtitle, leftAction, rightAction, style }: ScreenHeaderProps) {
  const { theme } = useTheme();
  return (
    <View style={[styles.container, style]}>
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
          <TouchableOpacity
            onPress={rightAction.onPress}
            style={[styles.iconBtn, { backgroundColor: theme.colors.surfaceOverlay, borderRadius: theme.radii.full }]}
            accessibilityRole="button"
            accessibilityLabel={rightAction.label}
          >
            {rightAction.icon}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  side: { width: 44, alignItems: 'center' },
  center: { flex: 1, alignItems: 'center' },
  title: {},
  subtitle: {},
  iconBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
});
