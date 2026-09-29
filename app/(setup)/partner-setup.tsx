// OurMoney — Partner Setup Screen
// STEP 2 (partner path): user can either create a new shared household or join one with a code.
// Keeps the same dark-theme visual style as the rest of the setup flow.

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons'  ;
import { useTheme } from '../../src/context/ThemeContext';
import { ScreenHeader } from '../../src/components/ScreenHeader';

export default function PartnerSetupScreen() {
  const { theme } = useTheme();
  const router = useRouter();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScreenHeader title="Shared Household" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <View style={[styles.iconCircle, { backgroundColor: '#4F46E520' }]}>
            <Ionicons name="people" size={44} color="#6366F1" />
          </View>
          <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
            Set up your shared{'\n'}household
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Create a new workspace and invite your partner, or join one they already made.
          </Text>
        </View>

        {/* Card: Create */}
        <TouchableOpacity
          style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
          onPress={() => router.push('/(setup)/create-household')}
          activeOpacity={0.85}
          accessibilityRole="button"
        >
          <View style={[styles.cardIcon, { backgroundColor: theme.colors.primaryLight }]}>
            <Ionicons name="sparkles" size={26} color={theme.colors.primary} />
          </View>
          <View style={styles.cardBody}>
            <Text style={[styles.cardTitle, { color: theme.colors.textPrimary }]}>
              Create a household
            </Text>
            <Text style={[styles.cardDesc, { color: theme.colors.textSecondary }]}>
              Start fresh. You'll get a 6-character invite code to share with your partner.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.textTertiary} />
        </TouchableOpacity>

        {/* Card: Join */}
        <TouchableOpacity
          style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
          onPress={() => router.push('/(setup)/join-household')}
          activeOpacity={0.85}
          accessibilityRole="button"
        >
          <View style={[styles.cardIcon, { backgroundColor: theme.colors.successLight }]}>
            <Ionicons name="link" size={26} color={theme.colors.success} />
          </View>
          <View style={styles.cardBody}>
            <Text style={[styles.cardTitle, { color: theme.colors.textPrimary }]}>
              Join a household
            </Text>
            <Text style={[styles.cardDesc, { color: theme.colors.textSecondary }]}>
              Enter the invite code your partner shared with you to join their workspace.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.textTertiary} />
        </TouchableOpacity>

        <Text style={[styles.footer, { color: theme.colors.textTertiary }]}>
          Both of you need the OurMoney app. Data is synced in real-time.
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
    gap: 16,
  },
  hero: {
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 8,
  },
  iconCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 21,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  cardIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardBody: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 3,
  },
  cardDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  footer: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 8,
    marginBottom: 24,
  },
});
