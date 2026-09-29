import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/context/ThemeContext';
import { Button } from '../../src/components/Button';
import { Input } from '../../src/components/Input';
import { ErrorBanner } from '../../src/components/ErrorBanner';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { signIn } from '../../src/services/authService';

export default function SignInScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      await signIn(email.trim(), password);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign in failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScreenHeader title="Sign In" />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.titleSection}>
            <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
              Welcome back
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
              Sign in to your OurMoney household account
            </Text>
          </View>

          <View style={styles.form}>
            {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

            <Input
              label="Email Address"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
              returnKeyType="next"
              placeholder="you@example.com"
              isRequired
            />

            <Input
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="current-password"
              textContentType="password"
              returnKeyType="done"
              onSubmitEditing={handleSignIn}
              placeholder="••••••••"
              isRequired
            />

            <TouchableOpacity
              onPress={() => router.push('/(auth)/forgot-password')}
              style={{ alignSelf: 'flex-end', marginVertical: 4 }}
            >
              <Text style={[styles.forgotText, { color: theme.colors.primary }]}>
                Forgot password?
              </Text>
            </TouchableOpacity>

            <Button
              title="Sign In"
              onPress={handleSignIn}
              loading={isLoading}
              disabled={isLoading}
              size="lg"
              fullWidth
              style={{ marginTop: 8 }}
            />
          </View>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>
              Don't have an account?{' '}
            </Text>
            <TouchableOpacity onPress={() => router.replace('/(auth)/sign-up')}>
              <Text style={[styles.footerLink, { color: theme.colors.primary }]}>
                Create one
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flexGrow: 1, padding: 20 },
  titleSection: { marginBottom: 24, marginTop: 8 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 4 },
  subtitle: { fontSize: 14 },
  form: { gap: 14 },
  forgotText: { fontSize: 13, fontWeight: '600' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 32, marginBottom: 16 },
  footerText: { fontSize: 14 },
  footerLink: { fontSize: 14, fontWeight: '700' },
});
