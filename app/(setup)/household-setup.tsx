// OurMoney — Household Setup (Onboarding Choice)
// STEP 1 of onboarding: user chooses between Solo or Shared (partner) mode.
// Solo → creates a solo household immediately and navigates to main app.
// With Partner → navigates to create-household or join-household.

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/context/ThemeContext';
import { ErrorBanner } from '../../src/components/ErrorBanner';
import { useAuth } from '../../src/context/AuthContext';
import { createSoloHousehold } from '../../src/services/householdService';

type Mode = 'solo' | 'partner' | null;

export default function HouseholdSetupScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { firebaseUser, refreshProfile } = useAuth();

  const [selectedMode, setSelectedMode] = useState<Mode>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- Solo flow ---
  const handleSoloContinue = async () => {
    if (!firebaseUser) return;
    setIsLoading(true);
    setError(null);
    try {
      await createSoloHousehold(firebaseUser.uid, firebaseUser.displayName ?? 'User');
      await refreshProfile();
      router.replace('/(tabs)');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // --- Partner flow sub-choice ---
  const handlePartnerContinue = () => {
    router.push('/(setup)/partner-setup');
  };

  const cardStyle = (mode: Mode) => [
    styles.optionCard,
    {
      backgroundColor: theme.colors.surface,
      borderColor: selectedMode === mode ? theme.colors.primary : theme.colors.border,
      borderWidth: selectedMode === mode ? 2 : 1,
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <View style={[styles.logoCircle, { backgroundColor: theme.colors.primaryLight }]}>
            <Ionicons name="wallet" size={44} color={theme.colors.primary} />
          </View>
          <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
            How would you like to{'\n'}use OurMoney?
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Manage your money your way.{'\n'}You can always change this later.
          </Text>
        </View>

        {/* Option: Solo */}
        <TouchableOpacity
          style={cardStyle('solo')}
          onPress={() => setSelectedMode('solo')}
          activeOpacity={0.8}
          accessibilityRole="radio"
          accessibilityState={{ selected: selectedMode === 'solo' }}
        >
          <View style={[styles.iconBubble, { backgroundColor: theme.colors.primaryLight }]}>
            <Ionicons name="person" size={28} color={theme.colors.primary} />
          </View>
          <View style={styles.cardText}>
            <Text style={[styles.cardTitle, { color: theme.colors.textPrimary }]}>
              Just me
            </Text>
            <Text style={[styles.cardDesc, { color: theme.colors.textSecondary }]}>
              Track your personal expenses, budgets, and loans — solo.
            </Text>
          </View>
          <View
            style={[
              styles.radioOuter,
              {
                borderColor:
                  selectedMode === 'solo' ? theme.colors.primary : theme.colors.border,
              },
            ]}
          >
            {selectedMode === 'solo' && (
              <View style={[styles.radioInner, { backgroundColor: theme.colors.primary }]} />
            )}
          </View>
        </TouchableOpacity>

        {/* Option: Partner */}
        <TouchableOpacity
          style={cardStyle('partner')}
          onPress={() => setSelectedMode('partner')}
          activeOpacity={0.8}
          accessibilityRole="radio"
          accessibilityState={{ selected: selectedMode === 'partner' }}
        >
          <View style={[styles.iconBubble, { backgroundColor: '#4F46E520' }]}>
            <Ionicons name="people" size={28} color="#6366F1" />
          </View>
          <View style={styles.cardText}>
            <Text style={[styles.cardTitle, { color: theme.colors.textPrimary }]}>
              Me &amp; my partner
            </Text>
            <Text style={[styles.cardDesc, { color: theme.colors.textSecondary }]}>
              Share a household with your partner. Track shared &amp; individual expenses together.
            </Text>
          </View>
          <View
            style={[
              styles.radioOuter,
              {
                borderColor:
                  selectedMode === 'partner' ? theme.colors.primary : theme.colors.border,
              },
            ]}
          >
            {selectedMode === 'partner' && (
              <View style={[styles.radioInner, { backgroundColor: theme.colors.primary }]} />
            )}
          </View>
        </TouchableOpacity>

        {/* Error */}
        {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}

        {/* CTA */}
        {selectedMode && (
          <TouchableOpacity
            style={[
              styles.ctaButton,
              {
                backgroundColor:
                  isLoading ? theme.colors.border : theme.colors.primary,
              },
            ]}
            onPress={selectedMode === 'solo' ? handleSoloContinue : handlePartnerContinue}
            disabled={isLoading}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Continue"
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.ctaText}>Continue</Text>
                <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
              </>
            )}
          </TouchableOpacity>
        )}

        <Text style={[styles.footer, { color: theme.colors.textTertiary }]}>
          You can invite a partner or switch modes later from Settings.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingTop: 48,
    gap: 16,
  },
  hero: {
    alignItems: 'center',
    marginBottom: 8,
  },
  logoCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 21,
  },
  optionCard: {
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconBubble: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 3,
  },
  cardDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 11,
    height: 11,
    borderRadius: 6,
  },
  ctaButton: {
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  footer: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 8,
    marginBottom: 24,
  },
});
