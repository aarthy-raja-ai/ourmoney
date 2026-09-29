// OurMoney — Record Loan Payment Modal
// Allows logging an EMI or prepayment against an active loan and updates the outstanding balance.

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../src/context/AuthContext';
import { useHousehold } from '../../src/context/HouseholdContext';
import { useLoans } from '../../src/hooks/useLoans';
import { recordLoanPayment } from '../../src/services/loanService';
import { Input } from '../../src/components/Input';
import { Button } from '../../src/components/Button';
import { rupeesToPaise, formatCurrency, paiseToRupees } from '../../src/utils/currency';
import { getCurrentDateString } from '../../src/utils/dateUtils';
import type { LoanPaymentType } from '../../src/models/loanPayment';

export default function RecordPaymentModal() {
  const { theme } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, userProfile } = useAuth();
  const { householdId } = useHousehold();
  const { loans } = useLoans();

  const loan = loans.find((l) => l.id === id);

  const [amountRupees, setAmountRupees] = useState(
    loan ? paiseToRupees(loan.minimumPaymentPaise ?? loan.monthlyPaymentPaise ?? 0).toString() : '',
  );
  const [paymentType, setPaymentType] = useState<LoanPaymentType>('emi');
  const [date, setDate] = useState(getCurrentDateString());
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!loan) {
    return null;
  }

  const handleSavePayment = async () => {
    const paise = rupeesToPaise(parseFloat(amountRupees) || 0);
    if (paise <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid payment amount.');
      return;
    }
    if (!householdId || !user) return;

    try {
      setIsLoading(true);
      await recordLoanPayment(householdId, loan.id, loan.currentBalancePaise, {
        amountPaise: paise,
        paymentType,
        date,
        paidByUserId: user.uid,
        paidByUserName: userProfile?.displayName ?? 'Me',
        notes: notes.trim() || undefined,
      });

      router.back();
    } catch (err: any) {
      Alert.alert('Payment Error', err.message);
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
        <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>Record Loan Payment</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={[styles.infoBanner, { backgroundColor: theme.colors.surfaceElevated }]}>
          <Text style={[styles.loanTitle, { color: theme.colors.textPrimary }]}>{loan.name}</Text>
          <Text style={[styles.outstandingText, { color: theme.colors.textSecondary }]}>
            Current Balance: {formatCurrency(loan.currentBalancePaise)}
          </Text>
        </View>

        <Input
          label="Payment Amount (₹)"
          placeholder="0.00"
          value={amountRupees}
          onChangeText={setAmountRupees}
          keyboardType="numeric"
          autoFocus
        />

        {/* Payment Type Selection */}
        <Text style={[styles.fieldLabel, { color: theme.colors.textPrimary }]}>Payment Type</Text>
        <View style={styles.typeRow}>
          {[
            { id: 'emi', label: 'Regular EMI' },
            { id: 'prepayment', label: 'Principal Prepayment' },
            { id: 'interest', label: 'Interest Only' },
          ].map((t) => {
            const isSelected = paymentType === t.id;
            return (
              <TouchableOpacity
                key={t.id}
                style={[
                  styles.typeOption,
                  {
                    backgroundColor: isSelected ? theme.colors.primaryLight : theme.colors.surface,
                    borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                  },
                ]}
                onPress={() => setPaymentType(t.id as LoanPaymentType)}
              >
                <Text
                  style={[
                    styles.typeText,
                    { color: isSelected ? theme.colors.primary : theme.colors.textPrimary },
                  ]}
                >
                  {t.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Input
          label="Notes (Optional)"
          placeholder="e.g. Paid via UPI, part of bonus..."
          value={notes}
          onChangeText={setNotes}
          multiline
        />

        <View style={{ marginTop: 24, marginBottom: 40 }}>
          <Button
            title="Record Payment"
            variant="primary"
            size="lg"
            loading={isLoading}
            onPress={handleSavePayment}
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
  infoBanner: { padding: 16, borderRadius: 16, marginBottom: 20 },
  loanTitle: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  outstandingText: { fontSize: 13 },
  fieldLabel: { fontSize: 14, fontWeight: '700', marginTop: 12, marginBottom: 8 },
  typeRow: { flexDirection: 'row', marginBottom: 16 },
  typeOption: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    marginRight: 6,
  },
  typeText: { fontSize: 12, fontWeight: '600', textAlign: 'center' },
});
