// OurMoney — Notification Preferences Screen

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch } from 'react-native';
import { useTheme } from '../../src/context/ThemeContext';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { Card } from '../../src/components/Card';

export default function NotificationsSettingsScreen() {
  const { theme } = useTheme();
  const [budgetAlerts, setBudgetAlerts] = useState(true);
  const [partnerExpenses, setPartnerExpenses] = useState(true);
  const [loanReminders, setLoanReminders] = useState(true);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScreenHeader title="Notifications" />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Card style={styles.card}>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Budget Threshold Alerts</Text>
              <Text style={[styles.sub, { color: theme.colors.textSecondary }]}>Get notified when category spending hits 70% or 100%</Text>
            </View>
            <Switch
              value={budgetAlerts}
              onValueChange={setBudgetAlerts}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
            />
          </View>

          <View style={[styles.divider, { backgroundColor: theme.colors.borderLight }]} />

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Partner Expense Activity</Text>
              <Text style={[styles.sub, { color: theme.colors.textSecondary }]}>Get notified when your partner logs an expense</Text>
            </View>
            <Switch
              value={partnerExpenses}
              onValueChange={setPartnerExpenses}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
            />
          </View>

          <View style={[styles.divider, { backgroundColor: theme.colors.borderLight }]} />

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: theme.colors.textPrimary }]}>Loan Payment Reminders</Text>
              <Text style={[styles.sub, { color: theme.colors.textSecondary }]}>Reminders for upcoming household loan EMIs</Text>
            </View>
            <Switch
              value={loanReminders}
              onValueChange={setLoanReminders}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
            />
          </View>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: 16 },
  card: { padding: 16 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  title: { fontSize: 15, fontWeight: '600' },
  sub: { fontSize: 12, marginTop: 2 },
  divider: { height: 1, marginVertical: 12 },
});
