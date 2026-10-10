// OurMoney — Loan Detail Modal
// Shows loan balance, payoff metrics, payment history log, and record payment triggers.

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform, StatusBar } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/context/ThemeContext';
import { useHousehold } from '../../src/context/HouseholdContext';
import { getLoanPayments, deleteLoan, updateLoan } from '../../src/services/loanService';
import { useLoans } from '../../src/hooks/useLoans';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { Badge } from '../../src/components/Badge';
import { ConfirmDialog } from '../../src/components/ConfirmDialog';
import { LoadingSpinner } from '../../src/components/LoadingSpinner';
import { LoanScenarioCard } from '../../src/components/LoanScenarioCard';
import { InterestComparisonCard } from '../../src/components/InterestComparisonCard';
import { formatCurrency } from '../../src/utils/currency';
import { formatDate, formatDateTime } from '../../src/utils/dateUtils';
import { calculateLoan, calculateExistingLoanState, resolveLoanInterestRate } from '../../src/utils/loanCalculations';
import { getLoanTypeById } from '../../src/constants/loanTypes';
import type { LoanPayment } from '../../src/models/loanPayment';
import type { InterestType } from '../../src/models/loan';

export default function LoanDetailModal() {
  const { theme } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topInset = Math.max(
    insets.top,
    Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) : 0,
  );
  const { id } = useLocalSearchParams<{ id: string }>();
  const { householdId } = useHousehold();
  const { loans } = useLoans();

  const loan = loans.find((l) => l.id === id);
  const [payments, setPayments] = useState<LoanPayment[]>([]);
  const [isLoadingPayments, setIsLoadingPayments] = useState(true);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!householdId || !id) return;
    setIsLoadingPayments(true);
    getLoanPayments(householdId, id)
      .then((data) => {
        setPayments(data);
        setIsLoadingPayments(false);
      })
      .catch(() => setIsLoadingPayments(false));
  }, [householdId, id]);

  const [activeInterestType, setActiveInterestType] = useState<InterestType>(
    loan?.interestType || 'reducing_balance',
  );

  useEffect(() => {
    if (loan?.interestType) {
      setActiveInterestType(loan.interestType);
    }
  }, [loan?.interestType]);

  // Single source of truth for display & calculation rate
  const resolvedRate = resolveLoanInterestRate({
    interestType: activeInterestType,
    interestRateBps: loan?.interestRateBps,
    principalPaise: loan?.originalAmountPaise,
    monthlyEmiPaise: loan?.plannedPaymentPaise,
    tenureMonths: loan?.tenureMonths ?? 36,
  });

  const effectiveRateBps = resolvedRate.isValid ? resolvedRate.rateBps : 0;

  // Auto-heal legacy loans stored with 0 bps
  useEffect(() => {
    if (householdId && loan?.id && loan.interestRateBps === 0 && resolvedRate.isValid && resolvedRate.rateBps > 0) {
      updateLoan(householdId, loan.id, {
        interestRateBps: resolvedRate.rateBps,
      }).catch((err) => console.log('[LOAN_AUTO_HEAL_RATE_ERROR]', err));
    }
  }, [householdId, loan?.id, loan?.interestRateBps, resolvedRate.isValid, resolvedRate.rateBps]);

  if (!loan) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <LoadingSpinner message="Loading loan details..." />
      </View>
    );
  }

  const loanTypeInfo = getLoanTypeById(loan.loanType);

  // Existing loan amortization state and inferred rate
  const existingLoanCalc = (loan.originalAmountPaise > 0 && (loan.tenureMonths ?? 0) > 0)
    ? calculateExistingLoanState({
        originalPrincipalPaise: loan.originalAmountPaise,
        annualRateBps: effectiveRateBps,
        totalTenureMonths: loan.tenureMonths ?? 36,
        completedInstallments: loan.completedInstallments ?? 0,
        monthlyEmiPaise: loan.plannedPaymentPaise,
        interestType: activeInterestType,
        lenderOutstandingPaise: loan.isLenderOutstandingConfirmed ? loan.outstandingAmountPaise : undefined,
        lenderRemainingRepaymentPaise: loan.isLenderRemainingRepaymentConfirmed ? loan.remainingRepaymentBalancePaise : undefined,
      })
    : null;

  // Payoff calculations using actual / inferred interest rate and loan parameters
  const payoffDetails = calculateLoan({
    outstandingAmountPaise: loan.outstandingAmountPaise,
    interestRateBps: effectiveRateBps,
    interestType: activeInterestType,
    repaymentMethod: loan.repaymentMethod,
    repaymentFrequency: loan.repaymentFrequency,
    plannedPaymentPaise: loan.plannedPaymentPaise,
  });

  const handleSelectInterestModel = async (type: InterestType, modelRateBps: number) => {
    setActiveInterestType(type);
    if (!householdId || !loan?.id) return;

    try {
      const updatedState = calculateExistingLoanState({
        originalPrincipalPaise: loan.originalAmountPaise,
        annualRateBps: modelRateBps,
        totalTenureMonths: loan.tenureMonths ?? 36,
        completedInstallments: loan.completedInstallments ?? 0,
        monthlyEmiPaise: loan.plannedPaymentPaise,
        interestType: type,
        lenderOutstandingPaise: loan.isLenderOutstandingConfirmed ? loan.outstandingAmountPaise : undefined,
        lenderRemainingRepaymentPaise: loan.isLenderRemainingRepaymentConfirmed ? loan.remainingRepaymentBalancePaise : undefined,
      });

      await updateLoan(householdId, loan.id, {
        interestType: type,
        interestRateBps: modelRateBps,
        outstandingAmountPaise: updatedState.finalOutstandingPrincipalPaise,
        remainingRepaymentBalancePaise: updatedState.finalRemainingRepaymentPaise,
        totalScheduledInterestPaise: updatedState.totalScheduledInterestPaise,
        totalScheduledRepaymentPaise: updatedState.totalScheduledRepaymentPaise,
      });
    } catch (err: any) {
      console.log('[LOAN_MODEL_SELECTION_ERROR]', err?.message || err);
    }
  };

  const handleDeleteLoan = async () => {
    if (!householdId || !id) return;
    try {
      setIsDeleting(true);
      console.log('[LOAN_DELETE_STARTED] Deleting loanId:', id);
      await deleteLoan(householdId, id);
      console.log('[LOAN_DELETE_SUCCESS] Loan deleted successfully.');
      setShowConfirmDelete(false);
      Alert.alert('Loan Deleted', 'Loan deleted successfully.');
      router.back();
    } catch (err: any) {
      console.log('[LOAN_DELETE_ERROR]', err?.message || err);
      Alert.alert('Unable to Delete', 'Unable to delete loan. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topInset + 6, borderBottomColor: theme.colors.borderLight }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>Loan Details</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => router.push(`/(modals)/add-loan?id=${loan.id}` as any)} style={styles.closeButton}>
            <Ionicons name="create-outline" size={22} color={theme.colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowConfirmDelete(true)} style={styles.closeButton}>
            <Ionicons name="trash-outline" size={22} color={theme.colors.danger} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Loan Balance Banner */}
        <Card style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <View>
              <Text style={[styles.loanName, { color: theme.colors.textPrimary }]}>{loan.lenderName}</Text>
              <Text style={[styles.lender, { color: theme.colors.textSecondary }]}>
                {loanTypeInfo.label}
              </Text>
            </View>
            <Badge label={loanTypeInfo.label} variant="primary" />
          </View>

          <Text style={[styles.balanceLabel, { color: theme.colors.textTertiary }]}>
            Outstanding Principal Balance
          </Text>
          <Text style={[styles.balanceAmount, { color: theme.colors.textPrimary }]}>
            {formatCurrency(loan.outstandingAmountPaise)}
          </Text>

          {loan.remainingRepaymentBalancePaise !== undefined && (
            <View style={{ marginBottom: 12 }}>
              <Text style={[styles.subLabel, { color: theme.colors.textTertiary }]}>Remaining Scheduled Total Repayment</Text>
              <Text style={[styles.subValue, { color: theme.colors.primary, fontSize: 16 }]}>
                {formatCurrency(loan.remainingRepaymentBalancePaise)}
              </Text>
            </View>
          )}

          <View style={styles.heroSubGrid}>
            <View>
              <Text style={[styles.subLabel, { color: theme.colors.textTertiary }]}>Interest Rate & Method</Text>
              <Text style={[styles.subValue, { color: theme.colors.textSecondary }]}>
                {resolvedRate.displayText}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={[styles.subLabel, { color: theme.colors.textTertiary }]}>Monthly EMI</Text>
              <Text style={[styles.subValue, { color: theme.colors.textSecondary }]}>
                {formatCurrency(loan.plannedPaymentPaise)}
              </Text>
            </View>
          </View>

          <View style={{ marginTop: 16 }}>
            <Button
              title="Record Loan Payment"
              variant="primary"
              size="md"
              onPress={() => router.push(`/(modals)/record-payment?id=${loan.id}` as any)}
            />
          </View>
        </Card>

        {/* Tenure & Installments Breakdown */}
        {loan.tenureMonths !== undefined && (
          <Card style={{ padding: 16, gap: 12, marginTop: 12 }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: theme.colors.textPrimary }}>
              Tenure & Installments
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View>
                <Text style={{ fontSize: 12, color: theme.colors.textSecondary }}>Original Tenure</Text>
                <Text style={{ fontSize: 15, fontWeight: '700', color: theme.colors.textPrimary }}>
                  {loan.tenureMonths} months
                </Text>
              </View>
              <View style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 12, color: theme.colors.textSecondary }}>Completed</Text>
                <Text style={{ fontSize: 15, fontWeight: '700', color: theme.colors.primary }}>
                  {loan.completedInstallments ?? 0} installments
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontSize: 12, color: theme.colors.textSecondary }}>Remaining Scheduled</Text>
                <Text style={{ fontSize: 15, fontWeight: '700', color: theme.colors.success }}>
                  {Math.max(0, loan.tenureMonths - (loan.completedInstallments ?? 0))} months
                </Text>
              </View>
            </View>
          </Card>
        )}

        {/* Loan Amortization & Historical Breakdown */}
        {existingLoanCalc && (
          <Card style={{ padding: 16, gap: 12, marginTop: 12 }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: theme.colors.textPrimary }}>
              Amortization & Payment Breakdown
            </Text>

            <View style={styles.heroSubGrid}>
              <View>
                <Text style={[styles.subLabel, { color: theme.colors.textTertiary }]}>Original Principal</Text>
                <Text style={[styles.subValue, { color: theme.colors.textPrimary, fontWeight: '600' }]}>
                  {formatCurrency(loan.originalAmountPaise)}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[styles.subLabel, { color: theme.colors.textTertiary }]}>Total Scheduled Repayment</Text>
                <Text style={[styles.subValue, { color: theme.colors.textPrimary, fontWeight: '600' }]}>
                  {formatCurrency(loan.totalScheduledRepaymentPaise ?? existingLoanCalc.totalScheduledRepaymentPaise)}
                </Text>
              </View>
            </View>

            <View style={[styles.heroSubGrid, { paddingTop: 6, borderTopWidth: 1, borderTopColor: 'rgba(120, 120, 120, 0.12)' }]}>
              <View>
                <Text style={[styles.subLabel, { color: theme.colors.textTertiary }]}>Historical Payments Made</Text>
                <Text style={[styles.subValue, { color: theme.colors.textSecondary }]}>
                  {formatCurrency(existingLoanCalc.historicalPaymentsPaidPaise)} ({loan.completedInstallments ?? 0} EMIs)
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[styles.subLabel, { color: theme.colors.textTertiary }]}>Remaining Scheduled Repayment</Text>
                <Text style={[styles.subValue, { color: theme.colors.primary, fontWeight: '600' }]}>
                  {formatCurrency(loan.remainingRepaymentBalancePaise ?? existingLoanCalc.finalRemainingRepaymentPaise)}
                </Text>
              </View>
            </View>

            <View style={[styles.heroSubGrid, { paddingTop: 6, borderTopWidth: 1, borderTopColor: 'rgba(120, 120, 120, 0.12)' }]}>
              <View>
                <Text style={[styles.subLabel, { color: theme.colors.textTertiary }]}>Historical Principal Repaid</Text>
                <Text style={[styles.subValue, { color: theme.colors.success }]}>
                  {formatCurrency(existingLoanCalc.historicalPrincipalPaidPaise)}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[styles.subLabel, { color: theme.colors.textTertiary }]}>Historical Interest Paid</Text>
                <Text style={[styles.subValue, { color: theme.colors.warning }]}>
                  {formatCurrency(existingLoanCalc.historicalInterestPaidPaise)}
                </Text>
              </View>
            </View>

            <View style={[styles.heroSubGrid, { paddingTop: 6, borderTopWidth: 1, borderTopColor: 'rgba(120, 120, 120, 0.12)' }]}>
              <View>
                <Text style={[styles.subLabel, { color: theme.colors.textTertiary }]}>Current Outstanding Principal</Text>
                <Text style={[styles.subValue, { color: theme.colors.textPrimary, fontWeight: '700' }]}>
                  {formatCurrency(loan.outstandingAmountPaise)}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[styles.subLabel, { color: theme.colors.textTertiary }]}>Remaining Interest Est.</Text>
                <Text style={[styles.subValue, { color: theme.colors.textSecondary }]}>
                  {formatCurrency(existingLoanCalc.remainingInterestEstimatePaise)}
                </Text>
              </View>
            </View>
          </Card>
        )}

        {/* Interest Model Comparison Card */}
        {loan.originalAmountPaise > 0 && loan.plannedPaymentPaise > 0 && (loan.tenureMonths ?? 36) > 0 && (
          <InterestComparisonCard
            principalPaise={loan.originalAmountPaise}
            monthlyEmiPaise={loan.plannedPaymentPaise}
            tenureMonths={loan.tenureMonths ?? 36}
            selectedInterestType={activeInterestType}
            onSelectInterestType={handleSelectInterestModel}
          />
        )}

        {/* Estimated Payoff Breakdown */}
        <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
          Estimated Payoff Calculation
        </Text>

        <LoanScenarioCard
          title="Current Repayment Pace"
          description={
            loan.tenureMonths && (payoffDetails.estimatedPayoffMonths === (loan.tenureMonths - (loan.completedInstallments ?? 0)))
              ? `Paying scheduled ${formatCurrency(loan.plannedPaymentPaise)} monthly aligns payoff with remaining ${payoffDetails.estimatedPayoffMonths} scheduled installments.`
              : `Paying ${formatCurrency(loan.plannedPaymentPaise)} monthly (estimated ${payoffDetails.estimatedPayoffMonths} months based on current balance and ${((effectiveRateBps)/100).toFixed(2)}% p.a. rate)`
          }
          monthlyPaymentPaise={loan.plannedPaymentPaise}
          payoffMonths={payoffDetails.estimatedPayoffMonths}
          totalInterestPaise={payoffDetails.estimatedTotalInterestPaise}
          totalPaymentPaise={payoffDetails.estimatedTotalPaymentPaise}
        />

        {/* Repayment History */}
        <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
          Repayment History ({payments.length})
        </Text>

        {isLoadingPayments ? (
          <LoadingSpinner message="Loading payment history..." />
        ) : payments.length === 0 ? (
          <Card style={{ padding: 16, alignItems: 'center' }}>
            <Text style={{ color: theme.colors.textSecondary }}>No payments recorded yet.</Text>
          </Card>
        ) : (
          payments.map((p) => (
            <Card key={p.id} style={styles.paymentCard}>
              <View style={styles.paymentHeader}>
                <View>
                  <Text style={[styles.paymentAmount, { color: theme.colors.success }]}>
                    {formatCurrency(p.amountPaise)}
                  </Text>
                  <Text style={[styles.paymentType, { color: theme.colors.textSecondary }]}>
                    {p.paymentType === 'emi' ? 'Regular EMI' : p.paymentType === 'principal' ? 'Principal' : 'Interest Only'}
                  </Text>
                </View>

                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[styles.paymentDate, { color: theme.colors.textTertiary }]}>
                    {p.createdAt ? formatDateTime(p.createdAt) : formatDate(p.date)}
                  </Text>
                  <Text style={[styles.recordedBy, { color: theme.colors.textSecondary }]}>
                    by {p.paidByUserName ?? 'User'}
                  </Text>
                </View>
              </View>
            </Card>
          ))
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        visible={showConfirmDelete}
        title="Delete Loan"
        message={`Delete "${loan.lenderName}" from your household loans?`}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDeleteLoan}
        onCancel={() => setShowConfirmDelete(false)}
        loading={isDeleting}
      />
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
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  closeButton: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700' },
  scroll: { flex: 1 },
  content: { padding: 16 },
  heroCard: { padding: 20, marginBottom: 20 },
  heroHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  loanName: { fontSize: 18, fontWeight: '800' },
  lender: { fontSize: 13 },
  balanceLabel: { fontSize: 12, marginBottom: 2 },
  balanceAmount: { fontSize: 32, fontWeight: '800', marginBottom: 14 },
  heroSubGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  subLabel: { fontSize: 11, marginBottom: 2 },
  subValue: { fontSize: 15, fontWeight: '700' },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginVertical: 12 },
  paymentCard: { padding: 14, marginBottom: 8 },
  paymentHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  paymentAmount: { fontSize: 16, fontWeight: '700' },
  paymentType: { fontSize: 12 },
  paymentDate: { fontSize: 11 },
  recordedBy: { fontSize: 11 },
});
