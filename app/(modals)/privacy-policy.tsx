// OurMoney — Privacy Architecture & Security Statement
// Full breakdown of OurMoney privacy design principles and client/server isolation guarantees.

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/context/ThemeContext';
import { Card } from '../../src/components/Card';
import { Badge } from '../../src/components/Badge';

export default function PrivacyPolicyModal() {
  const { theme } = useTheme();
  const router = useRouter();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.borderLight }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>
          Privacy Architecture
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={[styles.banner, { backgroundColor: theme.colors.successLight }]}>
          <Ionicons name="shield-checkmark" size={28} color={theme.colors.success} />
          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text style={[styles.bannerTitle, { color: theme.colors.success }]}>
              Privacy-First Household Design
            </Text>
            <Text style={[styles.bannerText, { color: theme.colors.textSecondary }]}>
              OurMoney is built exclusively for household co-management with zero bank connectivity.
            </Text>
          </View>
        </View>

        {/* Core Pillars */}
        <Card style={styles.card}>
          <View style={styles.pillarRow}>
            <Ionicons name="ban-outline" size={20} color={theme.colors.danger} />
            <Text style={[styles.pillarTitle, { color: theme.colors.textPrimary }]}>
              1. NO Bank Connections or Credentials
            </Text>
          </View>
          <Text style={[styles.pillarText, { color: theme.colors.textSecondary }]}>
            OurMoney NEVER requests, stores, or transmits bank account numbers, UPI PINs, passwords,
            or credit card numbers. All expense and loan amounts are user-entered.
          </Text>
        </Card>

        <Card style={styles.card}>
          <View style={styles.pillarRow}>
            <Ionicons name="lock-closed-outline" size={20} color={theme.colors.primary} />
            <Text style={[styles.pillarTitle, { color: theme.colors.textPrimary }]}>
              2. Strict Household Data Isolation
            </Text>
          </View>
          <Text style={[styles.pillarText, { color: theme.colors.textSecondary }]}>
            Your financial data is only accessible to authenticated partners in your unique household
            workspace. Firestore Security Rules enforce strict access controls on the server.
          </Text>
        </Card>

        <Card style={styles.card}>
          <View style={styles.pillarRow}>
            <Ionicons name="options-outline" size={20} color={theme.colors.warning} />
            <Text style={[styles.pillarTitle, { color: theme.colors.textPrimary }]}>
              3. Deterministic Planning (No Regulated Advice)
            </Text>
          </View>
          <Text style={[styles.pillarText, { color: theme.colors.textSecondary }]}>
            All loan payoff numbers and budget insights are deterministic mathematical estimations based on
            your user inputs. OurMoney does NOT offer regulated financial advice.
          </Text>
        </Card>

        <Card style={styles.card}>
          <View style={styles.pillarRow}>
            <Ionicons name="eye-off-outline" size={20} color={theme.colors.success} />
            <Text style={[styles.pillarTitle, { color: theme.colors.textPrimary }]}>
              4. Complete Data Sovereignty & Deletion
            </Text>
          </View>
          <Text style={[styles.pillarText, { color: theme.colors.textSecondary }]}>
            You have full ownership of your data. You can export or permanently delete your account
            and household data at any time from Settings.
          </Text>
        </Card>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 56,
    borderBottomWidth: 1,
  },
  closeButton: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700' },
  scroll: { flex: 1 },
  content: { padding: 16 },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  bannerTitle: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  bannerText: { fontSize: 12, lineHeight: 16 },
  card: { padding: 16, marginBottom: 12 },
  pillarRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  pillarTitle: { fontSize: 15, fontWeight: '700', marginLeft: 8 },
  pillarText: { fontSize: 13, lineHeight: 18 },
});
