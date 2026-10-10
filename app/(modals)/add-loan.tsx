// OurMoney — Add / Edit Loan Modal
// Allows adding or editing a household loan (e.g. Gold Loan, Personal Loan, Home Loan, EMI).
// PRIVACY RESTRICTION: Zero account numbers, bank credentials, or sensitive IDs.

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  StatusBar,
  Switch,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../src/context/AuthContext';
import { useHousehold } from '../../src/context/HouseholdContext';
import { addLoan, updateLoan, registerHistoricalLoanPayments } from '../../src/services/loanService';
import { useLoans } from '../../src/hooks/useLoans';
import { Input } from '../../src/components/Input';
import { Button } from '../../src/components/Button';
import { Card } from '../../src/components/Card';
import { Badge } from '../../src/components/Badge';
import { LOAN_TYPES } from '../../src/constants/loanTypes';
import { rupeesToPaise, paiseToRupees, formatCurrency } from '../../src/utils/currency';
import { calculateLoan, calculateExistingLoanState, resolveLoanInterestRate } from '../../src/utils/loanCalculations';
import { ReverseInterestModal } from '../../src/components/ReverseInterestModal';
import { InterestComparisonCard } from '../../src/components/InterestComparisonCard';
import type { LoanType, InterestType, RepaymentMethod, RepaymentFrequency } from '../../src/models/loan';

import {
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

export default function AddLoanModal() {
  const { theme } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topInset = Math.max(
    insets.top,
    Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) : 0,
  );
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { user } = useAuth();
  const { householdId } = useHousehold();
  const { loans } = useLoans();

  const existingLoan = id ? loans.find((l) => l.id === id) : undefined;
  const isEditMode = Boolean(id && existingLoan);

  const [name, setName] = useState('');
  const [lenderName, setLenderName] = useState('');
  const [loanType, setLoanType] = useState<LoanType>('personal_loan');
  const [originalAmountRupees, setOriginalAmountRupees] = useState('');
  const [outstandingAmountRupees, setOutstandingAmountRupees] = useState('');
  const [interestRatePercent, setInterestRatePercent] = useState('10.5');
  const [interestType, setInterestType] = useState<InterestType>('reducing_balance');
  const [repaymentMethod, setRepaymentMethod] = useState<RepaymentMethod>('emi');
  const [repaymentFrequency, setRepaymentFrequency] = useState<RepaymentFrequency>('monthly');
  const [plannedPaymentRupees, setPlannedPaymentRupees] = useState('');
  const [tenureMonths, setTenureMonths] = useState('36');
  const [isExistingLoan, setIsExistingLoan] = useState(false);
  const [completedInstallments, setCompletedInstallments] = useState('0');
  const [isLenderOutstandingConfirmed, setIsLenderOutstandingConfirmed] = useState(false);
  const [lenderOutstandingRupees, setLenderOutstandingRupees] = useState('');
  const [isLenderRemainingRepaymentConfirmed, setIsLenderRemainingRepaymentConfirmed] = useState(false);
  const [lenderRemainingRepaymentRupees, setLenderRemainingRepaymentRupees] = useState('');
  const [importHistoricalPayments, setImportHistoricalPayments] = useState(false);
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showReverseCalcModal, setShowReverseCalcModal] = useState(false);

  // Pre-fill fields if editing an existing loan
  useEffect(() => {
    if (existingLoan) {
      setName(existingLoan.lenderName || '');
      setLenderName(existingLoan.lenderName || '');
      setLoanType(existingLoan.loanType || 'personal_loan');
      setOriginalAmountRupees(
        existingLoan.originalAmountPaise ? paiseToRupees(existingLoan.originalAmountPaise).toString() : '',
      );
      setOutstandingAmountRupees(
        existingLoan.outstandingAmountPaise !== undefined
          ? paiseToRupees(existingLoan.outstandingAmountPaise).toString()
          : '',
      );
      const initialResolvedRate = resolveLoanInterestRate({
        interestType: existingLoan.interestType || 'reducing_balance',
        interestRateBps: existingLoan.interestRateBps,
        principalPaise: existingLoan.originalAmountPaise,
        monthlyEmiPaise: existingLoan.plannedPaymentPaise,
        tenureMonths: existingLoan.tenureMonths,
      });

      setInterestRatePercent(
        initialResolvedRate.isValid
          ? initialResolvedRate.ratePercent.toString()
          : existingLoan.interestRateBps !== undefined
          ? (existingLoan.interestRateBps / 100).toString()
          : '10.5',
      );
      setInterestType(existingLoan.interestType || 'reducing_balance');
      setRepaymentMethod(existingLoan.repaymentMethod || 'emi');
      setRepaymentFrequency(existingLoan.repaymentFrequency || 'monthly');
      setPlannedPaymentRupees(
        existingLoan.plannedPaymentPaise ? paiseToRupees(existingLoan.plannedPaymentPaise).toString() : '',
      );
      if (existingLoan.tenureMonths) {
        setTenureMonths(existingLoan.tenureMonths.toString());
      }
      if (existingLoan.isExistingLoan !== undefined) {
        setIsExistingLoan(existingLoan.isExistingLoan);
      }
      if (existingLoan.completedInstallments !== undefined) {
        setCompletedInstallments(existingLoan.completedInstallments.toString());
      }
      if (existingLoan.isLenderOutstandingConfirmed) {
        setIsLenderOutstandingConfirmed(true);
      }
      if (existingLoan.isLenderRemainingRepaymentConfirmed) {
        setIsLenderRemainingRepaymentConfirmed(true);
      }
      setNotes(existingLoan.notes || '');
    }
  }, [existingLoan?.id]);

  // Compute live estimated repayment & payoff details
  const origPaise = rupeesToPaise(parseFloat(originalAmountRupees) || 0);
  const rateBps = Math.round(parseFloat(interestRatePercent || '0') * 100);
  const plannedPaise = rupeesToPaise(parseFloat(plannedPaymentRupees) || 0);
  const totalTenure = parseInt(tenureMonths, 10) || 0;
  const completedCount = parseInt(completedInstallments, 10) || 0;

  const lenderOutstandingPaise = isLenderOutstandingConfirmed && lenderOutstandingRupees.trim()
    ? rupeesToPaise(parseFloat(lenderOutstandingRupees) || 0)
    : undefined;

  const lenderRemainingRepaymentPaise = isLenderRemainingRepaymentConfirmed && lenderRemainingRepaymentRupees.trim()
    ? rupeesToPaise(parseFloat(lenderRemainingRepaymentRupees) || 0)
    : undefined;

  const existingLoanCalc = (origPaise > 0 && totalTenure > 0)
    ? calculateExistingLoanState({
        originalPrincipalPaise: origPaise,
        annualRateBps: rateBps,
        totalTenureMonths: totalTenure,
        completedInstallments: isExistingLoan ? completedCount : 0,
        monthlyEmiPaise: plannedPaise,
        interestType,
        lenderOutstandingPaise,
        lenderRemainingRepaymentPaise,
      })
    : null;

  // Determine final outstanding principal paise
  const finalOutstandingPaise = existingLoanCalc
    ? existingLoanCalc.finalOutstandingPrincipalPaise
    : (rupeesToPaise(parseFloat(outstandingAmountRupees) || 0) || origPaise);

  // Determine final remaining repayment balance paise
  const finalRemainingRepaymentPaise = existingLoanCalc
    ? existingLoanCalc.finalRemainingRepaymentPaise
    : finalOutstandingPaise;

  const estimate = finalOutstandingPaise > 0
    ? calculateLoan({
        outstandingAmountPaise: finalOutstandingPaise,
        interestRateBps: rateBps,
        interestType,
        repaymentMethod,
        repaymentFrequency,
        plannedPaymentPaise: plannedPaise,
      })
    : null;

  const handleSave = async () => {
    if (isEditMode) {
      console.log('[LOAN_EDIT_STARTED] User initiated loan update for loanId:', id);
    } else {
      console.log('[LOAN_SAVE_STARTED] User initiated loan creation.');
    }

    if (!user?.uid) {
      Alert.alert('Authentication Error', 'You must be signed in.');
      return;
    }

    if (!householdId) {
      Alert.alert('Workspace Error', 'You must belong to a household workspace.');
      return;
    }

    if (!name.trim()) {
      Alert.alert('Missing Title', 'Please enter a descriptive title for this loan.');
      return;
    }

    if (origPaise <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid original principal amount.');
      return;
    }

    try {
      setIsLoading(true);

      const scheduledInterest = existingLoanCalc ? existingLoanCalc.totalScheduledInterestPaise : undefined;
      const scheduledRepayment = existingLoanCalc ? existingLoanCalc.totalScheduledRepaymentPaise : undefined;
      const historicalPaid = existingLoanCalc ? existingLoanCalc.historicalPaymentsPaidPaise : 0;

      const resolvedRate = resolveLoanInterestRate({
        interestType,
        interestRateBps: rateBps,
        principalPaise: origPaise,
        monthlyEmiPaise: plannedPaise,
        tenureMonths: totalTenure,
      });

      const finalRateBps = resolvedRate.isValid && resolvedRate.rateBps > 0
        ? resolvedRate.rateBps
        : rateBps;

      if (isEditMode && id) {
        console.log('[LOAN_FIRESTORE_WRITE_STARTED] Updating loanId:', id);
        await updateLoan(householdId, id, {
          lenderName: lenderName.trim() || name.trim(),
          loanType,
          originalAmountPaise: origPaise,
          outstandingAmountPaise: finalOutstandingPaise,
          interestRateBps: finalRateBps,
          interestType,
          repaymentMethod,
          repaymentFrequency,
          plannedPaymentPaise: plannedPaise,
          tenureMonths: totalTenure > 0 ? totalTenure : undefined,
          completedInstallments: isExistingLoan ? completedCount : 0,
          isExistingLoan,
          isLenderOutstandingConfirmed,
          isLenderRemainingRepaymentConfirmed,
          totalScheduledInterestPaise: scheduledInterest,
          totalScheduledRepaymentPaise: scheduledRepayment,
          totalAmountPaidPaise: historicalPaid,
          remainingRepaymentBalancePaise: finalRemainingRepaymentPaise,
          notes: notes.trim() || undefined,
        });
        console.log('[LOAN_UPDATE_SUCCESS] Loan document updated successfully.');
      } else {
        console.log('[LOAN_FIRESTORE_WRITE_STARTED] Writing new loan document to households/', householdId, '/loans');
        const newLoan = await addLoan(householdId, {
          householdId,
          lenderName: lenderName.trim() || name.trim(),
          loanType,
          originalAmountPaise: origPaise,
          outstandingAmountPaise: finalOutstandingPaise,
          interestRateBps: finalRateBps,
          interestType,
          repaymentMethod,
          repaymentFrequency,
          plannedPaymentPaise: plannedPaise,
          tenureMonths: totalTenure > 0 ? totalTenure : undefined,
          completedInstallments: isExistingLoan ? completedCount : 0,
          isExistingLoan,
          isLenderOutstandingConfirmed,
          isLenderRemainingRepaymentConfirmed,
          totalScheduledInterestPaise: scheduledInterest,
          totalScheduledRepaymentPaise: scheduledRepayment,
          totalAmountPaidPaise: historicalPaid,
          remainingRepaymentBalancePaise: finalRemainingRepaymentPaise,
          notes: notes.trim() || undefined,
          isActive: finalOutstandingPaise > 0 || finalRemainingRepaymentPaise > 0,
          createdByUserId: user.uid,
        });

        // Register historical payments if requested by user
        if (isExistingLoan && importHistoricalPayments && completedCount > 0 && existingLoanCalc) {
          await registerHistoricalLoanPayments(
            householdId,
            newLoan.id,
            existingLoanCalc.schedule,
            completedCount,
            user.uid,
            'User',
          );
        }
        console.log('[LOAN_FIRESTORE_WRITE_SUCCESS] Loan saved successfully.');
      }

      router.back();
    } catch (err: any) {
      const errorAction = isEditMode ? 'LOAN_UPDATE_ERROR' : 'LOAN_FIRESTORE_WRITE_ERROR';
      console.log(`[${errorAction}]`, err?.message || err);
      const userMessage = isEditMode
        ? 'Unable to update loan. Please try again.'
        : (err?.message || 'Unable to save loan. Please try again.');
      Alert.alert(isEditMode ? 'Update Failed' : 'Save Failed', userMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topInset + 6, borderBottomColor: theme.colors.borderLight }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>
          {isEditMode ? 'Edit Loan' : 'Add Household Loan'}
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Privacy Note */}
        <View style={[styles.privacyBanner, { backgroundColor: theme.colors.primaryLight }]}>
          <Ionicons name="shield-checkmark" size={20} color={theme.colors.primary} />
          <Text style={[styles.privacyText, { color: theme.colors.primary }]}>
            OurMoney is a planning tool. Never enter bank account numbers, passwords, or sensitive IDs.
          </Text>
        </View>

        {/* Title & Lender */}
        <Input
          label="Loan Title / Name *"
          placeholder="e.g. Muthoot Gold Loan, SBI Home Loan"
          value={name}
          onChangeText={setName}
        />

        <Input
          label="Lender / Financial Institution (Optional)"
          placeholder="e.g. SBI, HDFC Bank, Muthoot, Relative"
          value={lenderName}
          onChangeText={setLenderName}
        />

        {/* Loan Category */}
        <Text style={[styles.fieldLabel, { color: theme.colors.textPrimary }]}>Loan Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
          {LOAN_TYPES.map((lt) => {
            const isSelected = loanType === lt.id;
            const IconComp = LOAN_ICON_MAP[lt.iconName] ?? Landmark;
            return (
              <TouchableOpacity
                key={lt.id}
                style={[
                  styles.pill,
                  {
                    backgroundColor: isSelected ? theme.colors.primary : theme.colors.surface,
                    borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                  },
                ]}
                onPress={() => setLoanType(lt.id as LoanType)}
              >
                <IconComp size={16} color={isSelected ? '#FFF' : theme.colors.primary} />
                <Text style={[styles.pillText, { color: isSelected ? '#FFF' : theme.colors.textPrimary }]}>
                  {lt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Amount Inputs */}
        <View style={styles.row}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Input
              label="Original Principal (₹) *"
              placeholder="150000"
              value={originalAmountRupees}
              onChangeText={setOriginalAmountRupees}
              keyboardType="numeric"
            />
          </View>
          <View style={{ flex: 1, marginLeft: 8 }}>
            <Input
              label="Current Outstanding (₹) *"
              placeholder="150000"
              value={outstandingAmountRupees}
              onChangeText={setOutstandingAmountRupees}
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Reverse Interest Trigger */}
        <TouchableOpacity
          style={[
            styles.reverseTrigger,
            {
              backgroundColor: theme.colors.primaryLight,
              borderColor: theme.colors.primary,
            },
          ]}
          onPress={() => setShowReverseCalcModal(true)}
        >
          <Ionicons name="calculator-outline" size={18} color={theme.colors.primary} />
          <Text style={[styles.reverseTriggerText, { color: theme.colors.primary }]}>
            Calculate interest from EMI
          </Text>
        </TouchableOpacity>

        {/* Interest Rate & Repayment Amount */}
        <View style={styles.row}>
          <View style={{ flex: 1, marginRight: 6 }}>
            <Input
              label="Interest Rate (% p.a.)"
              placeholder="10.5"
              value={interestRatePercent}
              onChangeText={setInterestRatePercent}
              keyboardType="decimal-pad"
            />
          </View>
          <View style={{ flex: 1, marginLeft: 6 }}>
            <Input
              label="Planned Payment (₹)"
              placeholder="e.g. 7875"
              value={plannedPaymentRupees}
              onChangeText={setPlannedPaymentRupees}
              keyboardType="numeric"
            />
          </View>
        </View>

        <Input
          label="Loan Tenure (Months)"
          placeholder="e.g. 36"
          value={tenureMonths}
          onChangeText={setTenureMonths}
          keyboardType="number-pad"
        />

        {/* Interest Type Selection */}
        <Text style={[styles.fieldLabel, { color: theme.colors.textPrimary }]}>Interest Type</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
          {[
            { id: 'reducing_balance', label: 'Reducing Balance (EMI)' },
            { id: 'simple', label: 'Simple Interest' },
            { id: 'flat', label: 'Flat Rate' },
            { id: 'unknown', label: 'Other / Flexible' },
          ].map((it) => {
            const isSelected = interestType === it.id;
            return (
              <TouchableOpacity
                key={it.id}
                style={[
                  styles.pill,
                  {
                    backgroundColor: isSelected ? theme.colors.primary : theme.colors.surface,
                    borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                  },
                ]}
                onPress={() => setInterestType(it.id as InterestType)}
              >
                <Text style={[styles.pillText, { color: isSelected ? '#FFF' : theme.colors.textPrimary }]}>
                  {it.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Repayment Method */}
        <Text style={[styles.fieldLabel, { color: theme.colors.textPrimary }]}>Repayment Method</Text>
        <View style={styles.methodGrid}>
          {[
            { id: 'emi', label: 'Equated EMI (Principal + Interest)' },
            { id: 'interest_only', label: 'Interest Only' },
            { id: 'principal_plus_interest', label: 'Principal + Interest' },
            { id: 'custom', label: 'Custom Repayment' },
          ].map((m) => {
            const isSelected = repaymentMethod === m.id;
            return (
              <TouchableOpacity
                key={m.id}
                style={[
                  styles.methodOption,
                  {
                    backgroundColor: isSelected ? theme.colors.primaryLight : theme.colors.surface,
                    borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                  },
                ]}
                onPress={() => setRepaymentMethod(m.id as RepaymentMethod)}
              >
                <Text style={[styles.methodText, { color: isSelected ? theme.colors.primary : theme.colors.textPrimary }]}>
                  {m.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Repayment Frequency */}
        <Text style={[styles.fieldLabel, { color: theme.colors.textPrimary }]}>Repayment Frequency</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
          {[
            { id: 'monthly', label: 'Monthly' },
            { id: 'quarterly', label: 'Every 3 Months' },
            { id: 'half_yearly', label: 'Every 6 Months' },
            { id: 'yearly', label: 'Yearly' },
            { id: 'custom', label: 'Custom' },
          ].map((freq) => {
            const isSelected = repaymentFrequency === freq.id;
            return (
              <TouchableOpacity
                key={freq.id}
                style={[
                  styles.pill,
                  {
                    backgroundColor: isSelected ? theme.colors.primary : theme.colors.surface,
                    borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                  },
                ]}
                onPress={() => setRepaymentFrequency(freq.id as RepaymentFrequency)}
              >
                <Text style={[styles.pillText, { color: isSelected ? '#FFF' : theme.colors.textPrimary }]}>
                  {freq.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Existing Loan Section */}
        <Card style={[styles.existingCard, { backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.border }]}>
          <View style={styles.existingHeaderRow}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={[styles.existingCardTitle, { color: theme.colors.textPrimary }]}>
                Existing Loan / Already Started?
              </Text>
              <Text style={[styles.existingCardSub, { color: theme.colors.textSecondary }]}>
                Enable if you have already completed previous installment payments for this loan.
              </Text>
            </View>
            <Switch
              value={isExistingLoan}
              onValueChange={setIsExistingLoan}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
              thumbColor="#FFF"
            />
          </View>

          {isExistingLoan && (
            <View style={styles.existingDetailsContainer}>
              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 6 }}>
                  <Input
                    label="Completed Installments *"
                    placeholder="e.g. 6"
                    value={completedInstallments}
                    onChangeText={setCompletedInstallments}
                    keyboardType="number-pad"
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 6, justifyContent: 'center', paddingTop: 10 }}>
                  <Text style={[styles.fieldLabel, { color: theme.colors.textPrimary, marginTop: 0 }]}>
                    Remaining Tenure
                  </Text>
                  <Text style={[styles.remainingBadgeText, { color: theme.colors.primary }]}>
                    {Math.max(0, totalTenure - completedCount)} months remaining
                  </Text>
                  <Text style={[styles.remainingSubText, { color: theme.colors.textTertiary }]}>
                    out of {totalTenure} months total
                  </Text>
                </View>
              </View>

              {/* Optional Lender Overrides */}
              <View style={styles.overrideSection}>
                <TouchableOpacity
                  style={styles.checkboxRow}
                  onPress={() => setIsLenderOutstandingConfirmed(!isLenderOutstandingConfirmed)}
                >
                  <Ionicons
                    name={isLenderOutstandingConfirmed ? 'checkbox' : 'square-outline'}
                    size={20}
                    color={theme.colors.primary}
                  />
                  <Text style={[styles.checkboxLabel, { color: theme.colors.textPrimary }]}>
                    Enter lender-confirmed current principal balance
                  </Text>
                </TouchableOpacity>
                {isLenderOutstandingConfirmed && (
                  <Input
                    label="Lender Outstanding Principal (₹)"
                    placeholder="e.g. 260000"
                    value={lenderOutstandingRupees}
                    onChangeText={setLenderOutstandingRupees}
                    keyboardType="numeric"
                  />
                )}

                <TouchableOpacity
                  style={styles.checkboxRow}
                  onPress={() => setIsLenderRemainingRepaymentConfirmed(!isLenderRemainingRepaymentConfirmed)}
                >
                  <Ionicons
                    name={isLenderRemainingRepaymentConfirmed ? 'checkbox' : 'square-outline'}
                    size={20}
                    color={theme.colors.primary}
                  />
                  <Text style={[styles.checkboxLabel, { color: theme.colors.textPrimary }]}>
                    Enter lender-confirmed exact remaining repayment
                  </Text>
                </TouchableOpacity>
                {isLenderRemainingRepaymentConfirmed && (
                  <Input
                    label="Lender Remaining Repayment Amount (₹)"
                    placeholder="e.g. 353100"
                    value={lenderRemainingRepaymentRupees}
                    onChangeText={setLenderRemainingRepaymentRupees}
                    keyboardType="numeric"
                  />
                )}
              </View>

              {!isEditMode && (
                <TouchableOpacity
                  style={styles.checkboxRow}
                  onPress={() => setImportHistoricalPayments(!importHistoricalPayments)}
                >
                  <Ionicons
                    name={importHistoricalPayments ? 'checkbox' : 'square-outline'}
                    size={20}
                    color={theme.colors.primary}
                  />
                  <Text style={[styles.checkboxLabel, { color: theme.colors.textPrimary }]}>
                    Import past completed EMIs into transaction history (as expense logs)
                  </Text>
                </TouchableOpacity>
              )}

              {/* Existing Loan Live Breakdown */}
              {existingLoanCalc && (
                <View style={[styles.existingSummaryBox, { backgroundColor: theme.colors.primaryLight }]}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <Text style={[styles.summaryBoxTitle, { color: theme.colors.primary }]}>
                      Loan History & Obligation Summary
                    </Text>
                    {isLenderOutstandingConfirmed || isLenderRemainingRepaymentConfirmed ? (
                      <Badge label="Lender Confirmed" variant="success" size="sm" />
                    ) : (
                      <Badge label="Schedule Est." variant="info" size="sm" />
                    )}
                  </View>

                  <View style={styles.summaryRow}>
                    <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>
                      Total Historical Payments Paid:
                    </Text>
                    <Text style={[styles.summaryVal, { color: theme.colors.textPrimary }]}>
                      {formatCurrency(existingLoanCalc.historicalPaymentsPaidPaise)} ({completedCount} EMIs)
                    </Text>
                  </View>

                  <View style={styles.summaryRow}>
                    <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>
                      Current Outstanding Principal:
                    </Text>
                    <Text style={[styles.summaryVal, { color: theme.colors.textPrimary, fontWeight: '700' }]}>
                      {formatCurrency(existingLoanCalc.finalOutstandingPrincipalPaise)}
                      {isLenderOutstandingConfirmed ? ' (Lender)' : ' (Amortized)'}
                    </Text>
                  </View>

                  <View style={styles.summaryRow}>
                    <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>
                      Total Remaining Scheduled Repayment:
                    </Text>
                    <Text style={[styles.summaryVal, { color: theme.colors.primary, fontWeight: '700' }]}>
                      {formatCurrency(existingLoanCalc.finalRemainingRepaymentPaise)}
                      {isLenderRemainingRepaymentConfirmed ? ' (Lender)' : ` (${existingLoanCalc.remainingInstallmentCount} EMIs)`}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          )}
        </Card>

        {/* Live Calculation Estimate Card */}
        {estimate && (
          <Card style={[styles.estimateCard, { backgroundColor: theme.colors.surfaceElevated }]}>
            <View style={styles.estimateHeader}>
              <Text style={[styles.estimateTitle, { color: theme.colors.textPrimary }]}>
                Repayment Estimation
              </Text>
              <Badge label="Estimated" variant="info" size="sm" />
            </View>
            {estimate.monthlyInterestPaise !== null && (
              <Text style={[styles.estimateValue, { color: theme.colors.primary }]}>
                {formatCurrency(estimate.monthlyInterestPaise)}{' '}
                <Text style={[styles.estimateSub, { color: theme.colors.textSecondary }]}>
                  {repaymentMethod === 'interest_only' ? 'estimated interest / month' : 'est. monthly interest portion'}
                </Text>
              </Text>
            )}
            <Text style={[styles.estimateDisclaimer, { color: theme.colors.textTertiary }]}>
              {estimate.disclaimer}
            </Text>
          </Card>
        )}
        {/* Interest Model Comparison */}
        {origPaise > 0 && plannedPaise > 0 && totalTenure > 0 && (
          <InterestComparisonCard
            principalPaise={origPaise}
            monthlyEmiPaise={plannedPaise}
            tenureMonths={totalTenure}
            selectedInterestType={interestType}
            onSelectInterestType={(type, _modelRateBps, modelRatePercent) => {
              setInterestType(type);
              setInterestRatePercent(modelRatePercent.toString());
            }}
          />
        )}

        {/* Notes */}
        <Input
          label="Notes / Reminders (Optional)"
          placeholder="e.g. Interest due every 6 months on 15th..."
          value={notes}
          onChangeText={setNotes}
          multiline
        />

        <View style={{ marginTop: 24, marginBottom: 40 }}>
          <Button
            title={isEditMode ? 'Save Changes' : 'Add Loan'}
            variant="primary"
            size="lg"
            loading={isLoading}
            onPress={handleSave}
          />
        </View>
      </ScrollView>

      {/* Reverse Interest Calculator Modal */}
      <ReverseInterestModal
        visible={showReverseCalcModal}
        onClose={() => setShowReverseCalcModal(false)}
        initialPrincipalRupees={originalAmountRupees}
        initialEmiRupees={plannedPaymentRupees}
        initialTenureMonths={tenureMonths}
        initialInterestType={interestType}
        onApply={({ annualRatePercent, plannedPaymentRupees: emi, interestType: it, tenureMonths: t, principalRupees: pr }) => {
          if (pr) {
            setOriginalAmountRupees(pr);
          }
          setInterestRatePercent(annualRatePercent);
          setPlannedPaymentRupees(emi);
          setInterestType(it);
          setTenureMonths(t);
        }}
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
  privacyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  privacyText: { fontSize: 12, fontWeight: '600', marginLeft: 8, flex: 1 },
  reverseTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 14,
    marginBottom: 6,
  },
  reverseTriggerText: {
    fontSize: 13,
    fontWeight: '700',
  },
  fieldLabel: { fontSize: 14, fontWeight: '700', marginTop: 14, marginBottom: 8 },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  pillText: { fontSize: 13, fontWeight: '600' },
  row: { flexDirection: 'row' },
  methodGrid: { marginBottom: 8 },
  methodOption: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  methodText: { fontSize: 13, fontWeight: '600' },
  existingCard: {
    padding: 14,
    marginVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  existingHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  existingCardTitle: { fontSize: 15, fontWeight: '700' },
  existingCardSub: { fontSize: 12, marginTop: 2 },
  existingDetailsContainer: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  remainingBadgeText: { fontSize: 14, fontWeight: '700' },
  remainingSubText: { fontSize: 11, marginTop: 2 },
  overrideSection: { marginVertical: 10 },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 6, gap: 8 },
  checkboxLabel: { fontSize: 13, fontWeight: '500', flex: 1 },
  existingSummaryBox: { padding: 12, borderRadius: 10, marginTop: 10 },
  summaryBoxTitle: { fontSize: 13, fontWeight: '700', marginBottom: 6 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 2 },
  summaryLabel: { fontSize: 12 },
  summaryVal: { fontSize: 12, fontWeight: '600' },
  estimateCard: {
    padding: 14,
    marginVertical: 12,
    borderRadius: 14,
  },
  estimateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  estimateTitle: { fontSize: 14, fontWeight: '700' },
  estimateValue: { fontSize: 18, fontWeight: '800', marginBottom: 4 },
  estimateSub: { fontSize: 12, fontWeight: '500' },
  estimateDisclaimer: { fontSize: 11, marginTop: 4, lineHeight: 15 },
});
