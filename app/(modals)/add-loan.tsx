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
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../src/context/AuthContext';
import { useHousehold } from '../../src/context/HouseholdContext';
import { addLoan, updateLoan } from '../../src/services/loanService';
import { useLoans } from '../../src/hooks/useLoans';
import { Input } from '../../src/components/Input';
import { Button } from '../../src/components/Button';
import { Card } from '../../src/components/Card';
import { Badge } from '../../src/components/Badge';
import { LOAN_TYPES } from '../../src/constants/loanTypes';
import { rupeesToPaise, paiseToRupees, formatCurrency } from '../../src/utils/currency';
import { calculateLoan } from '../../src/utils/loanCalculations';
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
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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
      setInterestRatePercent(
        existingLoan.interestRateBps !== undefined ? (existingLoan.interestRateBps / 100).toString() : '10.5',
      );
      setInterestType(existingLoan.interestType || 'reducing_balance');
      setRepaymentMethod(existingLoan.repaymentMethod || 'emi');
      setRepaymentFrequency(existingLoan.repaymentFrequency || 'monthly');
      setPlannedPaymentRupees(
        existingLoan.plannedPaymentPaise ? paiseToRupees(existingLoan.plannedPaymentPaise).toString() : '',
      );
      setNotes(existingLoan.notes || '');
    }
  }, [existingLoan?.id]);

  // Compute live estimated repayment & payoff details
  const origPaise = rupeesToPaise(parseFloat(originalAmountRupees) || 0);
  const currPaise = rupeesToPaise(parseFloat(outstandingAmountRupees) || parseFloat(originalAmountRupees) || 0);
  const rateBps = Math.round(parseFloat(interestRatePercent || '0') * 100);
  const plannedPaise = rupeesToPaise(parseFloat(plannedPaymentRupees) || 0);

  const estimate = currPaise > 0
    ? calculateLoan({
        outstandingAmountPaise: currPaise,
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
      console.log('[LOAN_FIRESTORE_WRITE_ERROR] No authenticated user UID available.');
      Alert.alert('Authentication Error', 'You must be signed in.');
      return;
    }
    console.log('[AUTH_USER_UID_AVAILABLE]', user.uid);

    if (!householdId) {
      console.log('[LOAN_FIRESTORE_WRITE_ERROR] No householdId available.');
      Alert.alert('Workspace Error', 'You must belong to a household workspace.');
      return;
    }
    console.log('[HOUSEHOLD_ID_AVAILABLE]', householdId);

    if (!name.trim()) {
      Alert.alert('Missing Title', 'Please enter a descriptive title for this loan.');
      return;
    }

    if (origPaise <= 0 || currPaise <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid principal or current outstanding balance.');
      return;
    }

    console.log('[LOAN_VALIDATION_SUCCESS]', {
      name: name.trim(),
      lenderName: lenderName.trim() || name.trim(),
      loanType,
      origPaise,
      currPaise,
      rateBps,
      repaymentMethod,
      repaymentFrequency,
    });

    try {
      setIsLoading(true);

      if (isEditMode && id) {
        console.log('[LOAN_FIRESTORE_WRITE_STARTED] Updating loanId:', id);
        await updateLoan(householdId, id, {
          lenderName: lenderName.trim() || name.trim(),
          loanType,
          originalAmountPaise: origPaise,
          outstandingAmountPaise: currPaise,
          interestRateBps: rateBps,
          interestType,
          repaymentMethod,
          repaymentFrequency,
          plannedPaymentPaise: plannedPaise,
          notes: notes.trim() || undefined,
        });
        console.log('[LOAN_UPDATE_SUCCESS] Loan document updated successfully.');
      } else {
        console.log('[LOAN_FIRESTORE_WRITE_STARTED] Writing new loan document to households/', householdId, '/loans');
        await addLoan(householdId, {
          householdId,
          lenderName: lenderName.trim() || name.trim(),
          loanType,
          originalAmountPaise: origPaise,
          outstandingAmountPaise: currPaise,
          interestRateBps: rateBps,
          interestType,
          repaymentMethod,
          repaymentFrequency,
          plannedPaymentPaise: plannedPaise,
          notes: notes.trim() || undefined,
          isActive: true,
          createdByUserId: user.uid,
        });
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

        {/* Interest Rate & Repayment Amount */}
        <View style={styles.row}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Input
              label="Interest Rate (% p.a.)"
              placeholder="10.5"
              value={interestRatePercent}
              onChangeText={setInterestRatePercent}
              keyboardType="decimal-pad"
            />
          </View>
          <View style={{ flex: 1, marginLeft: 8 }}>
            <Input
              label="Planned Payment (₹)"
              placeholder="e.g. 7875"
              value={plannedPaymentRupees}
              onChangeText={setPlannedPaymentRupees}
              keyboardType="numeric"
            />
          </View>
        </View>

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
