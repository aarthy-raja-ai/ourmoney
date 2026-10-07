import React, { useState } from 'react';
import { View, Text, StyleSheet, Share, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/context/ThemeContext';
import { Button } from '../../src/components/Button';
import { ErrorBanner } from '../../src/components/ErrorBanner';
import { Card } from '../../src/components/Card';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { createHousehold } from '../../src/services/householdService';
import { useAuth } from '../../src/context/AuthContext';

export default function CreateHouseholdScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { firebaseUser, refreshProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteCode, setInviteCode] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!firebaseUser) return;
    setIsLoading(true);
    setError(null);
    try {
      const household = await createHousehold(
        firebaseUser.uid,
        firebaseUser.displayName ?? 'User',
      );
      if (household.inviteCode) {
        setInviteCode(household.inviteCode);
      }
      await refreshProfile();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create household.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = () => {
    if (!inviteCode) return;
    Share.share({
      message: `Join my OurMoney household! Use invite code: ${inviteCode}\n\nThis code expires in 24 hours.`,
    });
  };

  const handleContinue = () => router.replace('/(tabs)');

  if (inviteCode) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ScreenHeader title="Household Created" hideBack />

        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
          <View style={styles.hero}>
            <View style={[styles.iconCircle, { backgroundColor: theme.colors.successLight }]}>
              <Ionicons name="sparkles" size={40} color={theme.colors.success} />
            </View>
            <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
              Household created!
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
              Share this code with your partner so they can join your shared workspace:
            </Text>
          </View>

          <Card style={styles.codeCard}>
            <Text style={[styles.code, { color: theme.colors.primary }]}>{inviteCode}</Text>
            <Text style={[styles.expiry, { color: theme.colors.textTertiary }]}>
              Expires in 24 hours
            </Text>
          </Card>

          <View style={{ marginTop: 20, gap: 12 }}>
            <Button title="Share invite code" onPress={handleShare} variant="outline" fullWidth />
            <Button title="Continue to Dashboard" onPress={handleContinue} fullWidth />
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScreenHeader title="Create Household" />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <View style={[styles.iconCircle, { backgroundColor: theme.colors.primaryLight }]}>
            <Ionicons name="sparkles-outline" size={40} color={theme.colors.primary} />
          </View>
          <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
            Create your household
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            We'll generate a unique 6-character invite code for your partner.
          </Text>
        </View>

        {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

        <View style={{ marginTop: 24 }}>
          <Button
            title="Create Household"
            onPress={handleCreate}
            loading={isLoading}
            fullWidth
            size="lg"
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: 20 },
  hero: { alignItems: 'center', marginBottom: 24, marginTop: 12 },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 22, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  codeCard: { alignItems: 'center', padding: 24 },
  code: { fontSize: 32, fontWeight: '800', letterSpacing: 8, marginBottom: 6 },
  expiry: { fontSize: 12 },
});
