import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface LoadingSpinnerProps {
  message?: string;
  fullScreen?: boolean;
}

export function LoadingSpinner({ message, fullScreen = false }: LoadingSpinnerProps) {
  const { theme } = useTheme();
  return (
    <View style={[styles.container, fullScreen && styles.fullScreen, { backgroundColor: fullScreen ? theme.colors.background : 'transparent' }]}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
      {message && (
        <Text style={[styles.message, { color: theme.colors.textSecondary, fontSize: theme.fontSize.base }]}>
          {message}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  fullScreen: { flex: 1 },
  message: { textAlign: 'center' },
});
