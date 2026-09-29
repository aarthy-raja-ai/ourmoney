import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  containerStyle?: ViewStyle;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isRequired?: boolean;
}

export function Input({
  label,
  error,
  hint,
  containerStyle,
  leftIcon,
  rightIcon,
  isRequired,
  ...props
}: InputProps) {
  const { theme } = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  const borderColor = error
    ? theme.colors.danger
    : isFocused
    ? theme.colors.primary
    : theme.colors.border;

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text
          style={[
            styles.label,
            { color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.medium },
          ]}
        >
          {label}
          {isRequired && <Text style={{ color: theme.colors.danger }}> *</Text>}
        </Text>
      )}
      <View
        style={[
          styles.inputRow,
          {
            borderColor,
            borderRadius: theme.radii.md,
            backgroundColor: theme.colors.surface,
            borderWidth: isFocused ? 1.5 : 1,
          },
        ]}
      >
        {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}
        <TextInput
          style={[
            styles.input,
            {
              color: theme.colors.textPrimary,
              fontSize: theme.fontSize.base,
              paddingLeft: leftIcon ? 0 : theme.spacing.base,
              paddingRight: rightIcon ? 0 : theme.spacing.base,
            },
          ]}
          placeholderTextColor={theme.colors.textTertiary}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          accessibilityLabel={label}
          {...props}
        />
        {rightIcon && <View style={styles.iconRight}>{rightIcon}</View>}
      </View>
      {error ? (
        <Text style={[styles.hint, { color: theme.colors.danger, fontSize: theme.fontSize.xs }]}>
          {error}
        </Text>
      ) : hint ? (
        <Text style={[styles.hint, { color: theme.colors.textTertiary, fontSize: theme.fontSize.xs }]}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 6 },
  label: { marginBottom: 2 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
  },
  input: { flex: 1, paddingVertical: 12 },
  iconLeft: { paddingLeft: 14, paddingRight: 8 },
  iconRight: { paddingRight: 14, paddingLeft: 8 },
  hint: { marginTop: 4 },
});
