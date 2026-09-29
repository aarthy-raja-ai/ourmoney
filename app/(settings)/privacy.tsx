// OurMoney — Privacy & Account Deletion Settings Screen
// Provides data export, account deletion, and data isolation controls.

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../src/context/AuthContext';
import { deleteUserAccount } from '../../src/services/authService';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { ConfirmDialog } from '../../src/components/ConfirmDialog';

export default function PrivacySettingsScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { signOut } = useAuth();

  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    try {
      setIsDeleting(true);
      await deleteUserAccount();
      setShowConfirmDelete(false);
      router.replace('/(auth)/welcome');
    } catch (err: any) {
      Alert.alert('Account Deletion Failed', err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScreenHeader title="Privacy & Data Control" />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Card style={styles.card}>
          <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
            Data Rights & Ownership
          </Text>
          <Text style={[styles.text, { color: theme.colors.textSecondary }]}>
            Your financial data belongs exclusively to you and your household partner. OurMoney never
            sells your data or shares it with third-party advertisers.
          </Text>
        </Card>

        <View style={{ marginTop: 24 }}>
          <Button
            title="Permanently Delete Account"
            variant="danger"
            onPress={() => setShowConfirmDelete(true)}
          />
        </View>
      </ScrollView>

      <ConfirmDialog
        visible={showConfirmDelete}
        title="Delete Account"
        message="Are you sure you want to permanently delete your account? This action cannot be undone."
        confirmLabel="Delete Account"
        variant="danger"
        onConfirm={handleDeleteAccount}
        onCancel={() => setShowConfirmDelete(false)}
        loading={isDeleting}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: 16 },
  card: { padding: 16, marginBottom: 16 },
  title: { fontSize: 16, fontWeight: '700', marginBottom: 6 },
  text: { fontSize: 13, lineHeight: 18 },
});
