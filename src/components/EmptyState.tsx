import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Button } from './Button';

interface EmptyStateProps {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export function EmptyState({ title, subtitle, actionLabel, onAction, icon }: EmptyStateProps) {
  const { theme } = useTheme();
  return (
    <View style={styles.container}>
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      <Text style={[styles.title, { color: theme.colors.textPrimary, fontSize: theme.fontSize.lg, fontWeight: theme.fontWeight.semibold }]}>
        {title}
      </Text>
      {subtitle && (
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary, fontSize: theme.fontSize.base }]}>
          {subtitle}
        </Text>
      )}
      {actionLabel && onAction && (
        <Button title={actionLabel} onPress={onAction} style={styles.action} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', padding: 32, gap: 12 },
  iconContainer: { marginBottom: 8, opacity: 0.5 },
  title: { textAlign: 'center' },
  subtitle: { textAlign: 'center', opacity: 0.75, lineHeight: 22 },
  action: { marginTop: 8 },
});
