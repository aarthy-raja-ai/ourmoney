// OurMoney — Delete Account Screen
// Handles user account deletion with explicit confirmation, household ownership transfer, and clear user warnings.

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ShieldAlert, AlertCircle } from 'lucide-react-native';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../src/context/AuthContext';
import { useHousehold } from '../../src/context/HouseholdContext';
import { deleteUserAccount } from '../../src/services/authService';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { ConfirmDialog } from '../../src/components/ConfirmDialog';

export default function DeleteAccountScreen() {
  const { theme, isDark } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const { partner, isSolo } = useHousehold();

  const [showConfirm, setShowConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!user) return;
    setIsDeleting(true);
    setErrorMessage(null);
    try {
      await deleteUserAccount(user.uid);
      setShowConfirm(false);
      Alert.alert(
        'Account Deleted',
        'Your OurMoney account and user profile have been permanently deleted.',
        [{ text: 'OK', onPress: () => router.replace('/(auth)/welcome') }],
      );
    } catch (err: any) {
      console.error('[DELETE_ACCOUNT_SCREEN] Error:', err);
      setShowConfirm(false);
      const msg = err instanceof Error ? err.message : 'Failed to delete account. Please try again.';
      setErrorMessage(msg);
      Alert.alert('Account Deletion Failed', msg);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScreenHeader title="Delete Account" />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Warning Hero Card */}
        <Card style={[styles.heroCard, { backgroundColor: isDark ? '#2D0A10' : '#FFF1F2', borderColor: '#F43F5E40' }]}>
          <View style={styles.heroRow}>
            <ShieldAlert size={32} color={theme.colors.danger} />
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={[styles.heroTitle, { color: theme.colors.danger }]}>
                Permanent Account Deletion
              </Text>
              <Text style={[styles.heroSub, { color: theme.colors.textSecondary }]}>
                This action is permanent and cannot be undone. Please read the consequences carefully.
              </Text>
            </View>
          </View>
        </Card>

        {errorMessage && (
          <Card style={[styles.card, { backgroundColor: isDark ? '#2D0A10' : '#FFF1F2', marginBottom: 16 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <AlertCircle size={20} color={theme.colors.danger} />
              <Text style={{ color: theme.colors.danger, marginLeft: 8, flex: 1, fontSize: 13, fontWeight: '600' }}>
                {errorMessage}
              </Text>
            </View>
          </Card>
        )}

        {/* What gets deleted */}
        <Text style={[styles.sectionHeading, { color: theme.colors.textSecondary }]}>
          What Happens When You Delete Your Account
        </Text>

        <Card style={styles.card}>
          <Text style={[styles.itemTitle, { color: theme.colors.textPrimary }]}>
            1. Account & Profile Credentials
          </Text>
          <Text style={[styles.itemDesc, { color: theme.colors.textSecondary }]}>
            Your email address ({user?.email}), display name, and login credentials will be permanently erased from Firebase Authentication and Firestore database servers.
          </Text>
        </Card>

        <Card style={styles.card}>
          <Text style={[styles.itemTitle, { color: theme.colors.textPrimary }]}>
            2. Household Data & Workspace Rights
          </Text>
          <Text style={[styles.itemDesc, { color: theme.colors.textSecondary }]}>
            {isSolo ? (
              'Since you are in a solo workspace, your entire household workspace, expenses, budgets, loans, and pending purchases will be permanently deleted.'
            ) : partner ? (
              `You will be removed from your shared household workspace with ${partner.displayName}. Your partner's account and historical shared records will remain safe and intact.`
            ) : (
              'Your membership in your household workspace will be severed and your personal user document permanently erased.'
            )}
          </Text>
        </Card>

        <Card style={styles.card}>
          <Text style={[styles.itemTitle, { color: theme.colors.textPrimary }]}>
            3. Irreversible Action
          </Text>
          <Text style={[styles.itemDesc, { color: theme.colors.textSecondary }]}>
            Once deleted, your account cannot be recovered. If you wish to use OurMoney again in the future, you will need to register a brand new account.
          </Text>
        </Card>

        {/* Action Button */}
        <View style={{ marginTop: 24, marginBottom: 40 }}>
          <Button
            title="Permanently Delete My Account"
            variant="danger"
            size="lg"
            onPress={() => setShowConfirm(true)}
            loading={isDeleting}
            fullWidth
          />
        </View>
      </ScrollView>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        visible={showConfirm}
        title="Final Account Deletion Confirmation"
        message="Are you sure you want to permanently delete your account? This will erase your login credentials and profile immediately."
        confirmLabel="Yes, Delete My Account"
        isDestructive
        onConfirm={handleDelete}
        onCancel={() => setShowConfirm(false)}
        loading={isDeleting}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: 16 },
  heroCard: { padding: 16, marginBottom: 16, borderWidth: 1.5 },
  heroRow: { flexDirection: 'row', alignItems: 'center' },
  heroTitle: { fontSize: 16, fontWeight: '800', marginBottom: 2 },
  heroSub: { fontSize: 13, lineHeight: 18 },
  sectionHeading: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, marginLeft: 4 },
  card: { padding: 16, marginBottom: 12 },
  itemTitle: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  itemDesc: { fontSize: 13, lineHeight: 19 },
});
