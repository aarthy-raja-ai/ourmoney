// OurMoney — Join Household Screen
// Handles entering a 6-character invite code, expired code states, invalid code states, and successful household joining.

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Link, AlertCircle, Clock } from 'lucide-react-native';
import { useTheme } from '../../src/context/ThemeContext';
import { Button } from '../../src/components/Button';
import { Input } from '../../src/components/Input';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { Card } from '../../src/components/Card';
import { joinHousehold } from '../../src/services/householdService';
import { useAuth } from '../../src/context/AuthContext';

type ErrorState = {
  type: 'expired' | 'invalid' | 'generic';
  title: string;
  message: string;
} | null;

export default function JoinHouseholdScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { firebaseUser, refreshProfile } = useAuth();
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorState, setErrorState] = useState<ErrorState>(null);

  const handleJoin = async () => {
    const trimmed = code.trim().toUpperCase();
    console.log('[INVITE_DEBUG] Join Household button tapped with code:', trimmed);

    if (trimmed.length !== 6) {
      setErrorState({
        type: 'invalid',
        title: 'Invalid invite code',
        message: 'Please check and try again.',
      });
      return;
    }
    if (!firebaseUser) return;

    setErrorState(null);
    setIsLoading(true);
    try {
      await joinHousehold(firebaseUser.uid, trimmed);
      await refreshProfile();
      Alert.alert('Success', 'Household joined successfully');
      router.replace('/(tabs)/');
    } catch (e: any) {
      const msg = e?.message || '';
      console.log('[INVITE_DEBUG] Join Household caught error:', msg);
      if (msg.includes('EXPIRED_CODE')) {
        setErrorState({
          type: 'expired',
          title: 'Invite code expired',
          message: 'Ask the household owner to generate a new code.',
        });
      } else if (msg.includes('INVALID_CODE')) {
        setErrorState({
          type: 'invalid',
          title: 'Invalid invite code',
          message: 'Please check and try again.',
        });
      } else {
        setErrorState({
          type: 'generic',
          title: 'Unable to Join',
          message: msg.replace(/^(EXPIRED_CODE|INVALID_CODE):\s*/, '') || 'Failed to join household. Please try again.',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleTryAnotherCode = () => {
    setCode('');
    setErrorState(null);
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
              <Link size={36} color={theme.colors.primary} />
            </View>
            <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
              Join a household
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
              Enter the 6-character invite code from your partner.
            </Text>
          </View>

          {/* Special Error State Cards (Expired / Invalid / Generic) */}
          {errorState ? (
            <Card style={styles.errorCard}>
              <View style={styles.errorHeader}>
                {errorState.type === 'expired' ? (
                  <Clock size={28} color={theme.colors.danger} />
                ) : (
                  <AlertCircle size={28} color={theme.colors.danger} />
                )}
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.errorTitle, { color: theme.colors.textPrimary }]}>
                    {errorState.title}
                  </Text>
                  <Text style={[styles.errorMessage, { color: theme.colors.textSecondary }]}>
                    {errorState.message}
                  </Text>
                </View>
              </View>

              <View style={{ marginTop: 16 }}>
                <Button
                  title="Try another code"
                  variant="outline"
                  onPress={handleTryAnotherCode}
                  fullWidth
                />
              </View>
            </Card>
          ) : (
            <>
              <Input
                label="Invite Code"
                value={code}
                onChangeText={(t) => {
                  setCode(t.toUpperCase());
                  if (errorState) setErrorState(null);
                }}
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
            </>
          )}
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
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 22, fontWeight: '800', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  errorCard: { padding: 20, marginBottom: 20, borderWidth: 1.5, borderColor: '#F43F5E40' },
  errorHeader: { flexDirection: 'row', alignItems: 'center' },
  errorTitle: { fontSize: 17, fontWeight: '700', marginBottom: 4 },
  errorMessage: { fontSize: 14, lineHeight: 20 },
});
