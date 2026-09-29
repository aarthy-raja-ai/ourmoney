import React from 'react';
import { Text, type TextStyle } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { formatAmount, formatAmountCompact } from '../utils/currency';

interface AmountDisplayProps {
  paise: number;
  compact?: boolean;
  style?: TextStyle;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  color?: string;
  bold?: boolean;
}

export function AmountDisplay({
  paise,
  compact = false,
  style,
  size = 'md',
  color,
  bold = false,
}: AmountDisplayProps) {
  const { theme } = useTheme();
  const sizeMap = {
    sm: theme.fontSize.sm,
    md: theme.fontSize.base,
    lg: theme.fontSize.lg,
    xl: theme.fontSize.xl,
    '2xl': theme.fontSize['2xl'],
    '3xl': theme.fontSize['3xl'],
  };

  return (
    <Text
      style={[
        {
          fontSize: sizeMap[size],
          fontWeight: bold ? theme.fontWeight.bold : theme.fontWeight.regular,
          color: color ?? theme.colors.textPrimary,
          fontVariant: ['tabular-nums'],
        },
        style,
      ]}
      accessibilityLabel={formatAmount(paise)}
    >
      {compact ? formatAmountCompact(paise) : formatAmount(paise)}
    </Text>
  );
}
