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
  Platform,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
import { CategoryIcon } from '../../src/components/CategoryIcon';
import { SpendingReflectionModal } from '../../src/components/SpendingReflectionModal';
import { CATEGORIES, getCategoryById } from '../../src/constants/categories';
import { PAYMENT_METHODS } from '../../src/constants/paymentMethods';
import { rupeesToPaise } from '../../src/utils/currency';
import { getCurrentDateString, getCurrentMonth } from '../../src/utils/dateUtils';
import type { PaymentMethod } from '../../src/models/expense';
import {
  Banknote,
  Smartphone,
  CreditCard,
  ArrowLeftRight,
  MoreHorizontal,
  Check,
  Clock,
  type LucideIcon,
} from 'lucide-react-native';

const PAYMENT_ICON_MAP: Record<string, LucideIcon> = {
  Banknote,
  Smartphone,
  CreditCard,
  ArrowLeftRight,
  MoreHorizontal,
};

import { Timestamp } from 'firebase/firestore';
import type { CategoryId } from '../../src/constants/categories';

export default function AddExpenseModal() {
  const { theme, isDark } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topInset = Math.max(
    insets.top,
    Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) : 0,
  );
  const { user, userProfile } = useAuth();
  const { householdId } = useHousehold();

  // Theme-aware colors strictly scoped to the transaction entry form inputs
  const formInputTextColor = isDark ? '#FFFFFF' : theme.colors.textPrimary;
  const formPlaceholderTextColor = isDark ? '#6C7D93' : theme.colors.textTertiary;
  const formCursorColor = isDark ? '#5B7BF3' : theme.colors.primary;

  const currentMonth = getCurrentMonth();
  const { expenses } = useExpenses({ month: currentMonth });
  const { budgets: _budgets } = useBudgets(currentMonth);

  const [amountRupees, setAmountRupees] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState<CategoryId>('groceries');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('upi');
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'credit'>('paid');
  const [notes, setNotes] = useState('');
  const [date, _setDate] = useState(getCurrentDateString());

  const [isLoading, setIsLoading] = useState(false);
  const [reflectionResult, setReflectionResult] = useState<SpendingReflectionResult | null>(null);
  const [showReflectionModal, setShowReflectionModal] = useState(false);

  const parsedAmountPaise = rupeesToPaise(parseFloat(amountRupees) || 0);

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
    const currentCatSpent = expenses
      .filter((e) => e.categoryId === categoryId)
      .reduce((sum, e) => sum + e.amountPaise, 0);

    const reflection = evaluateExpenseReflection({
      amountPaise: parsedAmountPaise,
      categoryId,
      currentCategorySpentPaise: currentCatSpent,
      budgetPaise: null,
    });

    if (reflection !== null) {
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

      const saveTask = addExpense(householdId, {
        amountPaise: parsedAmountPaise,
        description: description.trim(),
        categoryId,
        paidByUserId: user.uid,
        paidByUserName: userProfile?.displayName ?? 'Me',
        paymentMethod,
        paymentStatus,
        date: Timestamp.fromDate(new Date(date)),
        notes: notes.trim() || undefined,
      });

      setShowReflectionModal(false);
      router.back();

      saveTask.catch((err: any) => {
        console.error('[AddExpense] Background save error:', err);
        Alert.alert('Save Issue', err.message);
      });
    } catch (err: any) {
      Alert.alert('Failed to Save', err.message);
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
        <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>Add Expense</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* 1. Amount Input */}
        <View style={[styles.amountCard, { backgroundColor: theme.colors.surfaceElevated }]}>
          <Text style={[styles.amountLabel, { color: theme.colors.textSecondary }]}>Amount</Text>
          <View style={styles.amountInputRow}>
            <Text style={[styles.currencySymbol, { color: theme.colors.primary }]}>₹</Text>
            <Input
              value={amountRupees}
              onChangeText={setAmountRupees}
              placeholder="0.00"
              placeholderTextColor={formPlaceholderTextColor}
              keyboardType="decimal-pad"
              containerStyle={styles.amountInput}
              inputStyle={{ fontSize: 32, fontWeight: '800', textAlign: 'center', color: formInputTextColor }}
              selectionColor={formCursorColor}
              cursorColor={formCursorColor}
              autoFocus
            />
          </View>
        </View>

        {/* 2. Title / Description Input */}
        <Input
          label="Expense Title / Vendor"
          placeholder="e.g. Weekly Groceries, Electricity Bill"
          placeholderTextColor={formPlaceholderTextColor}
          value={description}
          onChangeText={setDescription}
          inputStyle={{ color: formInputTextColor }}
          selectionColor={formCursorColor}
          cursorColor={formCursorColor}
        />

        {/* 3. Category Selection */}
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
                onPress={() => setCategoryId(cat.id as CategoryId)}
              >
                <CategoryIcon
                  category={cat}
                  iconSize={16}
                  showBackground={false}
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

        {/* 4. Payment Method Selection */}
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
                {(() => {
                  const PaymentIcon = PAYMENT_ICON_MAP[pm.iconName] ?? MoreHorizontal;
                  return (
                    <PaymentIcon
                      size={18}
                      color={isSelected ? theme.colors.primary : theme.colors.textSecondary}
                    />
                  );
                })()}
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

        {/* 5. Payment Status Selection */}
        <Text style={[styles.fieldLabel, { color: theme.colors.textPrimary }]}>Payment Status</Text>
        <View style={styles.statusRow}>
          <TouchableOpacity
            style={[
              styles.statusOption,
              {
                backgroundColor: paymentStatus === 'paid' ? theme.colors.primary : theme.colors.surface,
                borderColor: paymentStatus === 'paid' ? theme.colors.primary : theme.colors.border,
              },
            ]}
            onPress={() => setPaymentStatus('paid')}
            accessibilityRole="button"
            accessibilityLabel="Paid"
          >
            <Check size={16} color={paymentStatus === 'paid' ? '#FFFFFF' : theme.colors.textSecondary} />
            <Text
              style={[
                styles.statusText,
                {
                  color: paymentStatus === 'paid' ? '#FFFFFF' : theme.colors.textPrimary,
                  fontWeight: '700',
                },
              ]}
            >
              Paid
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.statusOption,
              {
                backgroundColor: paymentStatus === 'credit' ? theme.colors.warning : theme.colors.surface,
                borderColor: paymentStatus === 'credit' ? theme.colors.warning : theme.colors.border,
              },
            ]}
            onPress={() => setPaymentStatus('credit')}
            accessibilityRole="button"
            accessibilityLabel="Credit"
          >
            <Clock size={16} color={paymentStatus === 'credit' ? '#FFFFFF' : theme.colors.textSecondary} />
            <Text
              style={[
                styles.statusText,
                {
                  color: paymentStatus === 'credit' ? '#FFFFFF' : theme.colors.textPrimary,
                  fontWeight: '700',
                },
              ]}
            >
              Credit
            </Text>
          </TouchableOpacity>
        </View>

        {/* 6. Optional Notes */}
        <Input
          label="Notes (Optional)"
          placeholder="Add extra context or receipt details..."
          placeholderTextColor={formPlaceholderTextColor}
          value={notes}
          onChangeText={setNotes}
          inputStyle={{ color: formInputTextColor }}
          selectionColor={formCursorColor}
          cursorColor={formCursorColor}
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
        categoryName={getCategoryById(categoryId as CategoryId).label}
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
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  closeButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
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
  statusRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statusOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 14,
  },
});
