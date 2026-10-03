// OurMoney — Loans Tab Screen
// Household debt overview, active loan cards, payoff progress, action menu (Edit/Delete), and debt-free target calculator.

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  MoreVertical, Edit3, Trash2, Plus,
  Gem, User, Home, Car, GraduationCap, CreditCard, Users, Landmark, MoreHorizontal, type LucideIcon,
} from 'lucide-react-native';

const LOAN_ICON_MAP: Record<string, LucideIcon> = {
  Gem,
  User,
  Home,
  Car,
  GraduationCap,
  CreditCard,
  Users,
  Landmark,
  MoreHorizontal,
};
import { useTheme } from '../../src/context/ThemeContext';
import { useHousehold } from '../../src/context/HouseholdContext';
import { useLoans } from '../../src/hooks/useLoans';
import { deleteLoan } from '../../src/services/loanService';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { Card } from '../../src/components/Card';
import { Badge } from '../../src/components/Badge';
import { LoadingSpinner } from '../../src/components/LoadingSpinner';
import { EmptyState } from '../../src/components/EmptyState';
import { ConfirmDialog } from '../../src/components/ConfirmDialog';
import { DebtFreeTargetCalculator } from '../../src/components/DebtFreeTargetCalculator';
import { formatCurrency } from '../../src/utils/currency';
import { getLoanTypeById } from '../../src/constants/loanTypes';
import type { Loan } from '../../src/models/loan';

export default function LoansScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { householdId } = useHousehold();
  const { loans, isLoading, error: _error, refresh } = useLoans();

  const [activeMenuLoan, setActiveMenuLoan] = useState<Loan | null>(null);
  const [loanToDelete, setLoanToDelete] = useState<Loan | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const activeLoans = loans.filter((l) => l.isActive);
  const paidOffLoans = loans.filter((l) => !l.isActive);

  const totalOutstandingPaise = activeLoans.reduce((sum, l) => sum + (l.outstandingAmountPaise || 0), 0);
  const totalMonthlyCommitmentPaise = activeLoans.reduce(
    (sum, l) => sum + (l.plannedPaymentPaise || 0),
    0,
  );

  const handleEditLoan = (loan: Loan) => {
    setActiveMenuLoan(null);
    router.push(`/(modals)/add-loan?id=${loan.id}` as any);
  };

  const promptDeleteLoan = (loan: Loan) => {
    setActiveMenuLoan(null);
    setLoanToDelete(loan);
  };

  const confirmDeleteLoan = async () => {
    if (!loanToDelete || !householdId) return;
    try {
      setIsDeleting(true);
      console.log('[LOAN_DELETE_STARTED] Deleting loanId:', loanToDelete.id);
      await deleteLoan(householdId, loanToDelete.id);
      console.log('[LOAN_DELETE_SUCCESS] Loan deleted successfully.');
      setLoanToDelete(null);
      Alert.alert('Loan Deleted', 'Loan deleted successfully.');
    } catch (err: any) {
      console.log('[LOAN_DELETE_ERROR]', err?.message || err);
      Alert.alert('Unable to Delete', 'Unable to delete loan. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScreenHeader
        title="Household Loans & Debt"
        subtitle="Private tracking, repayment planning & payoff tools"
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
              <LoanCard
                key={loan.id}
                loan={loan}
                onTouch={() => router.push(`/(modals)/loan-detail?id=${loan.id}` as any)}
                onOpenMenu={() => setActiveMenuLoan(loan)}
              />
            ))
          )}

          {/* Paid-off Loans */}
          {paidOffLoans.length > 0 && (
            <View style={{ marginTop: 24 }}>
              <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary, marginBottom: 12 }]}>
                Paid Off ({paidOffLoans.length})
              </Text>
              {paidOffLoans.map((loan) => (
                <LoanCard
                  key={loan.id}
                  loan={loan}
                  onTouch={() => router.push(`/(modals)/loan-detail?id=${loan.id}` as any)}
                  onOpenMenu={() => setActiveMenuLoan(loan)}
                />
              ))}
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* Action Menu Popover Modal */}
      <Modal
        visible={Boolean(activeMenuLoan)}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveMenuLoan(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setActiveMenuLoan(null)}
        >
          <View
            style={[
              styles.menuCard,
              { backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.border },
            ]}
          >
            <Text style={[styles.menuLoanTitle, { color: theme.colors.textPrimary }]}>
              {activeMenuLoan?.lenderName}
            </Text>

            <TouchableOpacity
              style={styles.menuOption}
              onPress={() => activeMenuLoan && handleEditLoan(activeMenuLoan)}
            >
              <Edit3 size={18} color={theme.colors.primary} />
              <Text style={[styles.menuOptionText, { color: theme.colors.textPrimary }]}>
                Edit Loan
              </Text>
            </TouchableOpacity>

            <View style={[styles.menuDivider, { backgroundColor: theme.colors.borderLight }]} />

            <TouchableOpacity
              style={styles.menuOption}
              onPress={() => activeMenuLoan && promptDeleteLoan(activeMenuLoan)}
            >
              <Trash2 size={18} color={theme.colors.danger} />
              <Text style={[styles.menuOptionText, { color: theme.colors.danger }]}>
                Delete Loan
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        visible={Boolean(loanToDelete)}
        title="Delete this loan?"
        message="Are you sure you want to delete this loan? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        isDestructive
        onConfirm={confirmDeleteLoan}
        onCancel={() => setLoanToDelete(null)}
        loading={isDeleting}
      />

      {/* Floating Action Button (FAB) for Loans */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        onPress={() => router.push('/(modals)/add-loan')}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel="Add loan"
      >
        <Plus size={26} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

function LoanCard({
  loan,
  onTouch,
  onOpenMenu,
}: {
  loan: Loan;
  onTouch: () => void;
  onOpenMenu: () => void;
}) {
  const { theme, isDark } = useTheme();
  const loanTypeInfo = getLoanTypeById(loan.loanType);
  const LoanIcon = LOAN_ICON_MAP[loanTypeInfo.iconName] ?? Landmark;
  const isPaidOff = !loan.isActive;

  const initial = loan.originalAmountPaise || 1;
  const current = loan.outstandingAmountPaise || 0;
  const paidPercent = Math.max(0, Math.min(100, Math.round(((initial - current) / initial) * 100)));

  return (
    <Card style={styles.loanCard} onPress={onTouch}>
      <View style={styles.loanHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
          <View style={[styles.loanTypeIconContainer, { backgroundColor: isDark ? `${theme.colors.primary}26` : theme.colors.primaryLight }]}>
            <LoanIcon size={18} color={theme.colors.primary} />
          </View>
          <View style={styles.loanTitleGroup}>
            <Text style={[styles.loanName, { color: theme.colors.textPrimary }]}>{loan.lenderName}</Text>
            <Text style={[styles.loanLender, { color: theme.colors.textSecondary }]}>
              {loanTypeInfo.label} • {((loan.interestRateBps || 0) / 100).toFixed(2)}% p.a.
            </Text>
          </View>
        </View>

        <View style={styles.loanHeaderRight}>
          <Badge
            label={isPaidOff ? 'Paid Off' : loanTypeInfo.label}
            variant={isPaidOff ? 'success' : 'primary'}
            size="sm"
          />
          <TouchableOpacity
            style={styles.menuTrigger}
            onPress={(e) => {
              e.stopPropagation();
              onOpenMenu();
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MoreVertical size={18} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.loanBalanceRow}>
        <View>
          <Text style={[styles.loanLabel, { color: theme.colors.textTertiary }]}>Balance</Text>
          <Text style={[styles.loanBalance, { color: isPaidOff ? theme.colors.success : theme.colors.textPrimary }]}>
            {formatCurrency(loan.outstandingAmountPaise || 0)}
          </Text>
        </View>

        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[styles.loanLabel, { color: theme.colors.textTertiary }]}>Monthly EMI</Text>
          <Text style={[styles.loanEmi, { color: theme.colors.textSecondary }]}>
            {formatCurrency(loan.plannedPaymentPaise || 0)}
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
  loanHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  menuTrigger: {
    padding: 4,
    marginLeft: 4,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loanTypeIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuCard: {
    width: '85%',
    maxWidth: 320,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    elevation: 8,
  },
  menuLoanTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 14,
    textAlign: 'center',
  },
  menuOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    gap: 12,
  },
  menuOptionText: {
    fontSize: 15,
    fontWeight: '600',
  },
  menuDivider: {
    height: 1,
    marginVertical: 4,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 6,
    zIndex: 99,
  },
});
