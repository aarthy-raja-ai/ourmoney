import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  style,
  textStyle,
  fullWidth = false,
}: ButtonProps) {
  const { theme } = useTheme();

  const getContainerStyle = (): ViewStyle => {
    const base: ViewStyle = {
      borderRadius: theme.radii.md,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      paddingVertical: size === 'sm' ? 8 : size === 'lg' ? 16 : 12,
      paddingHorizontal: size === 'sm' ? 14 : size === 'lg' ? 28 : 20,
      opacity: disabled || isLoading ? 0.6 : 1,
      width: fullWidth ? '100%' : undefined,
    };
    switch (variant) {
      case 'primary':
        return { ...base, backgroundColor: theme.colors.primary };
      case 'secondary':
        return { ...base, backgroundColor: theme.colors.primaryLight, borderWidth: 1, borderColor: theme.colors.primary };
      case 'ghost':
        return { ...base, backgroundColor: 'transparent' };
      case 'danger':
        return { ...base, backgroundColor: theme.colors.danger };
    }
  };

  const getTextStyle = (): TextStyle => {
    const base: TextStyle = {
      fontSize: size === 'sm' ? theme.fontSize.sm : size === 'lg' ? theme.fontSize.md : theme.fontSize.base,
      fontWeight: theme.fontWeight.semibold,
    };
    switch (variant) {
      case 'primary':
      case 'danger':
        return { ...base, color: '#FFFFFF' };
      case 'secondary':
        return { ...base, color: theme.colors.primary };
      case 'ghost':
        return { ...base, color: theme.colors.primary };
    }
  };

  return (
    <TouchableOpacity
      style={[getContainerStyle(), style]}
      onPress={onPress}
      disabled={disabled || isLoading}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: disabled || isLoading }}
    >
      {isLoading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' || variant === 'danger' ? '#FFFFFF' : theme.colors.primary}
        />
      ) : (
        <Text style={[getTextStyle(), textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}
