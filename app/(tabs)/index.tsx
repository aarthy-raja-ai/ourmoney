// OurMoney — Home Dashboard Screen (V2 Redesign)
// Household-first finance dashboard.
// Displays monthly totals, budget pace, daily average, pending items,
// smart spending reflections, trends, category breakdown, loans, and recent transactions.

import React, { useState, useMemo } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../src/context/AuthContext';
import { useHousehold } from '../../src/context/HouseholdContext';
import { useExpenses } from '../../src/hooks/useExpenses';
import { useBudgets } from '../../src/hooks/useBudgets';
import { useLoans } from '../../src/hooks/useLoans';
import { markExpenseSettled } from '../../src/services/expenseService';
import { ConfirmDialog } from '../../src/components/ConfirmDialog';
import type { Expense } from '../../src/models/expense';
import type { Budget } from '../../src/models/budget';
import { Card } from '../../src/components/Card';
import { AmountDisplay } from '../../src/components/AmountDisplay';
import { ProgressBar } from '../../src/components/ProgressBar';
import { SkeletonDashboard } from '../../src/components/SkeletonLoader';
import { ErrorBanner } from '../../src/components/ErrorBanner';
import { CategoryIcon } from '../../src/components/CategoryIcon';
import { Badge } from '../../src/components/Badge';
import {
  calculateTotal,
  aggregateByCategory,
  getBudgetStatus,
  getBudgetPercentage,
} from '../../src/utils/budgetCalculations';
import { formatDisplayDate, formatMonthDisplay, getCurrentMonth } from '../../src/utils/dateUtils';
import { formatAmount, formatAmountCompact } from '../../src/utils/currency';
import { getCategoryById } from '../../src/constants/categories';
import type { CategoryId } from '../../src/constants/categories';
import { generateDashboardInsights } from '../../src/services/spendingInsightsService';
import {
  TrendingUp,
  ChevronRight,
  Plus,
  Landmark,
  Sparkles,
  Calendar,
  AlertCircle,
  CheckCircle,
  PieChart,
  Activity,
  ArrowUpRight,
  Clock,
} from 'lucide-react-native';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning 👋';
  if (hour < 17) return 'Good afternoon 👋';
  return 'Good evening 👋';
}

export default function HomeScreen() {
  const { theme } = useTheme();
  const { firebaseUser } = useAuth();
  const { householdId } = useHousehold();
  const currentMonth = getCurrentMonth();

  const { expenses, isLoading: expensesLoading, error: expensesError, retry } = useExpenses({ month: currentMonth });
  const { budgetsMap, isLoading: budgetsLoading } = useBudgets(currentMonth);
  const { loans: _loans, totalOutstandingPaise, activeCount } = useLoans();
  const [settleTarget, setSettleTarget] = useState<Expense | null>(null);
  const [isSettling, setIsSettling] = useState(false);

  const router = useRouter();

  const isLoading = expensesLoading || budgetsLoading;

  // Filter pending credit expenses
  const pendingCreditExpenses = useMemo(() => {
    return expenses.filter((e: Expense) => e.paymentStatus === 'credit');
  }, [expenses]);

  const totalPendingPaise = useMemo(() => {
    return pendingCreditExpenses.reduce((sum: number, e: Expense) => sum + e.amountPaise, 0);
  }, [pendingCreditExpenses]);

  const handleConfirmSettleExpense = async () => {
    if (!settleTarget || !householdId || !firebaseUser) return;
    try {
      setIsSettling(true);
      await markExpenseSettled(householdId, settleTarget.id, firebaseUser.uid);
      setSettleTarget(null);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setIsSettling(false);
    }
  };

  // Calculate totals
  const totalPaise = useMemo(() => calculateTotal(expenses), [expenses]);
  const byCategory = useMemo(() => aggregateByCategory(expenses), [expenses]);

  // Total overall household budget set
  const totalBudgetPaise = useMemo(() => {
    return Object.values(budgetsMap).reduce((sum: number, b: Budget | undefined) => sum + (b?.amountPaise ?? 0), 0);
  }, [budgetsMap]);

  // Daily Average
  const currentDayOfMonth = useMemo(() => new Date().getDate(), []);
  const daysInCurrentMonth = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  }, []);

  const dailyAvgPaise = useMemo(() => {
    if (currentDayOfMonth <= 0) return 0;
    return Math.round(totalPaise / currentDayOfMonth);
  }, [totalPaise, currentDayOfMonth]);

  // Month & Budget Pace
  const monthProgressPct = useMemo(() => {
    return Math.round((currentDayOfMonth / daysInCurrentMonth) * 100);
  }, [currentDayOfMonth, daysInCurrentMonth]);

  const budgetUsedPct = useMemo(() => {
    if (totalBudgetPaise <= 0) return 0;
    return getBudgetPercentage(totalPaise, totalBudgetPaise);
  }, [totalPaise, totalBudgetPaise]);

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

  // Budget cards (warnings/alerts)
  const budgetSummary = useMemo(() => {
    return Object.entries(budgetsMap).map(([catId, budget]: [string, Budget]) => {
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
    previousMonthTotalPaise: null,
    categoryTotals: byCategory,
    budgets: Object.fromEntries(Object.entries(budgetsMap).map(([k, v]: [string, Budget]) => [k, v.amountPaise])),
    activeLoansCount: activeCount,
    totalOutstandingPaise,
    plannedRepaymentThisMonthPaise: 0,
  }), [totalPaise, byCategory, budgetsMap, activeCount, totalOutstandingPaise]);

  const greeting = getGreeting();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={<RefreshControl refreshing={false} onRefresh={retry} tintColor={theme.colors.primary} />}
          showsVerticalScrollIndicator={false}
        >
          {/* 1. Header */}
          <View style={styles.header}>
            <View style={styles.headerTopRow}>
              <View style={[styles.monthBadge, { backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.border }]}>
                <Calendar size={12} color={theme.colors.textSecondary} />
                <Text style={[styles.monthBadgeText, { color: theme.colors.textSecondary, fontSize: theme.fontSize.xs }]}>
                  {formatMonthDisplay(currentMonth)}
                </Text>
              </View>

              {pendingCreditExpenses.length > 0 && (
                <View
                  style={[
                    styles.headerPendingButton,
                    {
                      backgroundColor: theme.colors.warningLight,
                      borderColor: theme.colors.warning,
                    },
                  ]}
                >
                  <Clock size={13} color={theme.colors.warning} />
                  <Text
                    style={{
                      color: theme.colors.warning,
                      fontSize: theme.fontSize.xs,
                      fontWeight: theme.fontWeight.bold,
                    }}
                  >
                    Pending ({pendingCreditExpenses.length})
                  </Text>
                </View>
              )}
            </View>
            <Text style={[styles.greetingText, { color: theme.colors.textPrimary, fontSize: theme.fontSize['2xl'], fontWeight: theme.fontWeight.bold }]}>
              {greeting}
            </Text>
            <Text style={[styles.subtitleText, { color: theme.colors.textSecondary, fontSize: theme.fontSize.sm }]}>
              Here's your household snapshot
            </Text>
          </View>

          {expensesError && <ErrorBanner message={expensesError} onRetry={retry} />}

          {isLoading ? (
            <SkeletonDashboard />
          ) : (
            <>
              {/* 2. Total Spending Card */}
              <Card style={styles.totalHeroCard} padding={20}>
                <View style={styles.totalHeroHeader}>
                  <Text style={[styles.totalHeroLabel, { color: theme.colors.textSecondary, fontSize: theme.fontSize.xs, fontWeight: theme.fontWeight.semibold }]}>
                    TOTAL SPENDING
                  </Text>
                  <View style={[styles.pillBadge, { backgroundColor: theme.colors.primaryLight }]}>
                    <Text style={{ color: theme.colors.primary, fontSize: theme.fontSize.xs, fontWeight: theme.fontWeight.medium }}>
                      {formatMonthDisplay(currentMonth).split(' ')[0]}
                    </Text>
                  </View>
                </View>

                <View style={styles.totalAmountContainer}>
                  <AmountDisplay paise={totalPaise} size="3xl" bold />
                </View>

                <View style={styles.totalMetaRow}>
                  <Text style={[styles.totalMetaText, { color: theme.colors.textTertiary, fontSize: theme.fontSize.xs }]}>
                    {expenses.length} transaction{expenses.length === 1 ? '' : 's'} logged this month
                  </Text>
                </View>
              </Card>

              {/* 3. Quick Summary / Household Pulse */}
              <View style={styles.pulseRow}>
                {/* Budget Pace */}
                <Card style={styles.pulseCard} padding={14}>
                  <View style={styles.pulseHeader}>
                    <View style={[styles.pulseIconBg, { backgroundColor: theme.colors.primaryLight }]}>
                      <PieChart size={16} color={theme.colors.primary} />
                    </View>
                    <Text style={[styles.pulseTitle, { color: theme.colors.textSecondary, fontSize: theme.fontSize.xs, fontWeight: theme.fontWeight.medium }]}>
                      Budget Pace
                    </Text>
                  </View>
                  {totalBudgetPaise > 0 ? (
                    <>
                      <AmountDisplay paise={totalBudgetPaise - totalPaise > 0 ? totalBudgetPaise - totalPaise : 0} size="md" bold color={totalPaise > totalBudgetPaise ? theme.colors.danger : theme.colors.textPrimary} />
                      <Text style={{ color: theme.colors.textSecondary, fontSize: theme.fontSize.xs }}>
                        {totalPaise > totalBudgetPaise ? 'Exceeded' : 'Left of ' + formatAmountCompact(totalBudgetPaise)}
                      </Text>
                    </>
                  ) : (
                    <>
                      <Text style={[{ color: theme.colors.textPrimary, fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.semibold }]}>
                        No Budget Set
                      </Text>
                      <TouchableOpacity onPress={() => router.push('/(modals)/manage-budgets')}>
                        <Text style={{ color: theme.colors.primary, fontSize: theme.fontSize.xs, fontWeight: theme.fontWeight.medium }}>
                          Set budget →
                        </Text>
                      </TouchableOpacity>
                    </>
                  )}
                </Card>

                {/* Daily Average */}
                <Card style={styles.pulseCard} padding={14}>
                  <View style={styles.pulseHeader}>
                    <View style={[styles.pulseIconBg, { backgroundColor: theme.colors.primaryLight }]}>
                      <Activity size={16} color={theme.colors.primary} />
                    </View>
                    <Text style={[styles.pulseTitle, { color: theme.colors.textSecondary, fontSize: theme.fontSize.xs, fontWeight: theme.fontWeight.medium }]}>
                      Daily Average
                    </Text>
                  </View>
                  <AmountDisplay paise={dailyAvgPaise} size="md" bold />
                  <Text style={{ color: theme.colors.textSecondary, fontSize: theme.fontSize.xs }}>
                    Over {currentDayOfMonth} day{currentDayOfMonth === 1 ? '' : 's'} elapsed
                  </Text>
                </Card>
              </View>

              {/* 3.5 Pending Payments Section (Only shown if pending credit items exist) */}
              {pendingCreditExpenses.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary, fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.semibold }]}>
                      Pending payments
                    </Text>
                  </View>

                  <Card padding={16} style={{ gap: 12 }}>
                    <View style={styles.pendingCardHeader}>
                      <View style={[styles.pendingBadge, { backgroundColor: theme.colors.warningLight }]}>
                        <Clock size={14} color={theme.colors.warning} />
                        <Text style={{ color: theme.colors.warning, fontSize: theme.fontSize.xs, fontWeight: theme.fontWeight.bold }}>
                          {formatAmount(totalPendingPaise)} to settle
                        </Text>
                      </View>
                    </View>

                    {pendingCreditExpenses.map((expense: Expense, idx: number) => {
                      const category = getCategoryById(expense.categoryId);
                      return (
                        <View
                          key={expense.id}
                          style={[
                            styles.pendingPreviewRow,
                            idx < pendingCreditExpenses.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.colors.separator, paddingBottom: 10 },
                          ]}
                        >
                          <CategoryIcon categoryId={expense.categoryId} size={36} iconSize={18} />
                          <View style={{ flex: 1, gap: 2 }}>
                            <Text style={[{ color: theme.colors.textPrimary, fontSize: theme.fontSize.base, fontWeight: theme.fontWeight.bold }]} numberOfLines={1}>
                              {expense.description}
                            </Text>
                            <Text style={[{ color: theme.colors.textSecondary, fontSize: theme.fontSize.xs }]}>
                              {category.label}
                            </Text>
                          </View>
                          <View style={{ alignItems: 'flex-end', gap: 4 }}>
                            <AmountDisplay paise={expense.amountPaise} size="sm" bold />
                            <TouchableOpacity
                              style={[styles.quickSettleBtn, { backgroundColor: theme.colors.primaryLight }]}
                              onPress={() => setSettleTarget(expense)}
                            >
                              <Text style={{ color: theme.colors.primary, fontSize: theme.fontSize.xs, fontWeight: theme.fontWeight.bold }}>
                                Mark as Settled
                              </Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      );
                    })}
                  </Card>
                </View>
              )}

              {/* 4. Pending / Requires Attention */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary, fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.semibold }]}>
                  Requires Attention
                </Text>

                {activeCount > 0 || budgetSummary.length > 0 ? (
                  <Card padding={16} style={{ gap: 12 }}>
                    {activeCount > 0 && (
                      <TouchableOpacity
                        style={styles.attentionRow}
                        onPress={() => router.push('/(tabs)/insights')}
                        accessibilityRole="button"
                        accessibilityLabel="Active loans summary"
                      >
                        <View style={[styles.attentionIconContainer, { backgroundColor: theme.colors.warningLight }]}>
                          <Landmark size={18} color={theme.colors.warning} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[{ color: theme.colors.textPrimary, fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.semibold }]}>
                            {activeCount} Active Loan{activeCount === 1 ? '' : 's'}
                          </Text>
                          <Text style={[{ color: theme.colors.textSecondary, fontSize: theme.fontSize.xs }]}>
                            {formatAmountCompact(totalOutstandingPaise)} total outstanding balance
                          </Text>
                        </View>
                        <ChevronRight size={18} color={theme.colors.textTertiary} />
                      </TouchableOpacity>
                    )}

                    {budgetSummary.map((b) => (
                      <TouchableOpacity
                        key={b.catId}
                        style={styles.attentionRow}
                        onPress={() => router.push('/(modals)/manage-budgets')}
                        accessibilityRole="button"
                      >
                        <View style={[styles.attentionIconContainer, { backgroundColor: theme.colors.dangerLight }]}>
                          <AlertCircle size={18} color={theme.colors.danger} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[{ color: theme.colors.textPrimary, fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.semibold }]}>
                            {getCategoryById(b.catId).label} Budget Alert
                          </Text>
                          <Text style={[{ color: theme.colors.textSecondary, fontSize: theme.fontSize.xs }]}>
                            {Math.round(b.pct)}% of monthly limit used ({formatAmountCompact(b.spent)} / {formatAmountCompact(b.budget.amountPaise)})
                          </Text>
                        </View>
                        <Badge label={`${Math.round(b.pct)}%`} status={b.status} />
                      </TouchableOpacity>
                    ))}
                  </Card>
                ) : (
                  <Card style={styles.allCaughtUpCard} padding={14}>
                    <CheckCircle size={18} color={theme.colors.success} />
                    <Text style={[{ color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.medium }]}>
                      All caught up! No pending household items.
                    </Text>
                  </Card>
                )}
              </View>

              {/* 5. Spending Reflection / Smart Insight */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary, fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.semibold }]}>
                    Spending Reflection
                  </Text>
                  <Sparkles size={16} color={theme.colors.primary} />
                </View>

                {topCategories.length > 0 ? (
                  <Card style={{ ...styles.reflectionCard, backgroundColor: theme.colors.primaryLight, borderColor: theme.colors.primary + '33' }} padding={16}>
                    <View style={styles.reflectionHeader}>
                      <TrendingUp size={18} color={theme.colors.primary} />
                      <Text style={[{ color: theme.colors.primary, fontSize: theme.fontSize.xs, fontWeight: theme.fontWeight.bold, textTransform: 'uppercase', letterSpacing: 0.5 }]}>
                        SMART INSIGHT
                      </Text>
                    </View>
                    <Text style={[styles.reflectionText, { color: theme.colors.textPrimary, fontSize: theme.fontSize.sm }]}>
                      {insights.length > 0
                        ? insights[0].message
                        : `Top spending category is ${topCategories[0].category.label}, representing ${topCategories[0].percentage}% of total household expenses this month.`}
                    </Text>
                  </Card>
                ) : (
                  <Card padding={16}>
                    <Text style={[{ color: theme.colors.textSecondary, fontSize: theme.fontSize.sm }]}>
                      Add expenses to unlock smart reflections on your household spending.
                    </Text>
                  </Card>
                )}
              </View>

              {/* 6. Spending Trend */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary, fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.semibold }]}>
                  Spending Trend & Pace
                </Text>
                <Card padding={16} style={{ gap: 12 }}>
                  <View style={styles.trendRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={[{ color: theme.colors.textPrimary, fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.medium }]}>
                        Month Progress ({monthProgressPct}%)
                      </Text>
                      <Text style={[{ color: theme.colors.textSecondary, fontSize: theme.fontSize.xs }]}>
                        Day {currentDayOfMonth} of {daysInCurrentMonth}
                      </Text>
                    </View>
                    {totalBudgetPaise > 0 && (
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={[{ color: theme.colors.textPrimary, fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.medium }]}>
                          Budget Used ({Math.round(budgetUsedPct)}%)
                        </Text>
                        <Text style={[{ color: theme.colors.textSecondary, fontSize: theme.fontSize.xs }]}>
                          {formatAmountCompact(totalPaise)} / {formatAmountCompact(totalBudgetPaise)}
                        </Text>
                      </View>
                    )}
                  </View>
                  <ProgressBar percentage={monthProgressPct} status="normal" />
                  {totalBudgetPaise > 0 && (
                    <View style={styles.trendPaceFooter}>
                      <Text style={{ color: budgetUsedPct > monthProgressPct ? theme.colors.warning : theme.colors.success, fontSize: theme.fontSize.xs, fontWeight: theme.fontWeight.medium }}>
                        {budgetUsedPct > monthProgressPct
                          ? '⚡ Spending pace is slightly faster than days elapsed'
                          : '✓ Spending pace is well aligned with the month'}
                      </Text>
                    </View>
                  )}
                </Card>
              </View>

              {/* 7. Category Breakdown */}
              {topCategories.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary, fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.semibold }]}>
                      By category
                    </Text>
                  </View>
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
                          <Text style={[styles.categoryName, { color: theme.colors.textPrimary, fontSize: theme.fontSize.base, fontWeight: theme.fontWeight.medium }]}>
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

              {/* 8. Recent Transactions */}
              {recentExpenses.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary, fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.semibold }]}>
                      Recent transactions
                    </Text>
                    <TouchableOpacity onPress={() => router.push('/(tabs)/transactions')} accessibilityRole="link" accessibilityLabel="See all transactions">
                      <View style={styles.seeAllRow}>
                        <Text style={[{ color: theme.colors.primary, fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.medium }]}>See all</Text>
                        <ArrowUpRight size={14} color={theme.colors.primary} />
                      </View>
                    </TouchableOpacity>
                  </View>
                  <Card padding={0}>
                    {recentExpenses.map((expense: Expense, idx: number) => {
                      const category = getCategoryById(expense.categoryId);
                      const isPending = expense.paymentStatus === 'credit';
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
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                              <Text style={[{ color: theme.colors.textPrimary, fontSize: theme.fontSize.base, fontWeight: theme.fontWeight.medium }]} numberOfLines={1}>
                                {expense.description}
                              </Text>
                              {isPending && (
                                <View style={{ backgroundColor: theme.colors.warningLight, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                                  <Text style={{ color: theme.colors.warning, fontSize: 10, fontWeight: '700' }}>
                                    🟠 Pending
                                  </Text>
                                </View>
                              )}
                            </View>
                            <Text style={[{ color: theme.colors.textSecondary, fontSize: theme.fontSize.xs }]}>
                              {category.label} · {formatDisplayDate(expense.date)}
                            </Text>
                          </View>
                          <AmountDisplay paise={expense.amountPaise} size="sm" bold />
                        </TouchableOpacity>
                      );
                    })}
                  </Card>
                </View>
              )}

              {/* Empty state */}
              {expenses.length === 0 && !isLoading && (
                <Card style={styles.emptyCard} padding={24}>
                  <Text style={{ fontSize: 36, textAlign: 'center' }}>💰</Text>
                  <Text style={[{ color: theme.colors.textPrimary, fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.semibold, textAlign: 'center' }]}>
                    No household expenses yet
                  </Text>
                  <Text style={[{ color: theme.colors.textSecondary, fontSize: theme.fontSize.sm, textAlign: 'center' }]}>
                    Tap the + button to log your first expense
                  </Text>
                </Card>
              )}
            </>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Floating Action Button (FAB) */}
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: theme.colors.primary }]}
          onPress={() => router.push('/(modals)/add-expense')}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Add new expense"
        >
          <Plus size={26} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Confirmation Dialog for Settle Expense */}
        <ConfirmDialog
          visible={!!settleTarget}
          title={`Mark ${settleTarget ? formatAmount(settleTarget.amountPaise) : ''} as settled?`}
          message={settleTarget ? `"${settleTarget.description}" status will be updated from Credit to Paid.` : ''}
          confirmLabel="Mark as Settled"
          cancelLabel="Cancel"
          onConfirm={handleConfirmSettleExpense}
          onCancel={() => setSettleTarget(null)}
          isLoading={isSettling}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1, position: 'relative' },
  scroll: { padding: 16, gap: 16 },
  header: { gap: 4, marginBottom: 4 },
  headerTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 },
  monthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  monthBadgeText: { fontWeight: '500' },
  headerPendingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  greetingText: {},
  subtitleText: {},
  totalHeroCard: { gap: 12, borderRadius: 20 },
  totalHeroHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalHeroLabel: { letterSpacing: 0.8 },
  pillBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  totalAmountContainer: { paddingVertical: 4 },
  totalMetaRow: { flexDirection: 'row', alignItems: 'center' },
  totalMetaText: {},
  pulseRow: { flexDirection: 'row', gap: 12 },
  pulseCard: { flex: 1, gap: 6, borderRadius: 16 },
  pulseHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pulseIconBg: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  pulseTitle: {},
  section: { gap: 10 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: {},
  seeAllRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  attentionRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  attentionIconContainer: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  allCaughtUpCard: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  pendingCardHeader: { flexDirection: 'row', alignItems: 'center' },
  pendingBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  pendingPreviewRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 4 },
  quickSettleBtn: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  emptyPendingCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16 },
  addPendingBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  reflectionCard: { gap: 8, borderWidth: 1, borderRadius: 16 },
  reflectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  reflectionText: { lineHeight: 20 },
  trendRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  trendPaceFooter: { marginTop: 4 },
  categoryRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  categoryInfo: { flex: 1, gap: 6 },
  categoryName: {},
  categoryAmount: { alignItems: 'flex-end', gap: 2 },
  categoryPct: {},
  expenseRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  expenseInfo: { flex: 1, gap: 3 },
  emptyCard: { alignItems: 'center', gap: 10, paddingVertical: 32 },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 6,
    zIndex: 99,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    padding: 16,
  },
  fabMenuSheet: {
    padding: 18,
    borderRadius: 24,
    borderWidth: 1,
    gap: 12,
    marginBottom: 80,
  },
  fabMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    borderRadius: 16,
  },
  fabMenuIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

