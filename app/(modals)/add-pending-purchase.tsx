// OurMoney — Add Pending Purchase Modal
// Screen for creating short-term household purchases awaiting settlement.

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Timestamp } from 'firebase/firestore';
import { useTheme } from '../../src/context/ThemeContext';
import { useHousehold } from '../../src/context/HouseholdContext';
import { addPendingPurchase } from '../../src/services/pendingPurchaseService';
import { CATEGORIES } from '../../src/constants/categories';
import type { CategoryId } from '../../src/constants/categories';
import { CategoryIcon } from '../../src/components/CategoryIcon';
import { X, Calendar as CalendarIcon, Store, Tag, FileText } from 'lucide-react-native';
import { parseRupeeInput } from '../../src/utils/currency';

type DueDateOption = 'today' | 'tomorrow' | '3days' | 'nextWeek';

export default function AddPendingPurchaseScreen() {
  const { theme } = useTheme();
  const { householdId } = useHousehold();
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [amountRupees, setAmountRupees] = useState('');
  const [merchantOrPerson, setMerchantOrPerson] = useState('');
  const [category, setCategory] = useState<CategoryId>('groceries');
  const [dueDateOption, setDueDateOption] = useState<DueDateOption>('tomorrow');
  const [notes, setNotes] = useState('');
  const [createExpenseOnSettle, setCreateExpenseOnSettle] = useState(true);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const getDueDate = (opt: DueDateOption): Date => {
    const d = new Date();
    d.setHours(23, 59, 59, 999);
    if (opt === 'tomorrow') d.setDate(d.getDate() + 1);
    if (opt === '3days') d.setDate(d.getDate() + 3);
    if (opt === 'nextWeek') d.setDate(d.getDate() + 7);
    return d;
  };

  const handleSubmit = async () => {
    if (!householdId) {
      setErrorMessage('Household workspace unavailable');
      return;
    }

    if (!title.trim()) {
      setErrorMessage('Please enter what was bought');
      return;
    }

    const paise = parseRupeeInput(amountRupees);
    if (isNaN(paise) || paise <= 0) {
      setErrorMessage('Please enter a valid positive amount');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const dueDate = getDueDate(dueDateOption);

      const saveTask = addPendingPurchase(householdId, {
        amountMinor: paise,
        title: title.trim(),
        category,
        merchantOrPerson: merchantOrPerson.trim() || 'Local merchant',
        dueDate: Timestamp.fromDate(dueDate),
        notes: notes.trim(),
        createExpenseOnSettle,
      });

      router.back();

      saveTask.catch((err) => {
        console.error('[AddPendingPurchase] Background save error:', err);
      });
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to add pending purchase');
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.colors.separator }]}>
            <View>
              <Text style={[styles.headerTitle, { color: theme.colors.textPrimary, fontSize: theme.fontSize.lg, fontWeight: theme.fontWeight.bold }]}>
                Add Pending Purchase
              </Text>
              <Text style={[{ color: theme.colors.textSecondary, fontSize: theme.fontSize.xs }]}>
                Short-term household item to settle later
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => router.back()}
              style={[styles.closeButton, { backgroundColor: theme.colors.surfaceElevated }]}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <X size={20} color={theme.colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            {errorMessage && (
              <View style={[styles.errorBox, { backgroundColor: theme.colors.dangerLight, borderColor: theme.colors.danger }]}>
                <Text style={[styles.errorText, { color: theme.colors.danger, fontSize: theme.fontSize.sm }]}>
                  {errorMessage}
                </Text>
              </View>
            )}

            {/* Title / What was bought */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: theme.colors.textPrimary, fontSize: theme.fontSize.sm }]}>
                What was bought? *
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                    color: theme.colors.textPrimary,
                    fontSize: theme.fontSize.base,
                  },
                ]}
                placeholder="e.g. Milk + Eggs"
                placeholderTextColor={theme.colors.textTertiary}
                value={title}
                onChangeText={setTitle}
                autoFocus
              />
            </View>

            {/* Amount */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { color: theme.colors.textPrimary, fontSize: theme.fontSize.sm }]}>
                Amount (₹) *
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                    color: theme.colors.textPrimary,
                    fontSize: theme.fontSize.xl,
                    fontWeight: theme.fontWeight.bold,
                  },
                ]}
                placeholder="130"
                placeholderTextColor={theme.colors.textTertiary}
                keyboardType="decimal-pad"
                value={amountRupees}
                onChangeText={setAmountRupees}
              />
            </View>

            {/* Merchant / Person */}
            <View style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <Store size={14} color={theme.colors.textSecondary} />
                <Text style={[styles.label, { color: theme.colors.textPrimary, fontSize: theme.fontSize.sm }]}>
                  Store / Person
                </Text>
              </View>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                    color: theme.colors.textPrimary,
                    fontSize: theme.fontSize.base,
                  },
                ]}
                placeholder="e.g. Local shop / Vegetable vendor"
                placeholderTextColor={theme.colors.textTertiary}
                value={merchantOrPerson}
                onChangeText={setMerchantOrPerson}
              />
            </View>

            {/* Category */}
            <View style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <Tag size={14} color={theme.colors.textSecondary} />
                <Text style={[styles.label, { color: theme.colors.textPrimary, fontSize: theme.fontSize.sm }]}>
                  Category
                </Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryChips}>
                {CATEGORIES.map((cat) => {
                  const isSelected = category === cat.id;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[
                        styles.categoryChip,
                        {
                          backgroundColor: isSelected ? theme.colors.primaryLight : theme.colors.surface,
                          borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                        },
                      ]}
                      onPress={() => setCategory(cat.id)}
                    >
                      <CategoryIcon categoryId={cat.id} size={24} iconSize={12} />
                      <Text
                        style={[
                          styles.categoryChipText,
                          {
                            color: isSelected ? theme.colors.primary : theme.colors.textSecondary,
                            fontSize: theme.fontSize.xs,
                            fontWeight: isSelected ? theme.fontWeight.bold : theme.fontWeight.regular,
                          },
                        ]}
                      >
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Due Date Presets */}
            <View style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <CalendarIcon size={14} color={theme.colors.textSecondary} />
                <Text style={[styles.label, { color: theme.colors.textPrimary, fontSize: theme.fontSize.sm }]}>
                  Due Date
                </Text>
              </View>
              <View style={styles.dueDateRow}>
                {(
                  [
                    { id: 'today', label: 'Today' },
                    { id: 'tomorrow', label: 'Tomorrow' },
                    { id: '3days', label: 'In 3 Days' },
                    { id: 'nextWeek', label: 'Next Week' },
                  ] as const
                ).map((item) => {
                  const active = dueDateOption === item.id;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.dueDateChip,
                        {
                          backgroundColor: active ? theme.colors.primary : theme.colors.surface,
                          borderColor: active ? theme.colors.primary : theme.colors.border,
                        },
                      ]}
                      onPress={() => setDueDateOption(item.id)}
                    >
                      <Text
                        style={[
                          styles.dueDateChipText,
                          {
                            color: active ? '#FFFFFF' : theme.colors.textSecondary,
                            fontSize: theme.fontSize.xs,
                            fontWeight: active ? theme.fontWeight.semibold : theme.fontWeight.regular,
                          },
                        ]}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Option: Create Expense on Settle */}
            <View style={[styles.toggleRow, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={[{ color: theme.colors.textPrimary, fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.medium }]}>
                  Record as Expense on Settle
                </Text>
                <Text style={[{ color: theme.colors.textSecondary, fontSize: theme.fontSize.xs }]}>
                  Automatically add to Household Expenses when marked settled
                </Text>
              </View>
              <Switch
                value={createExpenseOnSettle}
                onValueChange={setCreateExpenseOnSettle}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
              />
            </View>

            {/* Notes */}
            <View style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <FileText size={14} color={theme.colors.textSecondary} />
                <Text style={[styles.label, { color: theme.colors.textPrimary, fontSize: theme.fontSize.sm }]}>
                  Notes (Optional)
                </Text>
              </View>
              <TextInput
                style={[
                  styles.input,
                  styles.multilineInput,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                    color: theme.colors.textPrimary,
                    fontSize: theme.fontSize.base,
                  },
                ]}
                placeholder="Add any helpful notes..."
                placeholderTextColor={theme.colors.textTertiary}
                multiline
                numberOfLines={3}
                value={notes}
                onChangeText={setNotes}
              />
            </View>
          </ScrollView>

          {/* Submit Action */}
          <View style={[styles.footer, { borderTopColor: theme.colors.separator }]}>
            <TouchableOpacity
              style={[
                styles.submitButton,
                { backgroundColor: theme.colors.primary },
                isLoading && { opacity: 0.7 },
              ]}
              onPress={handleSubmit}
              disabled={isLoading}
              accessibilityRole="button"
              accessibilityLabel="Save Pending Purchase"
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={[styles.submitButtonText, { fontSize: theme.fontSize.base, fontWeight: theme.fontWeight.bold }]}>
                  Save Pending Purchase
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {},
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: { padding: 16, gap: 18 },
  errorBox: { padding: 12, borderRadius: 12, borderWidth: 1 },
  errorText: {},
  fieldGroup: { gap: 8 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  label: { fontWeight: '500' },
  input: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  categoryChips: { gap: 8, paddingVertical: 4 },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryChipText: {},
  dueDateRow: { flexDirection: 'row', gap: 8 },
  dueDateChip: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
  },
  dueDateChipText: {},
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  footer: { padding: 16, borderTopWidth: 1 },
  submitButton: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: { color: '#FFFFFF' },
});
