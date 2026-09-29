import React from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  elevation?: 'none' | 'sm' | 'md';
  padding?: number;
}

export function Card({ children, style, elevation = 'sm', padding }: CardProps) {
  const { theme } = useTheme();
  const shadow = elevation === 'none' ? {} : theme.shadow[elevation];
  const paddingValue = padding ?? theme.spacing.base;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderRadius: theme.radii.lg,
          padding: paddingValue,
          ...shadow,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    overflow: 'hidden',
  },
});
