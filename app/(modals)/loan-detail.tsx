// OurMoney — Loan Detail Modal
// Shows loan balance, payoff metrics, payment history log, and record payment triggers.

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform, StatusBar } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/context/ThemeContext';
import { useHousehold } from '../../src/context/HouseholdContext';
import { getLoanPayments, deleteLoan } from '../../src/services/loanService';
import { useLoans } from '../../src/hooks/useLoans';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { Badge } from '../../src/components/Badge';
import { ConfirmDialog } from '../../src/components/ConfirmDialog';
import { LoadingSpinner } from '../../src/components/LoadingSpinner';
import { LoanScenarioCard } from '../../src/components/LoanScenarioCard';
import { formatCurrency } from '../../src/utils/currency';
import { formatDate } from '../../src/utils/dateUtils';
import { calculateLoanPayoffDetails } from '../../src/utils/loanCalculations';
import { getLoanTypeById } from '../../src/constants/loanTypes';
import type { LoanPayment } from '../../src/models/loanPayment';

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

  if (!loan) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <LoadingSpinner message="Loading loan details..." />
      </View>
    );
  }

  const loanTypeInfo = getLoanTypeById(loan.loanType);

  // Payoff calculations
  const payoffDetails = calculateLoanPayoffDetails(
    loan.outstandingAmountPaise,
    loan.interestRateBps,
    loan.plannedPaymentPaise,
    loan.repaymentMethod,
  );

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
            Outstanding Balance
          </Text>
          <Text style={[styles.balanceAmount, { color: theme.colors.textPrimary }]}>
            {formatCurrency(loan.outstandingAmountPaise)}
          </Text>

          <View style={styles.heroSubGrid}>
            <View>
              <Text style={[styles.subLabel, { color: theme.colors.textTertiary }]}>Interest Rate</Text>
              <Text style={[styles.subValue, { color: theme.colors.textSecondary }]}>
                {(loan.interestRateBps / 100).toFixed(2)}% p.a.
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

        {/* Estimated Payoff Breakdown */}
        <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
          Estimated Payoff Calculation
        </Text>

        <LoanScenarioCard
          title="Current Repayment Pace"
          description={`Paying ${formatCurrency(loan.plannedPaymentPaise)} monthly`}
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
                    {formatDate(p.date)}
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
