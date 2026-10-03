import React from 'react';
import { View, TouchableOpacity, StyleSheet, type ViewStyle, type StyleProp } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  elevation?: 'none' | 'sm' | 'md';
  padding?: number;
  onPress?: () => void;
}

export function Card({ children, style, elevation = 'sm', padding, onPress }: CardProps) {
  const { theme } = useTheme();
  const shadow = elevation === 'none' ? {} : theme.shadow[elevation];
  const paddingValue = padding ?? theme.spacing.base;

  const cardStyle: ViewStyle[] = [
    styles.card,
    {
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      borderRadius: theme.radii.lg,
      padding: paddingValue,
      ...shadow,
    },
    style as ViewStyle,
  ];

  if (onPress) {
    return (
      <TouchableOpacity style={cardStyle} onPress={onPress} activeOpacity={0.8}>
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    overflow: 'hidden',
  },
});
