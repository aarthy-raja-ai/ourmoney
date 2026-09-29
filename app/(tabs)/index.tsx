// OurMoney — Home Dashboard Screen
// The primary screen. Shows monthly totals, you/partner split,
// category breakdown, budget status, recent expenses, loans summary,
// and a smart insight when relevant.

import React, { useMemo } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../src/context/AuthContext';
import { useHousehold } from '../../src/context/HouseholdContext';
import { useExpenses } from '../../src/hooks/useExpenses';
import { useBudgets } from '../../src/hooks/useBudgets';
import { useLoans } from '../../src/hooks/useLoans';
import { Card } from '../../src/components/Card';
import { AmountDisplay } from '../../src/components/AmountDisplay';
import { ProgressBar } from '../../src/components/ProgressBar';
import { LoadingSpinner } from '../../src/components/LoadingSpinner';
import { ErrorBanner } from '../../src/components/ErrorBanner';
import { CategoryIcon } from '../../src/components/CategoryIcon';
import { Badge } from '../../src/components/Badge';
import {
  calculateTotal,
  calculateByUser,
  aggregateByCategory,
} from '../../src/utils/budgetCalculations';
import { getBudgetStatus, getBudgetPercentage } from '../../src/utils/budgetCalculations';
import { formatDisplayDate, formatMonthDisplay, getCurrentMonth } from '../../src/utils/dateUtils';
import { formatAmount, formatAmountCompact } from '../../src/utils/currency';
import { CATEGORIES, getCategoryById } from '../../src/constants/categories';
import type { CategoryId } from '../../src/constants/categories';
import { generateDashboardInsights } from '../../src/services/spendingInsightsService';
import { TrendingUp, ChevronRight } from 'lucide-react-native';

export default function HomeScreen() {
  const { theme } = useTheme();
  const { firebaseUser } = useAuth();
  const { household, partner, isSolo } = useHousehold();
  const currentMonth = getCurrentMonth();

  const { expenses, isLoading: expensesLoading, error: expensesError, retry } = useExpenses({ month: currentMonth });
  const { budgetsMap, isLoading: budgetsLoading } = useBudgets(currentMonth);
  const { loans, totalOutstandingPaise, activeCount } = useLoans();

  const router = useRouter();

  const isLoading = expensesLoading || budgetsLoading;

  // Calculate totals
  const totalPaise = useMemo(() => calculateTotal(expenses), [expenses]);
  const byUser = useMemo(() => calculateByUser(expenses), [expenses]);
  const byCategory = useMemo(() => aggregateByCategory(expenses), [expenses]);

  const mySpending = firebaseUser ? (byUser[firebaseUser.uid] ?? 0) : 0;
  const partnerSpending = partner ? (byUser[partner.userId] ?? 0) : 0;

  // Top categories
  const topCategories = useMemo(() => {
    return Object.entries(byCategory)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([catId, amount]) => ({
        category: getCategoryById(catId as CategoryId),
        amountPaise: amount,
        percentage: totalPaise > 0 ? Math.round((amount / totalPaise) * 100) : 0,
      }));
  }, [byCategory, totalPaise]);

  // Budget cards
  const budgetSummary = useMemo(() => {
    return Object.entries(budgetsMap).map(([catId, budget]) => {
      const spent = byCategory[catId] ?? 0;
      const status = getBudgetStatus(spent, budget.amountPaise);
      const pct = getBudgetPercentage(spent, budget.amountPaise);
      return { catId: catId as CategoryId, budget, spent, status, pct };
    }).filter(b => b.status !== 'normal').slice(0, 3);
  }, [budgetsMap, byCategory]);

  // Recent expenses
  const recentExpenses = expenses.slice(0, 5);

  // Dashboard insights
  const insights = useMemo(() => generateDashboardInsights({
    currentMonthTotalPaise: totalPaise,
    previousMonthTotalPaise: null, // TODO: load previous month
    categoryTotals: byCategory,
    budgets: Object.fromEntries(Object.entries(budgetsMap).map(([k, v]) => [k, v.amountPaise])),
    activeLoansCount: activeCount,
    totalOutstandingPaise,
    plannedRepaymentThisMonthPaise: 0,
  }), [totalPaise, byCategory, budgetsMap, activeCount, totalOutstandingPaise]);

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
        <LoadingSpinner fullScreen />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={false} onRefresh={retry} tintColor={theme.colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Month header */}
        <View style={styles.monthHeader}>
          <Text style={[styles.monthLabel, { color: theme.colors.textSecondary, fontSize: theme.fontSize.sm }]}>
            {formatMonthDisplay(currentMonth)}
          </Text>
          <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary, fontSize: theme.fontSize.lg, fontWeight: theme.fontWeight.bold }]}>
            Total spending
          </Text>
        </View>

        {expensesError && <ErrorBanner message={expensesError} onRetry={retry} />}

        {/* Monthly Total Card */}
        <Card style={styles.totalCard}>
          <AmountDisplay paise={totalPaise} size="3xl" bold />
          {/* Only show You/Partner split in shared household mode */}
          {!isSolo && (
            <View style={styles.splitRow}>
              {/* You */}
              <View style={styles.splitItem}>
                <Text style={[styles.splitLabel, { color: theme.colors.textSecondary, fontSize: theme.fontSize.xs }]}>You</Text>
                <AmountDisplay paise={mySpending} size="lg" bold color={theme.colors.primary} />
              </View>
              <View style={[styles.splitDivider, { backgroundColor: theme.colors.separator }]} />
              {/* Partner */}
              <View style={styles.splitItem}>
                <Text style={[styles.splitLabel, { color: theme.colors.textSecondary, fontSize: theme.fontSize.xs }]}>
                  {partner?.displayName ?? 'Partner'}
                </Text>
                <AmountDisplay paise={partnerSpending} size="lg" bold color={theme.colors.textSecondary} />
              </View>
            </View>
          )}
        </Card>

        {/* Smart Insight */}
        {insights.length > 0 && (
          <Card style={[styles.insightCard, { backgroundColor: theme.colors.primaryLight, borderColor: theme.colors.primary + '33' }]}>
            <TrendingUp size={16} color={theme.colors.primary} />
            <Text style={[styles.insightText, { color: theme.colors.textPrimary, fontSize: theme.fontSize.sm, flex: 1 }]}>
              {insights[0].message}
            </Text>
          </Card>
        )}

        {/* Category Breakdown */}
        {topCategories.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary, fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.semibold }]}>
              By category
            </Text>
            <Card padding={0}>
              {topCategories.map((item, idx) => (
                <TouchableOpacity
                  key={item.category.id}
                  style={[
                    styles.categoryRow,
                    idx < topCategories.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.colors.separator },
                  ]}
                  onPress={() => router.push(`/(modals)/expense-detail?filter=category&value=${item.category.id}`)}
                  accessibilityRole="button"
                  accessibilityLabel={`${item.category.label}: ${formatAmount(item.amountPaise)}`}
                >
                  <CategoryIcon categoryId={item.category.id} size={36} iconSize={18} />
                  <View style={styles.categoryInfo}>
                    <Text style={[styles.categoryName, { color: theme.colors.textPrimary, fontSize: theme.fontSize.base }]}>
                      {item.category.label}
                    </Text>
                    <ProgressBar
                      percentage={item.percentage}
                      status={getBudgetStatus(item.amountPaise, budgetsMap[item.category.id]?.amountPaise ?? 0)}
                    />
                  </View>
                  <View style={styles.categoryAmount}>
                    <AmountDisplay paise={item.amountPaise} size="sm" bold />
                    <Text style={[styles.categoryPct, { color: theme.colors.textTertiary, fontSize: theme.fontSize.xs }]}>
                      {item.percentage}%
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </Card>
          </View>
        )}

        {/* Budget Alerts */}
        {budgetSummary.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary, fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.semibold }]}>
              Budget alerts
            </Text>
            <View style={styles.budgetCards}>
              {budgetSummary.map((b) => (
                <Card key={b.catId} style={styles.budgetCard} padding={12}>
                  <View style={styles.budgetCardHeader}>
                    <CategoryIcon categoryId={b.catId} size={28} iconSize={14} />
                    <Text style={[{ color: theme.colors.textPrimary, fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.medium, flex: 1 }]}>
                      {getCategoryById(b.catId).label}
                    </Text>
                    <Badge label={`${Math.round(b.pct)}%`} status={b.status} />
                  </View>
                  <ProgressBar percentage={b.pct} status={b.status} />
                  <View style={styles.budgetAmounts}>
                    <AmountDisplay paise={b.spent} size="sm" />
                    <Text style={{ color: theme.colors.textTertiary, fontSize: theme.fontSize.xs }}> of </Text>
                    <AmountDisplay paise={b.budget.amountPaise} size="sm" color={theme.colors.textTertiary} />
                  </View>
                </Card>
              ))}
            </View>
          </View>
        )}

        {/* Recent Expenses */}
        {recentExpenses.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary, fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.semibold }]}>
                Recent
              </Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/transactions')} accessibilityRole="link" accessibilityLabel="See all transactions">
                <Text style={[{ color: theme.colors.primary, fontSize: theme.fontSize.sm }]}>See all</Text>
              </TouchableOpacity>
            </View>
            <Card padding={0}>
              {recentExpenses.map((expense, idx) => {
                const category = getCategoryById(expense.categoryId);
                const isMe = expense.paidByUserId === firebaseUser?.uid;
                const paidByLabel = isMe ? 'You' : (partner?.displayName ?? 'Partner');
                return (
                  <TouchableOpacity
                    key={expense.id}
                    style={[
                      styles.expenseRow,
                      idx < recentExpenses.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.colors.separator },
                    ]}
                    onPress={() => router.push(`/(modals)/expense-detail?id=${expense.id}`)}
                    accessibilityRole="button"
                    accessibilityLabel={`${expense.description}, ${formatAmount(expense.amountPaise)}`}
                  >
                    <CategoryIcon categoryId={expense.categoryId} size={36} iconSize={18} />
                    <View style={styles.expenseInfo}>
                      <Text style={[{ color: theme.colors.textPrimary, fontSize: theme.fontSize.base, fontWeight: theme.fontWeight.medium }]} numberOfLines={1}>
                        {expense.description}
                      </Text>
                      <Text style={[{ color: theme.colors.textSecondary, fontSize: theme.fontSize.xs }]}>
                        {category.label} · {paidByLabel} · {formatDisplayDate(expense.date)}
                      </Text>
                    </View>
                    <AmountDisplay paise={expense.amountPaise} size="sm" bold />
                  </TouchableOpacity>
                );
              })}
            </Card>
          </View>
        )}

        {/* Loans Summary */}
        {activeCount > 0 && (
          <View style={styles.section}>
            <TouchableOpacity
              style={[styles.loanSummaryCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: theme.radii.xl, ...theme.shadow.sm }]}
              onPress={() => router.push('/(tabs)/insights')}
              accessibilityRole="button"
              accessibilityLabel="View loans and commitments"
            >
              <View style={styles.loanSummaryLeft}>
                <Text style={{ fontSize: 24 }}>🏦</Text>
                <View>
                  <Text style={[{ color: theme.colors.textPrimary, fontSize: theme.fontSize.base, fontWeight: theme.fontWeight.semibold }]}>
                    Loans & Commitments
                  </Text>
                  <Text style={[{ color: theme.colors.textSecondary, fontSize: theme.fontSize.sm }]}>
                    {activeCount} active · {formatAmountCompact(totalOutstandingPaise)} outstanding
                  </Text>
                </View>
              </View>
              <ChevronRight size={20} color={theme.colors.textTertiary} />
            </TouchableOpacity>
          </View>
        )}

        {/* Empty state */}
        {expenses.length === 0 && !isLoading && (
          <Card style={styles.emptyCard}>
            <Text style={{ fontSize: 36, textAlign: 'center' }}>💰</Text>
            <Text style={[{ color: theme.colors.textPrimary, fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.semibold, textAlign: 'center' }]}>
              No expenses yet
            </Text>
            <Text style={[{ color: theme.colors.textSecondary, fontSize: theme.fontSize.base, textAlign: 'center' }]}>
              Tap the + button to add your first expense
            </Text>
          </Card>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: 16, gap: 16 },
  monthHeader: { gap: 2 },
  monthLabel: {},
  totalCard: { alignItems: 'center', gap: 16 },
  splitRow: { flexDirection: 'row', width: '100%', gap: 0 },
  splitItem: { flex: 1, alignItems: 'center', gap: 4 },
  splitDivider: { width: 1, marginVertical: 4 },
  splitLabel: { textTransform: 'uppercase', letterSpacing: 0.5 },
  insightCard: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  insightText: { lineHeight: 20 },
  section: { gap: 10 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: {},
  categoryRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  categoryInfo: { flex: 1, gap: 6 },
  categoryName: {},
  categoryAmount: { alignItems: 'flex-end', gap: 2 },
  categoryPct: {},
  budgetCards: { gap: 10 },
  budgetCard: { gap: 8 },
  budgetCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  budgetAmounts: { flexDirection: 'row', alignItems: 'center' },
  expenseRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  expenseInfo: { flex: 1, gap: 3 },
  loanSummaryCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderWidth: 1 },
  loanSummaryLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  emptyCard: { alignItems: 'center', gap: 12, paddingVertical: 32 },
});
