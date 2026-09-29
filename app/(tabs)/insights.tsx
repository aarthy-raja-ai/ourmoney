// OurMoney — Insights Tab Screen
// Analytics screen with category spending distribution, user breakdown (You vs Partner),
// budget utilization overview, and spending trends.

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/context/ThemeContext';
import { useInsights } from '../../src/hooks/useInsights';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { Card } from '../../src/components/Card';
import { ProgressBar } from '../../src/components/ProgressBar';
import { CategoryIcon } from '../../src/components/CategoryIcon';
import { LoadingSpinner } from '../../src/components/LoadingSpinner';
import { EmptyState } from '../../src/components/EmptyState';
import { formatCurrency } from '../../src/utils/currency';

export default function InsightsScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const {
    totalSpentPaise,
    mySpentPaise,
    partnerSpentPaise,
    myPercentage,
    partnerPercentage,
    categoryBreakdown,
    budgetUtilization,
    partnerName,
    isLoading,
  } = useInsights();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScreenHeader
        title="Spending Insights"
        subtitle="Household analytics, partner split & budget usage"
      />

      {isLoading ? (
        <LoadingSpinner message="Calculating insights..." />
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
          {/* Household Spending Distribution (You vs Partner) */}
          <Card style={styles.card}>
            <Text style={[styles.cardTitle, { color: theme.colors.textPrimary }]}>
              Household Split (This Month)
            </Text>
            <Text style={[styles.cardSubtitle, { color: theme.colors.textSecondary }]}>
              Total household spending: {formatCurrency(totalSpentPaise)}
            </Text>

            {/* Visual Bar Split */}
            <View style={styles.splitBarContainer}>
              <View
                style={[
                  styles.splitBarLeft,
                  { width: `${myPercentage}%`, backgroundColor: theme.colors.primary },
                ]}
              />
              <View
                style={[
                  styles.splitBarRight,
                  { width: `${partnerPercentage}%`, backgroundColor: theme.colors.accent },
                ]}
              />
            </View>

            <View style={styles.splitLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.dot, { backgroundColor: theme.colors.primary }]} />
                <View>
                  <Text style={[styles.legendLabel, { color: theme.colors.textSecondary }]}>You</Text>
                  <Text style={[styles.legendValue, { color: theme.colors.textPrimary }]}>
                    {formatCurrency(mySpentPaise)} ({myPercentage.toFixed(0)}%)
                  </Text>
                </View>
              </View>

              <View style={[styles.legendItem, { alignItems: 'flex-end' }]}>
                <View style={[styles.dot, { backgroundColor: theme.colors.accent }]} />
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[styles.legendLabel, { color: theme.colors.textSecondary }]}>
                    {partnerName}
                  </Text>
                  <Text style={[styles.legendValue, { color: theme.colors.textPrimary }]}>
                    {formatCurrency(partnerSpentPaise)} ({partnerPercentage.toFixed(0)}%)
                  </Text>
                </View>
              </View>
            </View>
          </Card>

          {/* Category Breakdown */}
          <Card style={styles.card}>
            <Text style={[styles.cardTitle, { color: theme.colors.textPrimary }]}>
              Category Breakdown
            </Text>

            {categoryBreakdown.length === 0 ? (
              <EmptyState
                icon="pie-chart-outline"
                title="No category spending yet"
                message="Expenses logged this month will show up here."
              />
            ) : (
              categoryBreakdown.map((item) => (
                <View key={item.categoryId} style={styles.categoryRow}>
                  <CategoryIcon category={item.category} size={20} style={{ marginRight: 12 }} />

                  <View style={{ flex: 1, marginRight: 12 }}>
                    <View style={styles.categoryRowHeader}>
                      <Text style={[styles.categoryName, { color: theme.colors.textPrimary }]}>
                        {item.category.label}
                      </Text>
                      <Text style={[styles.categoryAmount, { color: theme.colors.textPrimary }]}>
                        {formatCurrency(item.amountPaise)} ({item.percentage.toFixed(1)}%)
                      </Text>
                    </View>
                    <ProgressBar progress={item.percentage} color={item.category.color} height={6} />
                  </View>
                </View>
              ))
            )}
          </Card>

          {/* Budget Utilization */}
          <Card style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Text style={[styles.cardTitle, { color: theme.colors.textPrimary }]}>
                Budget Usage
              </Text>
              <TouchableOpacity onPress={() => router.push('/(modals)/manage-budgets')}>
                <Text style={[styles.linkText, { color: theme.colors.primary }]}>Manage</Text>
              </TouchableOpacity>
            </View>

            {budgetUtilization.length === 0 ? (
              <EmptyState
                icon="wallet-outline"
                title="No budgets set"
                message="Set category budgets to monitor household limits."
                actionLabel="Create Budget"
                onAction={() => router.push('/(modals)/manage-budgets')}
              />
            ) : (
              budgetUtilization.map((b) => (
                <View key={b.id} style={styles.budgetRow}>
                  <View style={styles.budgetRowHeader}>
                    <Text style={[styles.budgetName, { color: theme.colors.textPrimary }]}>
                      {b.category.label}
                    </Text>
                    <Text
                      style={[
                        styles.budgetAmount,
                        {
                          color: b.rawPercent >= 100 ? theme.colors.danger : theme.colors.textSecondary,
                        },
                      ]}
                    >
                      {formatCurrency(b.spentPaise)} / {formatCurrency(b.amountPaise)}
                    </Text>
                  </View>
                  <ProgressBar
                    progress={b.percentUsed}
                    color={b.rawPercent >= 100 ? theme.colors.danger : theme.colors.primary}
                    height={8}
                  />
                </View>
              ))
            )}
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
  scroll: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  card: {
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    marginBottom: 16,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  linkText: {
    fontSize: 14,
    fontWeight: '600',
  },
  splitBarContainer: {
    height: 16,
    borderRadius: 8,
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: 16,
  },
  splitBarLeft: {
    height: '100%',
  },
  splitBarRight: {
    height: '100%',
  },
  splitLegend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  legendLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  legendValue: {
    fontSize: 14,
    fontWeight: '700',
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
    fontWeight: '600',
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
    fontSize: 13,
    fontWeight: '600',
  },
});
