import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export function ErrorBanner({ message, onRetry, onDismiss }: ErrorBannerProps) {
  const { theme } = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.dangerLight, borderColor: theme.colors.danger, borderRadius: theme.radii.md }]}>
      <Text style={[styles.message, { color: theme.colors.danger, fontSize: theme.fontSize.sm, flex: 1 }]} accessibilityRole="alert">
        {message}
      </Text>
      <View style={styles.actions}>
        {onRetry && (
          <TouchableOpacity onPress={onRetry} accessibilityRole="button" accessibilityLabel="Retry">
            <Text style={[styles.actionText, { color: theme.colors.danger, fontWeight: theme.fontWeight.semibold, fontSize: theme.fontSize.sm }]}>Retry</Text>
          </TouchableOpacity>
        )}
        {onDismiss && (
          <TouchableOpacity onPress={onDismiss} accessibilityRole="button" accessibilityLabel="Dismiss">
            <Text style={[styles.actionText, { color: theme.colors.textSecondary, fontSize: theme.fontSize.sm }]}>Dismiss</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', padding: 12, borderWidth: 1, gap: 8 },
  message: { lineHeight: 20 },
  actions: { flexDirection: 'row', gap: 12 },
  actionText: {},
});
