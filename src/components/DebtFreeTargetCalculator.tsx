// OurMoney — DebtFreeTargetCalculator Component
// Interactive component to simulate extra monthly debt repayments across all household loans.

import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { Card } from './Card';
import { Button } from './Button';
import { formatCurrency, rupeesToPaise } from '../utils/currency';
import { calculateDebtFreeTarget } from '../utils/loanCalculations';
import type { Loan } from '../models/loan';

interface DebtFreeTargetCalculatorProps {
  loans: Loan[];
}

export const DebtFreeTargetCalculator: React.FC<DebtFreeTargetCalculatorProps> = ({ loans }) => {
  const { theme } = useTheme();
  const [extraMonthlyRupees, setExtraMonthlyRupees] = useState<string>('2000');
  const [strategy, setStrategy] = useState<'avalanche' | 'snowball'>('avalanche');

  const extraPaise = useMemo(() => {
    const val = parseFloat(extraMonthlyRupees);
    return isNaN(val) || val < 0 ? 0 : rupeesToPaise(val);
  }, [extraMonthlyRupees]);

  const activeLoans = useMemo(() => loans.filter((l) => l.isActive), [loans]);

  const baseResult = useMemo(
    () => calculateDebtFreeTarget(activeLoans, 0, strategy),
    [activeLoans, strategy],
  );

  const acceleratedResult = useMemo(
    () => calculateDebtFreeTarget(activeLoans, extraPaise, strategy),
    [activeLoans, extraPaise, strategy],
  );

  if (activeLoans.length === 0) {
    return null;
  }

  const interestSaved =
    baseResult.estimatedTotalInterestPaise !== null &&
    acceleratedResult.estimatedTotalInterestPaise !== null
      ? baseResult.estimatedTotalInterestPaise - acceleratedResult.estimatedTotalInterestPaise
      : 0;

  const monthsSaved =
    baseResult.estimatedMonthsToDebtFree !== null &&
    acceleratedResult.estimatedMonthsToDebtFree !== null
      ? baseResult.estimatedMonthsToDebtFree - acceleratedResult.estimatedMonthsToDebtFree
      : 0;

  return (
    <Card style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="sparkles" size={24} color={theme.colors.primary} />
        <View style={{ marginLeft: 10, flex: 1 }}>
          <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
            Debt-Free Target Planner
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Simulate paying off household loans faster
          </Text>
        </View>
      </View>

      <View style={[styles.inputRow, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.inputLabel, { color: theme.colors.textPrimary }]}>
          Extra monthly repayment:
        </Text>
        <View style={styles.currencyInputContainer}>
          <Text style={[styles.currencyPrefix, { color: theme.colors.textSecondary }]}>₹</Text>
          <TextInput
            style={[styles.input, { color: theme.colors.textPrimary }]}
            value={extraMonthlyRupees}
            onChangeText={setExtraMonthlyRupees}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor={theme.colors.textTertiary}
          />
        </View>
      </View>

      <View style={styles.strategyRow}>
        <Button
          title="Highest Rate First (Avalanche)"
          variant={strategy === 'avalanche' ? 'primary' : 'outline'}
          size="sm"
          onPress={() => setStrategy('avalanche')}
          style={{ flex: 1, marginRight: 6 }}
        />
        <Button
          title="Smallest Balance (Snowball)"
          variant={strategy === 'snowball' ? 'primary' : 'outline'}
          size="sm"
          onPress={() => setStrategy('snowball')}
          style={{ flex: 1, marginLeft: 6 }}
        />
      </View>

      <View style={[styles.resultsGrid, { backgroundColor: theme.colors.surfaceElevated }]}>
        <View style={styles.statBox}>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Standard Payoff</Text>
          <Text style={[styles.statValue, { color: theme.colors.textPrimary }]}>
            {baseResult.estimatedMonthsToDebtFree !== null
              ? `${baseResult.estimatedMonthsToDebtFree} mos`
              : '—'}
          </Text>
        </View>

        <View style={[styles.statBox, { borderLeftWidth: 1, borderLeftColor: theme.colors.border }]}>
          <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Accelerated</Text>
          <Text style={[styles.statValue, { color: theme.colors.primary }]}>
            {acceleratedResult.estimatedMonthsToDebtFree !== null
              ? `${acceleratedResult.estimatedMonthsToDebtFree} mos`
              : '—'}
          </Text>
        </View>
      </View>

      {monthsSaved > 0 && (
        <View style={[styles.highlightBox, { backgroundColor: theme.colors.successLight }]}>
          <Ionicons name="trophy-outline" size={20} color={theme.colors.success} />
          <Text style={[styles.highlightText, { color: theme.colors.success }]}>
            You will become debt-free {monthsSaved} months earlier and save{' '}
            {formatCurrency(interestSaved)} in interest!
          </Text>
        </View>
      )}

      <Text style={[styles.disclaimer, { color: theme.colors.textTertiary }]}>
        * Estimates assuming consistent extra monthly payments and fixed interest rates. Check lender terms.
      </Text>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    marginVertical: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  currencyInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencyPrefix: {
    fontSize: 16,
    fontWeight: '700',
    marginRight: 4,
  },
  input: {
    fontSize: 16,
    fontWeight: '700',
    minWidth: 70,
    textAlign: 'right',
  },
  strategyRow: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  resultsGrid: {
    flexDirection: 'row',
    borderRadius: 12,
    paddingVertical: 12,
    marginBottom: 12,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  highlightBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  highlightText: {
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 8,
    flex: 1,
  },
  disclaimer: {
    fontSize: 10,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});
