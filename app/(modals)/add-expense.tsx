// OurMoney — Add / Edit Expense Modal
// Allows logging household expenses with category, payment method, split, notes,
// and runs smart reflection analysis prior to saving.

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../src/context/AuthContext';
import { useHousehold } from '../../src/context/HouseholdContext';
import { useExpenses } from '../../src/hooks/useExpenses';
import { useBudgets } from '../../src/hooks/useBudgets';
import { addExpense } from '../../src/services/expenseService';
import { evaluateExpenseReflection, SpendingReflectionResult } from '../../src/services/spendingInsightsService';
import { Input } from '../../src/components/Input';
import { Button } from '../../src/components/Button';
import { SpendingReflectionModal } from '../../src/components/SpendingReflectionModal';
import { CATEGORIES, getCategoryById } from '../../src/constants/categories';
import { PAYMENT_METHODS } from '../../src/constants/paymentMethods';
import { rupeesToPaise, formatCurrency } from '../../src/utils/currency';
import { getCurrentDateString, getCurrentMonth } from '../../src/utils/dateUtils';
import type { PaymentMethod } from '../../src/models/expense';

export default function AddExpenseModal() {
  const { theme } = useTheme();
  const router = useRouter();
  const { user, userProfile } = useAuth();
  const { householdId, partner, isSolo } = useHousehold();

  const currentMonth = getCurrentMonth();
  const { expenses } = useExpenses({ month: currentMonth });
  const { budgets } = useBudgets(currentMonth);

  const [amountRupees, setAmountRupees] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('groceries');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('upi');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(getCurrentDateString());
  const [splitRatio, setSplitRatio] = useState<'equal' | '100_user' | '100_partner'>('equal');

  const [isLoading, setIsLoading] = useState(false);
  const [reflectionResult, setReflectionResult] = useState<SpendingReflectionResult | null>(null);
  const [showReflectionModal, setShowReflectionModal] = useState(false);

  const parsedAmountPaise = rupeesToPaise(parseFloat(amountRupees) || 0);
  const partnerName = partner?.displayName ?? 'Partner';

  const handleAttemptSave = () => {
    if (!amountRupees || parsedAmountPaise <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid expense amount in rupees.');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Missing Title', 'Please enter a title or vendor for this expense.');
      return;
    }
    if (!householdId || !user) {
      Alert.alert('Workspace Error', 'You must belong to a household workspace to log expenses.');
      return;
    }

    // Evaluate smart reflection insights
    const reflection = evaluateExpenseReflection({
      newExpensePaise: parsedAmountPaise,
      categoryId,
      monthExpenses: expenses,
      budgets,
      currentUserId: user.uid,
    });

    if (reflection.shouldReflect) {
      setReflectionResult(reflection);
      setShowReflectionModal(true);
    } else {
      executeSave();
    }
  };

  const executeSave = async () => {
    if (!householdId || !user) return;

    try {
      setIsLoading(true);

      const userPaidPaise =
        splitRatio === 'equal'
          ? Math.round(parsedAmountPaise / 2)
          : splitRatio === '100_user'
          ? parsedAmountPaise
          : 0;

      const partnerPaidPaise = parsedAmountPaise - userPaidPaise;

      await addExpense(householdId, {
        amountPaise: parsedAmountPaise,
        description: description.trim(),
        categoryId,
        paidByUserId: user.uid,
        paidByUserName: userProfile?.displayName ?? 'Me',
        paymentMethod,
        date,
        notes: notes.trim() || undefined,
        splitRatio: splitRatio === 'equal' ? '50/50' : 'custom',
        userPaidPaise,
        partnerPaidPaise,
      });

      setShowReflectionModal(false);
      router.back();
    } catch (err: any) {
      Alert.alert('Failed to Save', err.message);
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
        <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>Add Expense</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Amount Input */}
        <View style={[styles.amountCard, { backgroundColor: theme.colors.surfaceElevated }]}>
          <Text style={[styles.amountLabel, { color: theme.colors.textSecondary }]}>Amount</Text>
          <View style={styles.amountInputRow}>
            <Text style={[styles.currencySymbol, { color: theme.colors.primary }]}>₹</Text>
            <Input
              value={amountRupees}
              onChangeText={setAmountRupees}
              placeholder="0.00"
              keyboardType="decimal-pad"
              style={styles.amountInput}
              inputStyle={{ fontSize: 32, fontWeight: '800', textAlign: 'center' }}
              autoFocus
            />
          </View>
        </View>

        {/* Title / Description Input */}
        <Input
          label="Expense Title / Vendor"
          placeholder="e.g. Weekly Groceries, Electricity Bill"
          value={description}
          onChangeText={setDescription}
        />

        {/* Category Selection */}
        <Text style={[styles.fieldLabel, { color: theme.colors.textPrimary }]}>Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
          {CATEGORIES.map((cat) => {
            const isSelected = categoryId === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryPill,
                  {
                    backgroundColor: isSelected ? cat.color : theme.colors.surface,
                    borderColor: isSelected ? cat.color : theme.colors.border,
                  },
                ]}
                onPress={() => setCategoryId(cat.id)}
              >
                <Ionicons
                  name={cat.icon as any}
                  size={16}
                  color={isSelected ? '#FFF' : theme.colors.textSecondary}
                />
                <Text
                  style={[
                    styles.categoryPillText,
                    { color: isSelected ? '#FFF' : theme.colors.textPrimary },
                  ]}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Payment Method Selection */}
        <Text style={[styles.fieldLabel, { color: theme.colors.textPrimary }]}>Payment Method</Text>
        <View style={styles.paymentGrid}>
          {PAYMENT_METHODS.map((pm) => {
            const isSelected = paymentMethod === pm.id;
            return (
              <TouchableOpacity
                key={pm.id}
                style={[
                  styles.paymentOption,
                  {
                    backgroundColor: isSelected ? theme.colors.primaryLight : theme.colors.surface,
                    borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                  },
                ]}
                onPress={() => setPaymentMethod(pm.id as PaymentMethod)}
              >
                <Ionicons
                  name={pm.icon as any}
                  size={18}
                  color={isSelected ? theme.colors.primary : theme.colors.textSecondary}
                />
                <Text
                  style={[
                    styles.paymentOptionText,
                    { color: isSelected ? theme.colors.primary : theme.colors.textPrimary },
                  ]}
                >
                  {pm.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Split Ratio — only visible in shared household mode */}
        {!isSolo && (
          <>
            <Text style={[styles.fieldLabel, { color: theme.colors.textPrimary }]}>Household Split</Text>
            <View style={styles.splitRow}>
              <TouchableOpacity
                style={[
                  styles.splitOption,
                  splitRatio === 'equal' && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
                ]}
                onPress={() => setSplitRatio('equal')}
              >
                <Text style={[styles.splitText, splitRatio === 'equal' && { color: '#FFF' }]}>
                  Shared 50 / 50
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.splitOption,
                  splitRatio === '100_user' && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
                ]}
                onPress={() => setSplitRatio('100_user')}
              >
                <Text style={[styles.splitText, splitRatio === '100_user' && { color: '#FFF' }]}>
                  100% You
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.splitOption,
                  splitRatio === '100_partner' && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
                ]}
                onPress={() => setSplitRatio('100_partner')}
              >
                <Text style={[styles.splitText, splitRatio === '100_partner' && { color: '#FFF' }]}>
                  100% {partnerName}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* Optional Notes */}
        <Input
          label="Notes (Optional)"
          placeholder="Add extra context or receipt details..."
          value={notes}
          onChangeText={setNotes}
          multiline
        />

        <View style={{ marginTop: 24, marginBottom: 40 }}>
          <Button
            title="Save Expense"
            variant="primary"
            size="lg"
            loading={isLoading}
            onPress={handleAttemptSave}
          />
        </View>
      </ScrollView>

      {/* Smart Spending Reflection Modal */}
      <SpendingReflectionModal
        visible={showReflectionModal}
        reflection={reflectionResult}
        amountPaise={parsedAmountPaise}
        categoryName={getCategoryById(categoryId).label}
        onConfirm={executeSave}
        onCancel={() => setShowReflectionModal(false)}
        isSubmitting={isLoading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 56,
    borderBottomWidth: 1,
  },
  closeButton: {
    width: 36,
    height: 36,
    justify: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  amountCard: {
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  amountLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencySymbol: {
    fontSize: 32,
    fontWeight: '800',
    marginRight: 4,
  },
  amountInput: {
    width: 200,
    marginBottom: 0,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  categoryScroll: {
    marginBottom: 12,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  categoryPillText: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
  paymentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 8,
    marginBottom: 8,
  },
  paymentOptionText: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
  splitRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  splitOption: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    marginRight: 6,
  },
  splitText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
