// OurMoney — Interest Model Comparison Component
// Displays side-by-side comparison of Reducing Balance, Flat, and Simple Interest models.
// Clearly labels results as calculated estimates for comparison.

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { Card } from './Card';
import { Badge } from './Badge';
import { formatCurrency } from '../utils/currency';
import { compareAllInterestModels, type InterestModelComparisonItem } from '../utils/loanCalculations';
import type { InterestType } from '../models/loan';

export interface InterestComparisonCardProps {
  principalPaise: number;
  monthlyEmiPaise: number;
  tenureMonths: number;
  selectedInterestType?: InterestType;
  onSelectInterestType?: (type: InterestType, rateBps: number, ratePercent: number) => void;
}

export function InterestComparisonCard({
  principalPaise,
  monthlyEmiPaise,
  tenureMonths,
  selectedInterestType,
  onSelectInterestType,
}: InterestComparisonCardProps) {
  const { theme } = useTheme();

  if (principalPaise <= 0 || monthlyEmiPaise <= 0 || tenureMonths <= 0) {
    return null;
  }

  const comparison = compareAllInterestModels({
    principalPaise,
    monthlyEmiPaise,
    tenureMonths,
  });

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons name="git-compare-outline" size={18} color={theme.colors.primary} />
          <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
            Interest Model Comparison
          </Text>
        </View>
        <Badge label="Calculated Estimates" variant="info" size="sm" />
      </View>

      <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
        Compare how rates and repayment totals differ across interest models for the same principal, EMI, and tenure.
      </Text>

      <View style={styles.grid}>
        {comparison.map((item: InterestModelComparisonItem) => {
          const isSelected = selectedInterestType === item.interestType;
          return (
            <TouchableOpacity
              key={item.interestType}
              disabled={!onSelectInterestType || !item.isValid}
              onPress={() => onSelectInterestType?.(item.interestType, item.annualRateBps, item.annualRatePercent)}
              activeOpacity={0.8}
            >
              <Card
                style={[
                  styles.modelCard,
                  {
                    borderColor: isSelected
                      ? theme.colors.primary
                      : theme.colors.borderLight,
                    backgroundColor: isSelected
                      ? theme.colors.primaryLight
                      : theme.colors.surface,
                    borderWidth: isSelected ? 2 : 1,
                  },
                ]}
              >
                <View style={styles.cardTopRow}>
                  <Text
                    style={[
                      styles.modelLabel,
                      { color: isSelected ? theme.colors.primary : theme.colors.textPrimary },
                    ]}
                  >
                    {item.label}
                  </Text>
                  {isSelected && (
                    <View style={[styles.selectedBadge, { backgroundColor: theme.colors.primary }]}>
                      <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                      <Text style={styles.selectedBadgeText}>Selected</Text>
                    </View>
                  )}
                </View>

                {!item.isValid ? (
                  <Text style={[styles.errorText, { color: theme.colors.danger }]}>
                    {item.errorMessage || 'Invalid inputs for this interest model.'}
                  </Text>
                ) : (
                  <>
                    <View style={styles.rateRow}>
                      <Text style={[styles.rateValue, { color: theme.colors.primary }]}>
                        {item.annualRatePercent}%{' '}
                        <Text style={[styles.rateUnit, { color: theme.colors.textSecondary }]}>
                          p.a.
                        </Text>
                      </Text>
                      {item.effectiveAnnualRatePercent !== null && (
                        <Text style={[styles.earText, { color: theme.colors.textTertiary }]}>
                          EAR: {item.effectiveAnnualRatePercent}%
                        </Text>
                      )}
                    </View>

                    <View style={styles.metricsGrid}>
                      <View style={styles.metricCol}>
                        <Text style={[styles.metricLabel, { color: theme.colors.textTertiary }]}>
                          Total Interest
                        </Text>
                        <Text style={[styles.metricValue, { color: theme.colors.textPrimary }]}>
                          {formatCurrency(item.totalInterestPaise)}
                        </Text>
                      </View>

                      <View style={styles.metricCol}>
                        <Text style={[styles.metricLabel, { color: theme.colors.textTertiary }]}>
                          Total Repayment
                        </Text>
                        <Text style={[styles.metricValue, { color: theme.colors.textPrimary }]}>
                          {formatCurrency(item.totalRepaymentPaise)}
                        </Text>
                      </View>
                    </View>

                    <Text style={[styles.methodDesc, { color: theme.colors.textSecondary }]}>
                      💡 {item.calculationMethod}
                    </Text>
                  </>
                )}
              </Card>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={[styles.footerDisclaimer, { color: theme.colors.textTertiary }]}>
        Note: These are mathematical estimates for planning and comparison. Official lender interest schedules may vary.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginVertical: 12, gap: 10 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 16, fontWeight: '700' },
  subtitle: { fontSize: 13, lineHeight: 18 },
  grid: { gap: 10, marginTop: 4 },
  modelCard: { padding: 14, borderRadius: 14, gap: 8 },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modelLabel: { fontSize: 15, fontWeight: '700' },
  selectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  selectedBadgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  rateRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  rateValue: { fontSize: 20, fontWeight: '800' },
  rateUnit: { fontSize: 13, fontWeight: '500' },
  earText: { fontSize: 12, fontWeight: '500' },
  metricsGrid: { flexDirection: 'row', gap: 16, paddingTop: 4 },
  metricCol: { flex: 1, gap: 2 },
  metricLabel: { fontSize: 11, fontWeight: '500' },
  metricValue: { fontSize: 14, fontWeight: '700' },
  methodDesc: { fontSize: 12, marginTop: 2, fontStyle: 'italic' },
  errorText: { fontSize: 13, fontWeight: '500' },
  footerDisclaimer: { fontSize: 11, fontStyle: 'italic', marginTop: 4 },
});
