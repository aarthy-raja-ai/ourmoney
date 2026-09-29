import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/context/ThemeContext';
import { Button } from '../../src/components/Button';
import { Input } from '../../src/components/Input';
import { ErrorBanner } from '../../src/components/ErrorBanner';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { joinHousehold } from '../../src/services/householdService';
import { useAuth } from '../../src/context/AuthContext';

export default function JoinHouseholdScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { firebaseUser, refreshProfile } = useAuth();
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleJoin = async () => {
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length !== 6) {
      setError('Invite codes are 6 characters. Please check and try again.');
      return;
    }
    if (!firebaseUser) return;
    setError(null);
    setIsLoading(true);
    try {
      await joinHousehold(firebaseUser.uid, trimmed);
      await refreshProfile();
      router.replace('/(tabs)/');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to join household.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScreenHeader title="Join Household" />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.hero}>
            <View style={[styles.iconCircle, { backgroundColor: theme.colors.primaryLight }]}>
              <Ionicons name="link" size={40} color={theme.colors.primary} />
            </View>
            <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
              Join a household
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
              Enter the 6-character invite code from your partner.
            </Text>
          </View>

          {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

          <Input
            label="Invite Code"
            value={code}
            onChangeText={(t) => setCode(t.toUpperCase())}
            autoCapitalize="characters"
            maxLength={6}
            placeholder="A7K9P2"
            returnKeyType="done"
            onSubmitEditing={handleJoin}
            inputStyle={{ letterSpacing: 6, fontSize: 24, fontWeight: '800', textAlign: 'center' }}
            isRequired
          />

          <View style={{ marginTop: 24 }}>
            <Button
              title="Join Household"
              onPress={handleJoin}
              loading={isLoading}
              disabled={isLoading || code.trim().length !== 6}
              fullWidth
              size="lg"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flexGrow: 1, padding: 20 },
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
});
