import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

export function OfflineBanner() {
  const { isOffline } = useNetworkStatus();
  const { theme } = useTheme();

  if (!isOffline) return null;

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.colors.warningLight, borderBottomColor: theme.colors.warning },
      ]}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <Text style={[styles.text, { color: theme.colors.warning, fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.medium }]}>
        Offline — changes will sync when you're back online
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingVertical: 8, paddingHorizontal: 16, borderBottomWidth: 1, alignItems: 'center' },
  text: { textAlign: 'center' },
});
