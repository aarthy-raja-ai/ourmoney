// OurMoney — Manage Budgets Modal
// Set, update, or remove monthly category budgets for the active household.

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/context/ThemeContext';
import { useHousehold } from '../../src/context/HouseholdContext';
import { useBudgets } from '../../src/hooks/useBudgets';
import { setBudget, deleteBudget } from '../../src/services/budgetService';
import { CategoryIcon } from '../../src/components/CategoryIcon';
import { Input } from '../../src/components/Input';
import { Button } from '../../src/components/Button';
import { LoadingSpinner } from '../../src/components/LoadingSpinner';
import { CATEGORIES } from '../../src/constants/categories';
import { formatCurrency, rupeesToPaise, paiseToRupees } from '../../src/utils/currency';
import { getCurrentMonth } from '../../src/utils/dateUtils';

export default function ManageBudgetsModal() {
  const { theme } = useTheme();
  const router = useRouter();
  const { householdId } = useHousehold();
  const currentMonth = getCurrentMonth();
  const { budgets, isLoading, refresh } = useBudgets(currentMonth);

  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [budgetRupees, setBudgetRupees] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  const handleOpenEdit = (catId: string, existingAmountPaise?: number) => {
    setEditingCategoryId(catId);
    setBudgetRupees(existingAmountPaise ? paiseToRupees(existingAmountPaise).toString() : '');
  };

  const handleSaveBudget = async () => {
    if (!editingCategoryId || !householdId) return;

    const val = parseFloat(budgetRupees);
    if (isNaN(val) || val < 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid monthly budget amount.');
      return;
    }

    try {
      setIsSaving(true);
      if (val === 0) {
        const existing = budgets.find((b) => b.categoryId === editingCategoryId);
        if (existing) await deleteBudget(householdId, existing.id);
      } else {
        await setBudget(householdId, {
          categoryId: editingCategoryId as any,
          month: currentMonth,
          amountPaise: rupeesToPaise(val),
        });
      }
      setEditingCategoryId(null);
      refresh();
    } catch (err: any) {
      Alert.alert('Error Saving Budget', err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.borderLight }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>
          Manage Budgets ({currentMonth})
        </Text>
        <View style={{ width: 36 }} />
      </View>

      {isLoading ? (
        <LoadingSpinner message="Loading monthly budgets..." />
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
          <Text style={[styles.subtext, { color: theme.colors.textSecondary }]}>
            Set target spending limits for household categories for this month.
          </Text>

          {CATEGORIES.map((cat) => {
            const budget = budgets.find((b) => b.categoryId === cat.id);
            const isEditing = editingCategoryId === cat.id;

            return (
              <View
                key={cat.id}
                style={[styles.categoryCard, { backgroundColor: theme.colors.surface }]}
              >
                <View style={styles.cardMain}>
                  <CategoryIcon category={cat} size={24} style={{ marginRight: 12 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.categoryName, { color: theme.colors.textPrimary }]}>
                      {cat.label}
                    </Text>
                    <Text style={[styles.budgetStatusText, { color: theme.colors.textSecondary }]}>
                      {budget ? formatCurrency(budget.amountPaise) : 'No target set'}
                    </Text>
                  </View>

                  {!isEditing && (
                    <Button
                      title={budget ? 'Edit' : 'Set Budget'}
                      variant={budget ? 'outline' : 'primary'}
                      size="sm"
                      onPress={() => handleOpenEdit(cat.id, budget?.amountPaise)}
                    />
                  )}
                </View>

                {/* Inline Editing Drawer */}
                {isEditing && (
                  <View style={[styles.editDrawer, { backgroundColor: theme.colors.background }]}>
                    <Text style={[styles.inputLabel, { color: theme.colors.textSecondary }]}>
                      Monthly limit (₹)
                    </Text>
                    <View style={styles.editRow}>
                      <Input
                        value={budgetRupees}
                        onChangeText={setBudgetRupees}
                        placeholder="0"
                        keyboardType="numeric"
                        style={{ flex: 1, marginBottom: 0, marginRight: 8 }}
                      />
                      <Button
                        title="Save"
                        variant="primary"
                        size="sm"
                        loading={isSaving}
                        onPress={handleSaveBudget}
                        style={{ marginRight: 4 }}
                      />
                      <Button
                        title="Cancel"
                        variant="ghost"
                        size="sm"
                        onPress={() => setEditingCategoryId(null)}
                      />
                    </View>
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}
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
  subtext: { fontSize: 13, marginBottom: 16, lineHeight: 18 },
  categoryCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 10,
  },
  cardMain: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryName: { fontSize: 15, fontWeight: '700' },
  budgetStatusText: { fontSize: 12, marginTop: 2 },
  editDrawer: {
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
  },
  inputLabel: { fontSize: 11, fontWeight: '600', marginBottom: 4 },
  editRow: { flexDirection: 'row', alignItems: 'center' },
});
