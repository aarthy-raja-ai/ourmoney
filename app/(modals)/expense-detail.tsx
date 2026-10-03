import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../src/context/AuthContext';
import { useHousehold } from '../../src/context/HouseholdContext';
import { deleteExpense, getExpenseById, markExpenseSettled } from '../../src/services/expenseService';
import { CategoryIcon } from '../../src/components/CategoryIcon';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { ConfirmDialog } from '../../src/components/ConfirmDialog';
import { LoadingSpinner } from '../../src/components/LoadingSpinner';
import { getCategoryById } from '../../src/constants/categories';
import { getPaymentMethodById } from '../../src/constants/paymentMethods';
import { formatCurrency } from '../../src/utils/currency';
import { formatDate } from '../../src/utils/dateUtils';
import type { Expense } from '../../src/models/expense';

export default function ExpenseDetailModal() {
  const { theme } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { householdId } = useHousehold();
  const { user } = useAuth();

  const [expense, setExpense] = useState<Expense | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmSettle, setShowConfirmSettle] = useState(false);
  const [isSettling, setIsSettling] = useState(false);

  useEffect(() => {
    if (!householdId || !id) return;
    setIsLoading(true);
    getExpenseById(householdId, id)
      .then((data) => {
        setExpense(data);
        setIsLoading(false);
      })
      .catch((err) => {
        Alert.alert('Error', err.message);
        setIsLoading(false);
      });
  }, [householdId, id]);

  const handleDelete = async () => {
    if (!householdId || !id) return;
    try {
      setIsDeleting(true);
      await deleteExpense(householdId, id);
      setShowConfirmDelete(false);
      router.back();
    } catch (err: any) {
      Alert.alert('Delete Error', err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSettle = async () => {
    if (!householdId || !id || !user) return;
    try {
      setIsSettling(true);
      await markExpenseSettled(householdId, id, user.uid);
      setExpense((prev) => (prev ? { ...prev, paymentStatus: 'paid' } : null));
      setShowConfirmSettle(false);
    } catch (err: any) {
      Alert.alert('Settlement Error', err.message);
    } finally {
      setIsSettling(false);
    }
  };

  if (isLoading || !expense) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <LoadingSpinner message="Loading expense details..." />
      </View>
    );
  }

  const category = getCategoryById(expense.categoryId);
  const paymentMethod = getPaymentMethodById(expense.paymentMethod);
  const isCreditPending = expense.paymentStatus === 'credit';

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.borderLight }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>Expense Detail</Text>
        <TouchableOpacity onPress={() => setShowConfirmDelete(true)} style={styles.closeButton}>
          <Ionicons name="trash-outline" size={22} color={theme.colors.danger} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Category & Amount Hero */}
        <View style={styles.hero}>
          <CategoryIcon category={category} size={32} style={{ marginBottom: 12 }} />
          <Text style={[styles.amount, { color: theme.colors.textPrimary }]}>
            {formatCurrency(expense.amountPaise)}
          </Text>
          <Text style={[styles.title, { color: theme.colors.textSecondary }]}>
            {expense.description}
          </Text>
        </View>

        {/* Info Grid */}
        <Card style={styles.card}>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Category</Text>
            <Text style={[styles.infoValue, { color: theme.colors.textPrimary }]}>
              {category.label}
            </Text>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.colors.borderLight }]} />

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>
              Payment Status
            </Text>
            <Text
              style={[
                styles.infoValue,
                { color: isCreditPending ? theme.colors.warning : theme.colors.success, fontWeight: '700' },
              ]}
            >
              {isCreditPending ? 'Credit (Pending)' : 'Paid'}
            </Text>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.colors.borderLight }]} />

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>
              Payment Method
            </Text>
            <Text style={[styles.infoValue, { color: theme.colors.textPrimary }]}>
              {paymentMethod.label}
            </Text>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.colors.borderLight }]} />

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Date</Text>
            <Text style={[styles.infoValue, { color: theme.colors.textPrimary }]}>
              {formatDate(expense.date)}
            </Text>
          </View>
        </Card>

        {/* Action button for pending credit expense */}
        {isCreditPending && (
          <View style={{ marginBottom: 16 }}>
            <Button
              title="Mark as Settled"
              variant="primary"
              onPress={() => setShowConfirmSettle(true)}
            />
          </View>
        )}

        {/* Notes if any */}
        {expense.notes && (
          <Card style={styles.card}>
            <Text style={[styles.cardTitle, { color: theme.colors.textPrimary }]}>Notes</Text>
            <Text style={[styles.notesText, { color: theme.colors.textSecondary }]}>
              {expense.notes}
            </Text>
          </Card>
        )}
      </ScrollView>

      {/* Confirm Settle Dialog */}
      <ConfirmDialog
        visible={showConfirmSettle}
        title={`Mark ${formatCurrency(expense.amountPaise)} as settled?`}
        message={`"${expense.description}" status will be updated from Credit to Paid.`}
        confirmLabel="Mark as Settled"
        cancelLabel="Cancel"
        onConfirm={handleSettle}
        onCancel={() => setShowConfirmSettle(false)}
        isLoading={isSettling}
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        visible={showConfirmDelete}
        title="Delete Expense"
        message={`Are you sure you want to delete "${expense.description}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDelete}
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
    height: 56,
    borderBottomWidth: 1,
  },
  closeButton: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700' },
  scroll: { flex: 1 },
  content: { padding: 16 },
  hero: { alignItems: 'center', marginVertical: 20 },
  amount: { fontSize: 36, fontWeight: '800', marginBottom: 4 },
  title: { fontSize: 16, fontWeight: '600' },
  card: { padding: 16, marginBottom: 16 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  infoLabel: { fontSize: 14, fontWeight: '500' },
  infoValue: { fontSize: 14, fontWeight: '700' },
  divider: { height: 1, marginVertical: 10 },
  cardTitle: { fontSize: 15, fontWeight: '700', marginBottom: 12 },
  splitRow: { flexDirection: 'row', justifyContent: 'space-between' },
  splitUser: { fontSize: 12, marginBottom: 2 },
  splitAmount: { fontSize: 16, fontWeight: '700' },
  notesText: { fontSize: 14, lineHeight: 20 },
});
