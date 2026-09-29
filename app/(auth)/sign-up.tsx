import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
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
import { signUp } from '../../src/services/authService';
import { ChevronLeft } from 'lucide-react-native';

export default function SignUpScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignUp = async () => {
    setError(null);
    if (!displayName.trim()) { setError('Please enter your name.'); return; }
    if (!email.trim()) { setError('Please enter your email address.'); return; }
    if (!password) { setError('Please choose a password.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }

    setIsLoading(true);
    try {
      await signUp(email.trim(), password, displayName.trim());
      // Navigation handled by root layout guard
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={[styles.backBtn, { backgroundColor: theme.colors.surfaceOverlay, borderRadius: theme.radii.full }]}
              accessibilityRole="button" accessibilityLabel="Go back"
            >
              <ChevronLeft size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.titleSection}>
            <Text style={[styles.title, { color: theme.colors.textPrimary, fontSize: theme.fontSize['2xl'], fontWeight: theme.fontWeight.bold }]}>
              Create your account
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary, fontSize: theme.fontSize.base }]}>
              You'll connect with your partner in the next step
            </Text>
          </View>

          <View style={styles.form}>
            {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}
            <Input label="Your name" value={displayName} onChangeText={setDisplayName} autoCapitalize="words" textContentType="name" returnKeyType="next" placeholder="How should we call you?" isRequired />
            <Input label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" textContentType="emailAddress" returnKeyType="next" placeholder="you@example.com" isRequired />
            <Input label="Password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="new-password" textContentType="newPassword" returnKeyType="next" placeholder="At least 6 characters" isRequired hint="Minimum 6 characters" />
            <Input label="Confirm password" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry textContentType="newPassword" returnKeyType="done" onSubmitEditing={handleSignUp} placeholder="Re-enter your password" isRequired />
            <Button title="Create account" onPress={handleSignUp} isLoading={isLoading} disabled={isLoading} size="lg" fullWidth style={{ marginTop: 8 }} />
          </View>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: theme.colors.textSecondary, fontSize: theme.fontSize.base }]}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.replace('/(auth)/sign-in')} accessibilityRole="link">
              <Text style={[styles.footerLink, { color: theme.colors.primary, fontSize: theme.fontSize.base, fontWeight: theme.fontWeight.semibold }]}>Sign in</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 }, scroll: { flexGrow: 1, padding: 24, gap: 24 },
  header: { flexDirection: 'row' },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  titleSection: { gap: 8 }, title: {}, subtitle: {},
  form: { gap: 16 },
  footer: { flexDirection: 'row', justifyContent: 'center', paddingBottom: 16 },
  footerText: {}, footerLink: {},
});
