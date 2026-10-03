// OurMoney — Repayment Plan & Scenario Comparison Modal
// Allows comparing multiple payoff scenarios (Standard, +₹2,000/mo, +₹5,000/mo, lump sum).

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/context/ThemeContext';
import { useLoans } from '../../src/hooks/useLoans';
import { LoanScenarioCard } from '../../src/components/LoanScenarioCard';
import { calculatePayoffScenarios } from '../../src/utils/loanCalculations';

export default function RepaymentPlanModal() {
  const { theme } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { loans } = useLoans();

  const loan = loans.find((l) => l.id === id);

  if (!loan) return null;

  const scenarios = calculatePayoffScenarios(
    loan.outstandingAmountPaise,
    loan.interestRateBps,
    loan.plannedPaymentPaise,
    loan.repaymentMethod,
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.borderLight }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>Payoff Scenarios</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Compare payoff speed and total interest saved for <Text style={{ fontWeight: '700' }}>{loan.lenderName}</Text>.
        </Text>

        {scenarios.map((sc, index) => (
          <LoanScenarioCard
            key={index}
            title={sc.title}
            description={sc.description}
            monthlyPaymentPaise={sc.monthlyPaymentPaise}
            payoffMonths={sc.payoffMonths}
            totalInterestPaise={sc.totalInterestPaise}
            totalPaymentPaise={sc.totalPaymentPaise}
            interestSavedPaise={sc.interestSavedPaise}
            monthsSaved={sc.monthsSaved}
            isRecommended={index === 1}
          />
        ))}

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
  subtitle: { fontSize: 13, marginBottom: 16, lineHeight: 18 },
});
