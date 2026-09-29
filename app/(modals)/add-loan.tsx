// OurMoney — Add Loan / Debt Modal
// Allows adding a household loan (e.g. Gold Loan, Personal Loan, Home Loan, EMI).
// PRIVACY RESTRICTION: Zero account numbers, bank credentials, or sensitive IDs.

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../src/context/AuthContext';
import { useHousehold } from '../../src/context/HouseholdContext';
import { addLoan } from '../../src/services/loanService';
import { Input } from '../../src/components/Input';
import { Button } from '../../src/components/Button';
import { LOAN_TYPES } from '../../src/constants/loanTypes';
import { rupeesToPaise } from '../../src/utils/currency';
import type { LoanType, InterestType, RepaymentMethod, RepaymentFrequency } from '../../src/models/loan';

export default function AddLoanModal() {
  const { theme } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const { householdId } = useHousehold();

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

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Missing Name', 'Please give this loan a descriptive name (e.g., Home Renovation Loan).');
      return;
    }
    const origPaise = rupeesToPaise(parseFloat(originalAmountRupees) || 0);
    const currPaise = rupeesToPaise(parseFloat(outstandingAmountRupees) || parseFloat(originalAmountRupees) || 0);

    if (origPaise <= 0 || currPaise <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid principal or outstanding loan balance.');
      return;
    }
    if (!householdId || !user) {
      Alert.alert('Workspace Error', 'You must belong to a household workspace.');
      return;
    }

    const rateBps = Math.round(parseFloat(interestRatePercent || '0') * 100);
    const plannedPaise = rupeesToPaise(parseFloat(plannedPaymentRupees) || 0);

    try {
      setIsLoading(true);
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

      router.back();
    } catch (err: any) {
      Alert.alert('Failed to Save Loan', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.borderLight }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>Add Household Loan</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Privacy Note */}
        <View style={[styles.privacyBanner, { backgroundColor: theme.colors.primaryLight }]}>
          <Ionicons name="shield-checkmark" size={20} color={theme.colors.primary} />
          <Text style={[styles.privacyText, { color: theme.colors.primary }]}>
            OurMoney is a planning tool. Never enter bank account numbers or login passwords.
          </Text>
        </View>

        <Input
          label="Loan Title / Description"
          placeholder="e.g. Car Loan, SBI Gold Loan"
          value={name}
          onChangeText={setName}
        />

        <Input
          label="Lender / Institution (Optional)"
          placeholder="e.g. SBI, HDFC, Friend, Relative"
          value={lenderName}
          onChangeText={setLenderName}
        />

        {/* Loan Type */}
        <Text style={[styles.fieldLabel, { color: theme.colors.textPrimary }]}>Loan Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
          {LOAN_TYPES.map((lt) => {
            const isSelected = loanType === lt.id;
            return (
              <TouchableOpacity
                key={lt.id}
                style={[
                  styles.pill,
                  {
                    backgroundColor: isSelected ? theme.colors.primary : theme.colors.surface,
                    borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                  },
                ]}
                onPress={() => setLoanType(lt.id as LoanType)}
              >
                <Text style={[styles.pillText, { color: isSelected ? '#FFF' : theme.colors.textPrimary }]}>
                  {lt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Amounts */}
        <View style={styles.row}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Input
              label="Original Principal (₹)"
              placeholder="500000"
              value={originalAmountRupees}
              onChangeText={setOriginalAmountRupees}
              keyboardType="numeric"
            />
          </View>
          <View style={{ flex: 1, marginLeft: 8 }}>
            <Input
              label="Current Outstanding (₹)"
              placeholder="350000"
              value={outstandingAmountRupees}
              onChangeText={setOutstandingAmountRupees}
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Interest Rate & Type */}
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
              label="Monthly EMI / Payment (₹)"
              placeholder="12000"
              value={plannedPaymentRupees}
              onChangeText={setPlannedPaymentRupees}
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Repayment Method */}
        <Text style={[styles.fieldLabel, { color: theme.colors.textPrimary }]}>Repayment Method</Text>
        <View style={styles.methodGrid}>
          {[
            { id: 'emi', label: 'Equated EMI (P + I)' },
            { id: 'interest_only', label: 'Interest Only' },
            { id: 'principal_plus_interest', label: 'Principal + Interest' },
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

        <Input
          label="Notes / Reminders (Optional)"
          placeholder="e.g. Due on 5th of every month..."
          value={notes}
          onChangeText={setNotes}
          multiline
        />

        <View style={{ marginTop: 20, marginBottom: 40 }}>
          <Button
            title="Add Loan"
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
    height: 56,
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
  fieldLabel: { fontSize: 14, fontWeight: '700', marginTop: 12, marginBottom: 8 },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  pillText: { fontSize: 13, fontWeight: '600' },
  row: { flexDirection: 'row' },
  methodGrid: { marginBottom: 12 },
  methodOption: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  methodText: { fontSize: 13, fontWeight: '600' },
});
