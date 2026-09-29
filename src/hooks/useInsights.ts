// OurMoney — useInsights Hook
// Data aggregation for the Analytics & Insights tab (charts, category breakdowns, user splits).

import { useMemo } from 'react';
import { useExpenses } from './useExpenses';
import { useBudgets } from './useBudgets';
import { useLoans } from './useLoans';
import { useAuth } from '../context/AuthContext';
import { useHousehold } from '../context/HouseholdContext';
import { aggregateByCategory, calculateTotal, calculateByUser } from '../utils/budgetCalculations';
import { getCategoryById } from '../constants/categories';
import { getCurrentMonth } from '../utils/dateUtils';

export function useInsights() {
  const { user } = useAuth();
  const { household } = useHousehold();
  const currentMonth = getCurrentMonth();

  const { expenses, isLoading: expensesLoading } = useExpenses({ month: currentMonth });
  const { budgets, isLoading: budgetsLoading } = useBudgets(currentMonth);
  const { loans, isLoading: loansLoading } = useLoans();

  const isLoading = expensesLoading || budgetsLoading || loansLoading;

  const insightsData = useMemo(() => {
    const totalSpentPaise = calculateTotal(expenses);
    const categoryTotals = aggregateByCategory(expenses);
    const userTotals = calculateByUser(expenses);

    const currentUserId = user?.uid ?? '';
    const mySpentPaise = userTotals[currentUserId] ?? 0;
    const partnerSpentPaise = totalSpentPaise - mySpentPaise;

    // Category breakdown list
    const categoryBreakdown = Object.entries(categoryTotals)
      .map(([catId, amountPaise]) => ({
        categoryId: catId,
        category: getCategoryById(catId),
        amountPaise,
        percentage: totalSpentPaise > 0 ? (amountPaise / totalSpentPaise) * 100 : 0,
      }))
      .sort((a, b) => b.amountPaise - a.amountPaise);

    // Budget utilization
    const budgetUtilization = budgets.map((b) => {
      const spentPaise = categoryTotals[b.categoryId] ?? 0;
      const pct = b.amountPaise > 0 ? (spentPaise / b.amountPaise) * 100 : 0;
      return {
        ...b,
        category: getCategoryById(b.categoryId),
        spentPaise,
        percentUsed: Math.min(pct, 100),
        rawPercent: pct,
      };
    });

    // Debt overview
    const activeLoans = loans.filter((l) => l.status === 'active');
    const totalDebtPaise = activeLoans.reduce((sum, l) => sum + l.currentBalancePaise, 0);

    return {
      totalSpentPaise,
      mySpentPaise,
      partnerSpentPaise,
      myPercentage: totalSpentPaise > 0 ? (mySpentPaise / totalSpentPaise) * 100 : 50,
      partnerPercentage: totalSpentPaise > 0 ? (partnerSpentPaise / totalSpentPaise) * 100 : 50,
      categoryBreakdown,
      budgetUtilization,
      totalDebtPaise,
      activeLoans,
      partnerName: household?.partnerProfile?.displayName ?? 'Partner',
    };
  }, [expenses, budgets, loans, user, household]);

  return {
    ...insightsData,
    isLoading,
  };
}
