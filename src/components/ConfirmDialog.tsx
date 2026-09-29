import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Button } from './Button';

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDestructive = false,
  onConfirm,
  onCancel,
  isLoading = false,
}: ConfirmDialogProps) {
  const { theme } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onCancel}>
        <View
          style={[
            styles.dialog,
            {
              backgroundColor: theme.colors.surface,
              borderRadius: theme.radii.xl,
              ...theme.shadow.lg,
            },
          ]}
          accessibilityRole="alertdialog"
          accessibilityLabel={title}
        >
          <Text style={[styles.title, { color: theme.colors.textPrimary, fontSize: theme.fontSize.lg, fontWeight: theme.fontWeight.bold }]}>
            {title}
          </Text>
          <Text style={[styles.message, { color: theme.colors.textSecondary, fontSize: theme.fontSize.base }]}>
            {message}
          </Text>
          <View style={styles.actions}>
            <Button title={cancelLabel} onPress={onCancel} variant="ghost" style={styles.btn} disabled={isLoading} />
            <Button
              title={confirmLabel}
              onPress={onConfirm}
              variant={isDestructive ? 'danger' : 'primary'}
              style={styles.btn}
              isLoading={isLoading}
            />
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  dialog: { width: '100%', padding: 24, gap: 12 },
  title: { textAlign: 'center' },
  message: { textAlign: 'center', lineHeight: 22 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  btn: { flex: 1 },
});
