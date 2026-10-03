import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { Button } from './Button';

export interface EmptyStateProps {
  title: string;
  subtitle?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode | string;
}

export function EmptyState({
  title,
  subtitle,
  message,
  actionLabel,
  onAction,
  icon,
}: EmptyStateProps) {
  const { theme } = useTheme();
  const descriptionText = subtitle ?? message;

  const renderIcon = () => {
    if (!icon) return null;
    if (typeof icon === 'string') {
      return <Ionicons name={icon as any} size={48} color={theme.colors.textTertiary} />;
    }
    return icon;
  };

  return (
    <View style={styles.container}>
      {renderIcon() && <View style={styles.iconContainer}>{renderIcon()}</View>}
      <Text style={[styles.title, { color: theme.colors.textPrimary, fontSize: theme.fontSize.lg, fontWeight: theme.fontWeight.semibold }]}>
        {title}
      </Text>
      {descriptionText && (
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary, fontSize: theme.fontSize.base }]}>
          {descriptionText}
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
