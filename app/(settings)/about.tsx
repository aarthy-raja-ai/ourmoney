// OurMoney — About App Screen

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../../src/context/ThemeContext';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { Card } from '../../src/components/Card';
import { Badge } from '../../src/components/Badge';

export default function AboutScreen() {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScreenHeader title="About OurMoney" />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.logoContainer}>
          <Text style={[styles.appName, { color: theme.colors.primary }]}>OurMoney</Text>
          <Text style={[styles.version, { color: theme.colors.textSecondary }]}>Version 1.0.0 (Production)</Text>
          <Badge label="Private Household Edition" variant="primary" size="sm" style={{ marginTop: 6 }} />
        </View>

        <Card style={styles.card}>
          <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Mission</Text>
          <Text style={[styles.text, { color: theme.colors.textSecondary }]}>
            OurMoney empowers cohabitating partners to manage shared expenses, budgets, and loans with total clarity, trust, and complete financial privacy.
          </Text>
        </Card>

        <Card style={styles.card}>
          <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Legal Disclaimer</Text>
          <Text style={[styles.text, { color: theme.colors.textTertiary }]}>
            OurMoney is a personal planning tool. It does not connect to bank accounts, does not provide regulated financial advice, and does not process payments. All loan calculations are estimates.
          </Text>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: 16 },
  logoContainer: { alignItems: 'center', marginVertical: 20 },
  appName: { fontSize: 28, fontWeight: '800' },
  version: { fontSize: 13, marginTop: 4 },
  card: { padding: 16, marginBottom: 12 },
  title: { fontSize: 15, fontWeight: '700', marginBottom: 6 },
  text: { fontSize: 13, lineHeight: 18 },
});
