import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import type { BudgetStatus } from '../models/budget';

interface ProgressBarProps {
  percentage: number; // 0-100+
  status?: BudgetStatus;
  height?: number;
}

export function ProgressBar({ percentage, status = 'normal', height = 6 }: ProgressBarProps) {
  const { theme } = useTheme();

  const fillColor = {
    normal: theme.colors.primary,
    'heads-up': theme.colors.warning,
    almost: '#F97316', // orange
    exceeded: theme.colors.danger,
  }[status];

  const fillWidth = Math.min(percentage, 100);

  return (
    <View
      style={[
        styles.track,
        { height, backgroundColor: theme.colors.borderLight, borderRadius: height },
      ]}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(fillWidth) }}
    >
      <View
        style={[
          styles.fill,
          {
            width: `${fillWidth}%`,
            backgroundColor: fillColor,
            borderRadius: height,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { overflow: 'hidden' },
  fill: { height: '100%' },
});
