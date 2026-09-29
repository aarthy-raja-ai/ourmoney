import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/context/ThemeContext';
import { Button } from '../../src/components/Button';
import { Input } from '../../src/components/Input';
import { ErrorBanner } from '../../src/components/ErrorBanner';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { sendPasswordReset } from '../../src/services/authService';

export default function ForgotPasswordScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleReset = async () => {
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      await sendPasswordReset(email.trim());
      setSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to send reset email.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScreenHeader title="Reset Password" />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {sent ? (
            <View style={styles.sentContainer}>
              <View style={[styles.iconCircle, { backgroundColor: theme.colors.primaryLight }]}>
                <Ionicons name="mail-open" size={40} color={theme.colors.primary} />
              </View>
              <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
                Check your email
              </Text>
              <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
                We've sent a password reset link to {email}.
              </Text>
              <Button
                title="Back to sign in"
                onPress={() => router.replace('/(auth)/sign-in')}
                fullWidth
                style={{ marginTop: 16 }}
              />
            </View>
          ) : (
            <View style={styles.form}>
              <View style={styles.titleSection}>
                <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
                  Reset password
                </Text>
                <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
                  Enter your registered email and we'll send you a password reset link.
                </Text>
              </View>

              {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

              <Input
                label="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                textContentType="emailAddress"
                returnKeyType="done"
                onSubmitEditing={handleReset}
                placeholder="you@example.com"
                isRequired
              />

              <Button
                title="Send reset link"
                onPress={handleReset}
                loading={isLoading}
                disabled={isLoading}
                size="lg"
                fullWidth
                style={{ marginTop: 8 }}
              />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flexGrow: 1, padding: 20 },
  titleSection: { marginBottom: 20 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 6 },
  subtitle: { fontSize: 14, lineHeight: 20 },
  form: { gap: 16 },
  sentContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
});
