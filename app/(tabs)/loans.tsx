// OurMoney — Loans Tab Screen
// Household debt overview, active loan cards, payoff progress, and debt-free target calculator.

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/context/ThemeContext';
import { useLoans } from '../../src/hooks/useLoans';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { Card } from '../../src/components/Card';
import { Badge } from '../../src/components/Badge';
import { Button } from '../../src/components/Button';
import { LoadingSpinner } from '../../src/components/LoadingSpinner';
import { EmptyState } from '../../src/components/EmptyState';
import { DebtFreeTargetCalculator } from '../../src/components/DebtFreeTargetCalculator';
import { formatCurrency } from '../../src/utils/currency';
import { getLoanTypeById } from '../../src/constants/loanTypes';
import type { Loan } from '../../src/models/loan';

export default function LoansScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { loans, isLoading, error, refresh } = useLoans();

  const activeLoans = loans.filter((l) => l.status === 'active');
  const paidOffLoans = loans.filter((l) => l.status === 'paid_off');

  const totalOutstandingPaise = activeLoans.reduce((sum, l) => sum + l.currentBalancePaise, 0);
  const totalMonthlyCommitmentPaise = activeLoans.reduce(
    (sum, l) => sum + (l.minimumPaymentPaise ?? l.monthlyPaymentPaise ?? 0),
    0,
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScreenHeader
        title="Household Loans & Debt"
        subtitle="Private tracking, repayment planning & payoff tools"
        rightAction={
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => router.push('/(modals)/add-loan')}
          >
            <Ionicons name="add" size={24} color="#FFF" />
          </TouchableOpacity>
        }
      />

      {isLoading && loans.length === 0 ? (
        <LoadingSpinner message="Loading loan workspace..." />
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={refresh}
              colors={[theme.colors.primary]}
            />
          }
        >
          {/* Top Summary Banner */}
          <Card style={[styles.summaryCard, { backgroundColor: theme.colors.surfaceElevated }]}>
            <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>
              Total Household Outstanding Debt
            </Text>
            <Text style={[styles.summaryAmount, { color: theme.colors.textPrimary }]}>
              {formatCurrency(totalOutstandingPaise)}
            </Text>

            <View style={styles.summarySubRow}>
              <View>
                <Text style={[styles.subLabel, { color: theme.colors.textTertiary }]}>
                  Monthly Commitment
                </Text>
                <Text style={[styles.subValue, { color: theme.colors.textSecondary }]}>
                  {formatCurrency(totalMonthlyCommitmentPaise)}/mo
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[styles.subLabel, { color: theme.colors.textTertiary }]}>
                  Active Loans
                </Text>
                <Text style={[styles.subValue, { color: theme.colors.textSecondary }]}>
                  {activeLoans.length} active
                </Text>
              </View>
            </View>
          </Card>

          {/* Interactive Debt-Free Target Planner */}
          {activeLoans.length > 0 && <DebtFreeTargetCalculator loans={activeLoans} />}

          {/* Active Loans Section */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
              Active Loans ({activeLoans.length})
            </Text>
          </View>

          {activeLoans.length === 0 ? (
            <EmptyState
              icon="checkmark-circle-outline"
              title="No active household loans"
              message="Add a loan or debt to track repayments and plan debt freedom together."
              actionLabel="Add Loan / Debt"
              onAction={() => router.push('/(modals)/add-loan')}
            />
          ) : (
            activeLoans.map((loan) => (
              <LoanCard key={loan.id} loan={loan} onTouch={() => router.push(`/(modals)/loan-detail?id=${loan.id}` as any)} />
            ))
          )}

          {/* Paid-off Loans */}
          {paidOffLoans.length > 0 && (
            <View style={{ marginTop: 24 }}>
              <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary, marginBottom: 12 }]}>
                Paid Off ({paidOffLoans.length})
              </Text>
              {paidOffLoans.map((loan) => (
                <LoanCard key={loan.id} loan={loan} onTouch={() => router.push(`/(modals)/loan-detail?id=${loan.id}` as any)} />
              ))}
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </View>
  );
}

function LoanCard({ loan, onTouch }: { loan: Loan; onTouch: () => void }) {
  const { theme } = useTheme();
  const loanTypeInfo = getLoanTypeById(loan.type);
  const isPaidOff = loan.status === 'paid_off';

  const initial = loan.initialBalancePaise || 1;
  const current = loan.currentBalancePaise;
  const paidPercent = Math.max(0, Math.min(100, Math.round(((initial - current) / initial) * 100)));

  return (
    <Card style={styles.loanCard} onPress={onTouch}>
      <View style={styles.loanHeader}>
        <View style={styles.loanTitleGroup}>
          <Text style={[styles.loanName, { color: theme.colors.textPrimary }]}>{loan.name}</Text>
          <Text style={[styles.loanLender, { color: theme.colors.textSecondary }]}>
            {loan.lenderName || loanTypeInfo.label} • {(loan.annualInterestRateBps / 100).toFixed(2)}% p.a.
          </Text>
        </View>

        <Badge
          label={isPaidOff ? 'Paid Off' : loanTypeInfo.label}
          variant={isPaidOff ? 'success' : 'primary'}
          size="sm"
        />
      </View>

      <View style={styles.loanBalanceRow}>
        <View>
          <Text style={[styles.loanLabel, { color: theme.colors.textTertiary }]}>Balance</Text>
          <Text style={[styles.loanBalance, { color: isPaidOff ? theme.colors.success : theme.colors.textPrimary }]}>
            {formatCurrency(loan.currentBalancePaise)}
          </Text>
        </View>

        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[styles.loanLabel, { color: theme.colors.textTertiary }]}>Monthly EMI</Text>
          <Text style={[styles.loanEmi, { color: theme.colors.textSecondary }]}>
            {formatCurrency(loan.minimumPaymentPaise ?? loan.monthlyPaymentPaise ?? 0)}
          </Text>
        </View>
      </View>

      {/* Progress Bar */}
      {!isPaidOff && (
        <View style={styles.progressContainer}>
          <View style={[styles.progressTrack, { backgroundColor: theme.colors.borderLight }]}>
            <View
              style={[
                styles.progressBar,
                { width: `${paidPercent}%`, backgroundColor: theme.colors.primary },
              ]}
            />
          </View>
          <Text style={[styles.progressText, { color: theme.colors.textTertiary }]}>
            {paidPercent}% paid off
          </Text>
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  summaryCard: {
    padding: 20,
    marginBottom: 16,
  },
  summaryLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  summaryAmount: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 16,
  },
  summarySubRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  subLabel: {
    fontSize: 11,
    marginBottom: 2,
  },
  subValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  loanCard: {
    padding: 16,
    marginBottom: 12,
  },
  loanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  loanTitleGroup: {
    flex: 1,
    paddingRight: 8,
  },
  loanName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  loanLender: {
    fontSize: 12,
  },
  loanBalanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  loanLabel: {
    fontSize: 11,
    marginBottom: 2,
  },
  loanBalance: {
    fontSize: 20,
    fontWeight: '800',
  },
  loanEmi: {
    fontSize: 16,
    fontWeight: '700',
  },
  progressContainer: {
    marginTop: 4,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 11,
    textAlign: 'right',
  },
});
