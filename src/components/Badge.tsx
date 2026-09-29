import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import type { BudgetStatus } from '../models/budget';

interface BadgeProps {
  label: string;
  status?: BudgetStatus | 'info' | 'success' | 'neutral';
  size?: 'sm' | 'md';
}

export function Badge({ label, status = 'neutral', size = 'sm' }: BadgeProps) {
  const { theme } = useTheme();

  const colorMap: Record<string, { bg: string; text: string }> = {
    normal: { bg: theme.colors.successLight, text: theme.colors.success },
    'heads-up': { bg: theme.colors.warningLight, text: theme.colors.warning },
    almost: { bg: '#FFF0E6', text: '#C25500' },
    exceeded: { bg: theme.colors.dangerLight, text: theme.colors.danger },
    info: { bg: theme.colors.primaryLight, text: theme.colors.primary },
    success: { bg: theme.colors.successLight, text: theme.colors.success },
    neutral: { bg: theme.colors.borderLight, text: theme.colors.textSecondary },
  };

  const colors = colorMap[status] ?? colorMap.neutral;

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: colors.bg,
          borderRadius: theme.radii.full,
          paddingHorizontal: size === 'sm' ? 8 : 12,
          paddingVertical: size === 'sm' ? 3 : 5,
        },
      ]}
    >
      <Text style={[styles.text, { color: colors.text, fontSize: size === 'sm' ? theme.fontSize.xs : theme.fontSize.sm, fontWeight: theme.fontWeight.semibold }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { alignSelf: 'flex-start' },
  text: {},
});
