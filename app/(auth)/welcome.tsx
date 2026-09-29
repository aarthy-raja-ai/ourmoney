import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/context/ThemeContext';
import { Button } from '../../src/components/Button';

export default function WelcomeScreen() {
  const { theme } = useTheme();
  const router = useRouter();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Logo / Brand */}
        <View style={styles.hero}>
          <View style={[styles.logoContainer, { backgroundColor: theme.colors.primary }]}>
            <Text style={styles.logoText}>OM</Text>
          </View>
          <Text style={[styles.appName, { color: theme.colors.textPrimary }]}>
            OurMoney
          </Text>
          <Text style={[styles.tagline, { color: theme.colors.textSecondary }]}>
            Your private shared household financial workspace
          </Text>
        </View>

        {/* Features */}
        <View style={styles.features}>
          {[
            { icon: 'stats-chart-outline', text: 'Track household expenses together' },
            { icon: 'wallet-outline', text: 'Category budgets & loan repayment' },
            { icon: 'shield-checkmark-outline', text: '100% private — zero bank credentials' },
          ].map((f) => (
            <View key={f.text} style={styles.featureRow}>
              <View style={[styles.featureIconContainer, { backgroundColor: theme.colors.primaryLight }]}>
                <Ionicons name={f.icon as any} size={20} color={theme.colors.primary} />
              </View>
              <Text style={[styles.featureText, { color: theme.colors.textPrimary }]}>
                {f.text}
              </Text>
            </View>
          ))}
        </View>

        {/* Auth Actions */}
        <View style={styles.actions}>
          <Button
            title="Get Started"
            onPress={() => router.push('/(auth)/sign-up')}
            size="lg"
            fullWidth
          />
          <Button
            title="Sign In"
            onPress={() => router.push('/(auth)/sign-in')}
            variant="outline"
            size="lg"
            fullWidth
          />
        </View>

        <Text style={[styles.privacy, { color: theme.colors.textTertiary }]}>
          Your financial data stays private between you and your household partner.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 32,
  },
  hero: { alignItems: 'center', marginBottom: 32 },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoText: { fontSize: 32, fontWeight: '800', color: '#FFFFFF' },
  appName: { fontSize: 28, fontWeight: '800', marginBottom: 6 },
  tagline: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  features: { gap: 16, marginBottom: 32 },
  featureRow: { flexDirection: 'row', alignItems: 'center' },
  featureIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  featureText: { fontSize: 14, fontWeight: '600', flex: 1 },
  actions: { gap: 12, marginBottom: 20 },
  privacy: { textAlign: 'center', fontSize: 11, lineHeight: 16 },
});
