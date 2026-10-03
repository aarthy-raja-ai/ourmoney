import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import type { BudgetStatus } from '../models/budget';

export interface ProgressBarProps {
  percentage?: number; // 0-100+
  progress?: number;   // 0-1 or 0-100
  status?: BudgetStatus;
  color?: string;
  height?: number;
}

export function ProgressBar({
  percentage,
  progress,
  status = 'normal',
  color,
  height = 6,
}: ProgressBarProps) {
  const { theme } = useTheme();

  let effectivePercentage = percentage ?? 0;
  if (percentage === undefined && progress !== undefined) {
    effectivePercentage = progress <= 1 ? progress * 100 : progress;
  }

  const fillColor =
    color ??
    ({
      normal: theme.colors.primary,
      'heads-up': theme.colors.warning,
      almost: '#F97316', // orange
      exceeded: theme.colors.danger,
    }[status] ?? theme.colors.primary);

  const fillWidth = Math.min(effectivePercentage, 100);

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
