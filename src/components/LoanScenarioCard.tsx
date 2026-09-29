// OurMoney — LoanScenarioCard Component
// Visual card displaying a loan repayment scenario (e.g., standard EMI vs extra monthly payment).

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { formatCurrency } from '../utils/currency';
import { Card } from './Card';
import { Badge } from './Badge';

interface LoanScenarioCardProps {
  title: string;
  description: string;
  monthlyPaymentPaise: number;
  payoffMonths: number | null;
  totalInterestPaise: number | null;
  totalPaymentPaise: number | null;
  interestSavedPaise?: number;
  monthsSaved?: number;
  isRecommended?: boolean;
  onSelect?: () => void;
  selected?: boolean;
}

export const LoanScenarioCard: React.FC<LoanScenarioCardProps> = ({
  title,
  description,
  monthlyPaymentPaise,
  payoffMonths,
  totalInterestPaise,
  totalPaymentPaise,
  interestSavedPaise,
  monthsSaved,
  isRecommended = false,
  onSelect,
  selected = false,
}) => {
  const { theme } = useTheme();

  return (
    <Card
      style={[
        styles.card,
        isRecommended && { borderColor: theme.colors.primary, borderWidth: 2 },
        selected && { backgroundColor: theme.colors.primaryLight },
      ]}
      onPress={onSelect}
    >
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: theme.colors.textPrimary }]}>{title}</Text>
            {isRecommended && (
              <Badge label="Recommended" variant="success" size="sm" style={{ marginLeft: 8 }} />
            )}
          </View>
          <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
            {description}
          </Text>
        </View>

        {onSelect && (
          <Ionicons
            name={selected ? 'checkmark-circle' : 'ellipse-outline'}
            size={24}
            color={selected ? theme.colors.primary : theme.colors.textTertiary}
          />
        )}
      </View>

      <View style={[styles.divider, { backgroundColor: theme.colors.borderLight }]} />

      <View style={styles.grid}>
        <View style={styles.gridItem}>
          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Monthly</Text>
          <Text style={[styles.value, { color: theme.colors.textPrimary }]}>
            {formatCurrency(monthlyPaymentPaise)}
          </Text>
        </View>

        <View style={styles.gridItem}>
          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Payoff Time</Text>
          <Text style={[styles.value, { color: theme.colors.textPrimary }]}>
            {payoffMonths !== null ? `${payoffMonths} mos` : '—'}
          </Text>
        </View>

        <View style={styles.gridItem}>
          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Total Interest</Text>
          <Text style={[styles.value, { color: theme.colors.textPrimary }]}>
            {totalInterestPaise !== null ? formatCurrency(totalInterestPaise) : '—'}
          </Text>
        </View>
      </View>

      {((interestSavedPaise && interestSavedPaise > 0) || (monthsSaved && monthsSaved > 0)) && (
        <View style={[styles.savingsBanner, { backgroundColor: theme.colors.successLight }]}>
          <Ionicons name="sparkles" size={16} color={theme.colors.success} />
          <Text style={[styles.savingsText, { color: theme.colors.success }]}>
            Saves{' '}
            {interestSavedPaise ? formatCurrency(interestSavedPaise) : ''}
            {interestSavedPaise && monthsSaved ? ' & ' : ''}
            {monthsSaved ? `${monthsSaved} months` : ''}!
          </Text>
        </View>
      )}

      <Text style={[styles.disclaimer, { color: theme.colors.textTertiary }]}>
        * Estimated for planning purposes.
      </Text>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  description: {
    fontSize: 13,
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  grid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gridItem: {
    flex: 1,
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 2,
  },
  value: {
    fontSize: 14,
    fontWeight: '700',
  },
  savingsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 12,
  },
  savingsText: {
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6,
  },
  disclaimer: {
    fontSize: 10,
    marginTop: 8,
    fontStyle: 'italic',
  },
});
