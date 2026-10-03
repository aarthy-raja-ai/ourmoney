// OurMoney — Pending Purchases Screen
// Dedicated view for tracking active household pending purchases awaiting settlement.

import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { Timestamp } from 'firebase/firestore';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../src/context/AuthContext';
import { useHousehold } from '../../src/context/HouseholdContext';
import { usePendingPurchases } from '../../src/hooks/usePendingPurchases';
import { markPendingPurchaseSettled, deletePendingPurchase } from '../../src/services/pendingPurchaseService';
import type { PendingPurchase } from '../../src/models/pendingPurchase';
import { PAYMENT_METHODS } from '../../src/constants/paymentMethods';
import type { PaymentMethodId } from '../../src/constants/paymentMethods';
import { AmountDisplay } from '../../src/components/AmountDisplay';
import { CategoryIcon } from '../../src/components/CategoryIcon';
import { Card } from '../../src/components/Card';
import {
  X,
  Plus,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Store,
  Calendar as CalendarIcon,
  Trash2,
} from 'lucide-react-native';
import { formatAmount } from '../../src/utils/currency';

function formatDueDateLabel(dueDate: Timestamp | Date): { label: string; isOverdue: boolean } {
  const dateObj = dueDate instanceof Timestamp ? dueDate.toDate() : new Date(dueDate);
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const dueStart = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate()).getTime();

  const diffDays = Math.round((dueStart - todayStart) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { label: `Due ${Math.abs(diffDays)} day${Math.abs(diffDays) > 1 ? 's' : ''} ago`, isOverdue: true };
  } else if (diffDays === 0) {
    return { label: 'Due today', isOverdue: false };
  } else if (diffDays === 1) {
    return { label: 'Due tomorrow', isOverdue: false };
  } else {
    return { label: `Due in ${diffDays} days`, isOverdue: false };
  }
}

function formatSettledDate(settledAt?: Timestamp | null): string {
  if (!settledAt) return 'Recently';
  const d = settledAt instanceof Timestamp ? settledAt.toDate() : new Date(settledAt);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return 'Today';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export default function PendingPurchasesScreen() {
  const { theme } = useTheme();
  const { firebaseUser } = useAuth();
  const { householdId, partner } = useHousehold();
  const router = useRouter();

  const { activePending, settledPending, totalPendingMinor, isLoading, error: _error, retry } = usePendingPurchases();

  const [settleTarget, setSettleTarget] = useState<PendingPurchase | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethodId>('cash');
  const [isSettling, setIsSettling] = useState(false);
  const [settleError, setSettleError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<PendingPurchase | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirmSettle = async () => {
    if (!settleTarget || !householdId || !firebaseUser) return;

    setIsSettling(true);
    setSettleError(null);

    try {
      await markPendingPurchaseSettled({
        householdId,
        pendingPurchaseId: settleTarget.id,
        userId: firebaseUser.uid,
        paymentMethod: selectedPaymentMethod,
        createExpense: settleTarget.createExpenseOnSettle ?? true,
      });

      setSettleTarget(null);
    } catch (err) {
      setSettleError(err instanceof Error ? err.message : 'Failed to mark as settled');
    } finally {
      setIsSettling(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget || !householdId) return;
    setIsDeleting(true);
    try {
      await deletePendingPurchase(householdId, deleteTarget.id);
      setDeleteTarget(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <View style={styles.container}>
        {/* Top Header */}
        <View style={[styles.header, { borderBottomColor: theme.colors.separator }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.headerTitle, { color: theme.colors.textPrimary, fontSize: theme.fontSize.xl, fontWeight: theme.fontWeight.bold }]}>
              Pending Purchases
            </Text>
            <Text style={[{ color: theme.colors.textSecondary, fontSize: theme.fontSize.xs }]}>
              {activePending.length} item{activePending.length === 1 ? '' : 's'} awaiting settlement
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => router.push('/(modals)/add-pending-purchase' as Href)}
            accessibilityRole="button"
            accessibilityLabel="Add pending purchase"
          >
            <Plus size={20} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.closeButton, { backgroundColor: theme.colors.surfaceElevated }]}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Close screen"
          >
            <X size={20} color={theme.colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={<RefreshControl refreshing={false} onRefresh={retry} tintColor={theme.colors.primary} />}
          showsVerticalScrollIndicator={false}
        >
          {/* Total Pending Summary Hero */}
          {activePending.length > 0 && (
            <Card style={styles.summaryCard} padding={16}>
              <View style={styles.summaryHeader}>
                <Clock size={18} color={theme.colors.warning} />
                <Text style={[{ color: theme.colors.textSecondary, fontSize: theme.fontSize.xs, fontWeight: theme.fontWeight.semibold, letterSpacing: 0.5 }]}>
                  TOTAL PENDING SETTLEMENT
                </Text>
              </View>
              <AmountDisplay paise={totalPendingMinor} size="3xl" bold color={theme.colors.textPrimary} />
              <Text style={[{ color: theme.colors.textTertiary, fontSize: theme.fontSize.xs }]}>
                Items waiting for payment to merchant or vendor
              </Text>
            </Card>
          )}

          {/* Active Items Section */}
          {activePending.length > 0 ? (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary, fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.semibold }]}>
                Active Pending Items
              </Text>

              {activePending.map((item) => {
                const dueInfo = formatDueDateLabel(item.dueDate);
                const isMyPurchase = item.createdBy === firebaseUser?.uid;

                return (
                  <Card key={item.id} style={styles.itemCard} padding={16}>
                    <View style={styles.itemTopRow}>
                      <CategoryIcon categoryId={item.category} size={40} iconSize={20} />
                      <View style={{ flex: 1, gap: 2 }}>
                        <Text style={[{ color: theme.colors.textPrimary, fontSize: theme.fontSize.base, fontWeight: theme.fontWeight.bold }]} numberOfLines={1}>
                          {item.title}
                        </Text>
                        <View style={styles.merchantRow}>
                          <Store size={12} color={theme.colors.textTertiary} />
                          <Text style={[{ color: theme.colors.textSecondary, fontSize: theme.fontSize.xs }]}>
                            {item.merchantOrPerson}
                          </Text>
                        </View>
                      </View>
                      <View style={{ alignItems: 'flex-end', gap: 2 }}>
                        <AmountDisplay paise={item.amountMinor} size="lg" bold />
                      </View>
                    </View>

                    {/* Metadata & Overdue bar */}
                    <View style={styles.itemMetaRow}>
                      <View style={styles.dueDateBadge}>
                        <CalendarIcon size={12} color={dueInfo.isOverdue ? theme.colors.warning : theme.colors.textTertiary} />
                        <Text
                          style={[
                            styles.dueDateText,
                            {
                              color: dueInfo.isOverdue ? theme.colors.warning : theme.colors.textSecondary,
                              fontSize: theme.fontSize.xs,
                              fontWeight: dueInfo.isOverdue ? theme.fontWeight.bold : theme.fontWeight.regular,
                            },
                          ]}
                        >
                          {dueInfo.label}
                        </Text>
                      </View>

                      {dueInfo.isOverdue && (
                        <View style={[styles.overdueChip, { backgroundColor: theme.colors.warningLight }]}>
                          <AlertTriangle size={12} color={theme.colors.warning} />
                          <Text style={{ color: theme.colors.warning, fontSize: theme.fontSize.xs, fontWeight: theme.fontWeight.semibold }}>
                            Overdue
                          </Text>
                        </View>
                      )}

                      <Text style={[{ color: theme.colors.textTertiary, fontSize: theme.fontSize.xs, marginLeft: 'auto' }]}>
                        Added by {isMyPurchase ? 'You' : (partner?.displayName ?? 'Partner')}
                      </Text>
                    </View>

                    {item.notes ? (
                      <Text style={[styles.notesText, { color: theme.colors.textSecondary, fontSize: theme.fontSize.xs }]}>
                        "{item.notes}"
                      </Text>
                    ) : null}

                    {/* Action Bar */}
                    <View style={styles.itemActions}>
                      <TouchableOpacity
                        style={[styles.settleButton, { backgroundColor: theme.colors.primary }]}
                        onPress={() => setSettleTarget(item)}
                        accessibilityRole="button"
                        accessibilityLabel={`Mark ${item.title} as settled`}
                      >
                        <CheckCircle2 size={16} color="#FFFFFF" />
                        <Text style={[styles.settleButtonText, { fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.bold }]}>
                          Mark as Settled
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.trashIconButton, { backgroundColor: theme.colors.surfaceElevated }]}
                        onPress={() => setDeleteTarget(item)}
                        accessibilityRole="button"
                        accessibilityLabel="Delete pending item"
                      >
                        <Trash2 size={16} color={theme.colors.textTertiary} />
                      </TouchableOpacity>
                    </View>
                  </Card>
                );
              })}
            </View>
          ) : (
            !isLoading && (
              <Card style={styles.emptyCard} padding={32}>
                <CheckCircle2 size={44} color={theme.colors.success} />
                <Text style={[{ color: theme.colors.textPrimary, fontSize: theme.fontSize.lg, fontWeight: theme.fontWeight.bold, textAlign: 'center' }]}>
                  Nothing pending
                </Text>
                <Text style={[{ color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, textAlign: 'center' }]}>
                  All household purchases are settled. Tap + to add a new credit or store item.
                </Text>
              </Card>
            )
          )}

          {/* Recently Settled History */}
          {settledPending.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.semibold }]}>
                Recently Settled
              </Text>
              <Card padding={0}>
                {settledPending.slice(0, 5).map((item, idx) => (
                  <View
                    key={item.id}
                    style={[
                      styles.settledRow,
                      idx < Math.min(5, settledPending.length) - 1 && { borderBottomWidth: 1, borderBottomColor: theme.colors.separator },
                    ]}
                  >
                    <View style={[styles.settledIconBg, { backgroundColor: theme.colors.successLight }]}>
                      <CheckCircle2 size={18} color={theme.colors.success} />
                    </View>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={[{ color: theme.colors.textPrimary, fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.medium }]}>
                        {item.title}
                      </Text>
                      <Text style={[{ color: theme.colors.textTertiary, fontSize: theme.fontSize.xs }]}>
                        {item.merchantOrPerson} · Settled {formatSettledDate(item.settledAt)}
                      </Text>
                    </View>
                    <AmountDisplay paise={item.amountMinor} size="sm" color={theme.colors.textSecondary} />
                  </View>
                ))}
              </Card>
            </View>
          )}
        </ScrollView>
      </View>

      {/* Settle Confirmation Modal Dialog */}
      <Modal
        visible={!!settleTarget}
        transparent
        animationType="fade"
        onRequestClose={() => setSettleTarget(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.dialogCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <View style={styles.dialogHeader}>
              <CheckCircle2 size={24} color={theme.colors.success} />
              <Text style={[styles.dialogTitle, { color: theme.colors.textPrimary, fontSize: theme.fontSize.lg, fontWeight: theme.fontWeight.bold }]}>
                Mark {settleTarget ? formatAmount(settleTarget.amountMinor) : ''} as settled?
              </Text>
            </View>

            <Text style={[{ color: theme.colors.textSecondary, fontSize: theme.fontSize.sm }]}>
              "{settleTarget?.title}" at {settleTarget?.merchantOrPerson} will be marked as settled.
            </Text>

            {/* Payment Method Selector */}
            <View style={{ gap: 6, marginVertical: 8 }}>
              <Text style={[{ color: theme.colors.textSecondary, fontSize: theme.fontSize.xs, fontWeight: theme.fontWeight.medium }]}>
                Payment Method Used
              </Text>
              <View style={styles.paymentMethodsRow}>
                {PAYMENT_METHODS.map((pm) => {
                  const isSel = selectedPaymentMethod === pm.id;
                  return (
                    <TouchableOpacity
                      key={pm.id}
                      style={[
                        styles.paymentChip,
                        {
                          backgroundColor: isSel ? theme.colors.primaryLight : theme.colors.surfaceElevated,
                          borderColor: isSel ? theme.colors.primary : theme.colors.border,
                        },
                      ]}
                      onPress={() => setSelectedPaymentMethod(pm.id)}
                    >
                      <Text
                        style={[
                          styles.paymentChipText,
                          { color: isSel ? theme.colors.primary : theme.colors.textSecondary, fontSize: theme.fontSize.xs },
                        ]}
                      >
                        {pm.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {settleError && (
              <Text style={{ color: theme.colors.danger, fontSize: theme.fontSize.xs }}>
                {settleError}
              </Text>
            )}

            <View style={styles.dialogButtons}>
              <TouchableOpacity
                style={[styles.dialogButton, { backgroundColor: theme.colors.surfaceElevated }]}
                onPress={() => setSettleTarget(null)}
                disabled={isSettling}
              >
                <Text style={[{ color: theme.colors.textPrimary, fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.medium }]}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.dialogButton, { backgroundColor: theme.colors.primary }]}
                onPress={handleConfirmSettle}
                disabled={isSettling}
              >
                {isSettling ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={[styles.dialogButtonText, { fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.bold }]}>
                    Mark as Settled
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={!!deleteTarget}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteTarget(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.dialogCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <Text style={[styles.dialogTitle, { color: theme.colors.textPrimary, fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.bold }]}>
              Delete Pending Purchase?
            </Text>
            <Text style={[{ color: theme.colors.textSecondary, fontSize: theme.fontSize.sm }]}>
              Are you sure you want to remove "{deleteTarget?.title}"?
            </Text>
            <View style={styles.dialogButtons}>
              <TouchableOpacity
                style={[styles.dialogButton, { backgroundColor: theme.colors.surfaceElevated }]}
                onPress={() => setDeleteTarget(null)}
              >
                <Text style={[{ color: theme.colors.textPrimary, fontSize: theme.fontSize.sm }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.dialogButton, { backgroundColor: theme.colors.danger }]}
                onPress={handleDelete}
                disabled={isDeleting}
              >
                <Text style={[styles.dialogButtonText, { fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.bold }]}>
                  Delete
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    gap: 10,
  },
  headerTitle: {},
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: { padding: 16, gap: 16 },
  summaryCard: { gap: 8, borderRadius: 16 },
  summaryHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  section: { gap: 10 },
  sectionTitle: {},
  itemCard: { gap: 12, borderRadius: 16 },
  itemTopRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  merchantRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  itemMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dueDateBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dueDateText: {},
  overdueChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  notesText: { fontStyle: 'italic' },
  itemActions: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  settleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 12,
  },
  settleButtonText: { color: '#FFFFFF' },
  trashIconButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCard: { alignItems: 'center', gap: 12, borderRadius: 20 },
  settledRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  settledIconBg: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dialogCard: { width: '100%', padding: 20, borderRadius: 20, borderWidth: 1, gap: 14 },
  dialogHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dialogTitle: {},
  paymentMethodsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  paymentChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1 },
  paymentChipText: {},
  dialogButtons: { flexDirection: 'row', gap: 10, marginTop: 6 },
  dialogButton: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  dialogButtonText: { color: '#FFFFFF' },
});
