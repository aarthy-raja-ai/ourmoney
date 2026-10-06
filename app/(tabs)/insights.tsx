// OurMoney — Insights Tab Screen
// Smart Financial Analysis Dashboard
// Features Day/Week/Month period filter, summary metrics, spending trend chart,
// top category highlight, category breakdown, budget progress, and smart reflections.

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { TrendingUp, TrendingDown, Sparkles, ArrowRight } from 'lucide-react-native';
import { useTheme } from '../../src/context/ThemeContext';
import { useInsights, InsightPeriod } from '../../src/hooks/useInsights';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { Card } from '../../src/components/Card';
import { ProgressBar } from '../../src/components/ProgressBar';
import { CategoryIcon } from '../../src/components/CategoryIcon';
import { SpendingTrendChart } from '../../src/components/SpendingTrendChart';
import { LoadingSpinner } from '../../src/components/LoadingSpinner';
import { EmptyState } from '../../src/components/EmptyState';
import { formatCurrency } from '../../src/utils/currency';

export default function InsightsScreen() {
  const { theme, isDark } = useTheme();
  const router = useRouter();
  const [period, setPeriod] = useState<InsightPeriod>('month');

  const {
    totalSpentPaise,
    dailyAveragePaise,
    transactionCount,
    comparisonChangePercent,
    comparisonType,
    trendData,
    categoryBreakdown,
    topSpendingCategory,
    budgetUtilization,
    reflectionMessage,
    isLoading,
  } = useInsights(period);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScreenHeader
        title="Insights"
        subtitle="Smart financial analysis & spending breakdown"
      />

      {/* Period Segmented Control Filter */}
      <View style={styles.filterContainer}>
        <View style={[styles.segmentedControl, { backgroundColor: theme.colors.surfaceElevated }]}>
          {(['day', 'week', 'month'] as InsightPeriod[]).map((p) => {
            const isActive = period === p;
            const labelMap: Record<InsightPeriod, string> = {
              day: 'Day',
              week: 'Week',
              month: 'Month',
            };

            return (
              <TouchableOpacity
                key={p}
                onPress={() => setPeriod(p)}
                style={[
                  styles.segmentButton,
                  isActive && {
                    backgroundColor: theme.colors.primary,
                  },
                ]}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.segmentText,
                    {
                      color: isActive ? theme.colors.textOnPrimary : theme.colors.textSecondary,
                      fontWeight: isActive ? '700' : '500',
                    },
                  ]}
                >
                  {labelMap[p]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {isLoading ? (
        <LoadingSpinner message="Calculating financial insights..." />
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
          {/* Summary Cards */}
          <View style={styles.summaryGrid}>
            {/* Total Spent Primary Card */}
            <Card style={styles.totalCard}>
              <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>
                TOTAL SPENT ({period.toUpperCase()})
              </Text>
              <Text style={[styles.totalAmount, { color: theme.colors.textPrimary }]}>
                {formatCurrency(totalSpentPaise)}
              </Text>
            </Card>

            {/* Sub-Metrics Row */}
            <View style={styles.subMetricsRow}>
              {/* Daily Average */}
              <Card style={styles.subMetricCard}>
                <Text style={[styles.subLabel, { color: theme.colors.textSecondary }]}>
                  DAILY AVG
                </Text>
                <Text style={[styles.subValue, { color: theme.colors.textPrimary }]}>
                  {formatCurrency(dailyAveragePaise)}
                </Text>
              </Card>

              {/* Transaction Count */}
              <Card style={styles.subMetricCard}>
                <Text style={[styles.subLabel, { color: theme.colors.textSecondary }]}>
                  TRANSACTIONS
                </Text>
                <Text style={[styles.subValue, { color: theme.colors.textPrimary }]}>
                  {transactionCount}
                </Text>
              </Card>

              {/* Vs Previous Period Comparison */}
              <Card style={styles.subMetricCard}>
                <Text style={[styles.subLabel, { color: theme.colors.textSecondary }]}>
                  VS PREV PERIOD
                </Text>
                <View style={styles.comparisonRow}>
                  {comparisonChangePercent !== null ? (
                    <>
                      {comparisonType === 'down' ? (
                        <TrendingDown size={16} color={theme.colors.success} style={{ marginRight: 4 }} />
                      ) : comparisonType === 'up' ? (
                        <TrendingUp size={16} color={theme.colors.danger} style={{ marginRight: 4 }} />
                      ) : null}
                      <Text
                        style={[
                          styles.subValue,
                          {
                            color:
                              comparisonType === 'down'
                                ? theme.colors.success
                                : comparisonType === 'up'
                                ? theme.colors.danger
                                : theme.colors.textPrimary,
                          },
                        ]}
                      >
                        {comparisonType === 'down'
                          ? `↓ ${Math.abs(comparisonChangePercent)}%`
                          : comparisonType === 'up'
                          ? `↑ ${comparisonChangePercent}%`
                          : '0%'}
                      </Text>
                    </>
                  ) : (
                    <Text style={[styles.subValue, { color: theme.colors.textTertiary }]}>—</Text>
                  )}
                </View>
              </Card>
            </View>
          </View>

          {/* Spending Trend Visualization */}
          <Card style={styles.card}>
            <Text style={[styles.cardTitle, { color: theme.colors.textPrimary }]}>
              Spending Trend
            </Text>
            <Text style={[styles.cardSubtitle, { color: theme.colors.textSecondary }]}>
              {period === 'day'
                ? 'Hourly distribution today'
                : period === 'week'
                ? 'Day-by-day spending this week'
                : 'Month-to-date spending breakdown'}
            </Text>
            <SpendingTrendChart data={trendData} />
          </Card>

          {/* Top Spending Category Highlight */}
          {topSpendingCategory && (
            <Card style={[styles.topCategoryCard, { backgroundColor: isDark ? '#1C2538' : theme.colors.primaryLight }]}>
              <View style={styles.topCategoryHeader}>
                <Sparkles size={18} color={theme.colors.primary} />
                <Text style={[styles.topCategoryLabel, { color: theme.colors.primary }]}>
                  Top Spending Category
                </Text>
              </View>

              <View style={styles.topCategoryContent}>
                <CategoryIcon category={topSpendingCategory.category} size={28} style={{ marginRight: 12 }} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.topCategoryName, { color: theme.colors.textPrimary }]}>
                    {topSpendingCategory.category.label}
                  </Text>
                  <Text style={[styles.topCategoryDetail, { color: theme.colors.textSecondary }]}>
                    {topSpendingCategory.percentage.toFixed(0)}% of total spending this {period}
                  </Text>
                </View>
                <Text style={[styles.topCategoryAmount, { color: theme.colors.primary }]}>
                  {formatCurrency(topSpendingCategory.amountPaise)}
                </Text>
              </View>
            </Card>
          )}

          {/* Where Your Money Went (Category Spending) */}
          <Card style={styles.card}>
            <Text style={[styles.cardTitle, { color: theme.colors.textPrimary }]}>
              Where your money went
            </Text>

            {categoryBreakdown.length === 0 ? (
              <EmptyState
                icon="pie-chart-outline"
                title="No spending data yet"
                message="Add your first expense to see category insights here."
                actionLabel="Add Expense"
                onAction={() => router.push('/(modals)/add-expense')}
              />
            ) : (
              categoryBreakdown.map((item) => (
                <View key={item.categoryId} style={styles.categoryRow}>
                  <CategoryIcon category={item.category} size={20} style={{ marginRight: 12 }} />

                  <View style={{ flex: 1 }}>
                    <View style={styles.categoryRowHeader}>
                      <Text style={[styles.categoryName, { color: theme.colors.textPrimary }]}>
                        {item.category.label}
                      </Text>
                      <Text style={[styles.categoryAmount, { color: theme.colors.textPrimary }]}>
                        {formatCurrency(item.amountPaise)}{' '}
                        <Text style={[styles.categoryPercent, { color: theme.colors.textSecondary }]}>
                          ({item.percentage.toFixed(1)}%)
                        </Text>
                      </Text>
                    </View>
                    <ProgressBar progress={item.percentage} color={item.category.color} height={6} />
                  </View>
                </View>
              ))
            )}
          </Card>

          {/* Budget Connection */}
          <Card style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Text style={[styles.cardTitle, { color: theme.colors.textPrimary }]}>
                Budget Progress
              </Text>
              <TouchableOpacity
                onPress={() => router.push('/(modals)/manage-budgets')}
                style={styles.manageLink}
              >
                <Text style={[styles.linkText, { color: theme.colors.primary }]}>Manage</Text>
                <ArrowRight size={14} color={theme.colors.primary} style={{ marginLeft: 4 }} />
              </TouchableOpacity>
            </View>

            {budgetUtilization.length === 0 ? (
              <EmptyState
                icon="wallet-outline"
                title="No budgets set"
                message="Set category budgets to monitor monthly targets."
                actionLabel="Create Budget"
                onAction={() => router.push('/(modals)/manage-budgets')}
              />
            ) : (
              budgetUtilization.map((b) => {
                const getStatusColor = () => {
                  switch (b.status) {
                    case 'exceeded':
                      return theme.colors.danger;
                    case 'almost':
                    case 'heads-up':
                      return theme.colors.warning;
                    default:
                      return theme.colors.primary;
                  }
                };

                const color = getStatusColor();

                return (
                  <View key={b.id} style={styles.budgetRow}>
                    <View style={styles.budgetRowHeader}>
                      <Text style={[styles.budgetName, { color: theme.colors.textPrimary }]}>
                        {b.category.label}
                      </Text>
                      <Text style={[styles.budgetAmount, { color: theme.colors.textPrimary }]}>
                        {formatCurrency(b.spentPaise)} / {formatCurrency(b.amountPaise)}
                      </Text>
                    </View>
                    <View style={styles.budgetBarRow}>
                      <View style={{ flex: 1, marginRight: 10 }}>
                        <ProgressBar progress={b.percentUsed} color={color} height={7} />
                      </View>
                      <Text style={[styles.budgetStatusText, { color }]}>
                        {b.rawPercent.toFixed(0)}% used
                      </Text>
                    </View>
                  </View>
                );
              })
            )}
          </Card>

          {/* Smart Reflection */}
          <Card style={[styles.reflectionCard, { backgroundColor: theme.colors.surfaceElevated }]}>
            <View style={styles.reflectionHeader}>
              <Sparkles size={18} color={theme.colors.primary} />
              <Text style={[styles.reflectionTitle, { color: theme.colors.textPrimary }]}>
                Smart Reflection
              </Text>
            </View>
            <Text style={[styles.reflectionBody, { color: theme.colors.textSecondary }]}>
              "{reflectionMessage}"
            </Text>
          </Card>

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  segmentedControl: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 3,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentText: {
    fontSize: 13,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  summaryGrid: {
    marginBottom: 16,
    gap: 10,
  },
  totalCard: {
    padding: 16,
    borderRadius: 16,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  totalAmount: {
    fontSize: 32,
    fontWeight: '800',
  },
  subMetricsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  subMetricCard: {
    flex: 1,
    padding: 12,
    borderRadius: 14,
  },
  subLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  subValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  comparisonRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  card: {
    padding: 16,
    marginBottom: 16,
    borderRadius: 16,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 12,
    marginBottom: 14,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  manageLink: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  linkText: {
    fontSize: 13,
    fontWeight: '600',
  },
  topCategoryCard: {
    padding: 16,
    marginBottom: 16,
    borderRadius: 16,
  },
  topCategoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  topCategoryLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 6,
  },
  topCategoryContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  topCategoryName: {
    fontSize: 16,
    fontWeight: '700',
  },
  topCategoryDetail: {
    fontSize: 12,
    marginTop: 2,
  },
  topCategoryAmount: {
    fontSize: 18,
    fontWeight: '800',
    marginLeft: 8,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  categoryRowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
  },
  categoryAmount: {
    fontSize: 13,
    fontWeight: '700',
  },
  categoryPercent: {
    fontSize: 11,
    fontWeight: '500',
  },
  budgetRow: {
    marginBottom: 14,
  },
  budgetRowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  budgetName: {
    fontSize: 14,
    fontWeight: '600',
  },
  budgetAmount: {
    fontSize: 12,
    fontWeight: '600',
  },
  budgetBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  budgetStatusText: {
    fontSize: 12,
    fontWeight: '700',
    minWidth: 60,
    textAlign: 'right',
  },
  reflectionCard: {
    padding: 16,
    marginBottom: 16,
    borderRadius: 16,
  },
  reflectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  reflectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 6,
  },
  reflectionBody: {
    fontSize: 14,
    lineHeight: 20,
    fontStyle: 'italic',
  },
});
