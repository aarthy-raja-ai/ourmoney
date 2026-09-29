// OurMoney — useDashboardData Hook
// Combines expenses, budgets, loans, and partner data for the Home Dashboard screen.

import { useMemo } from 'react';
import { useExpenses } from './useExpenses';
import { useBudgets } from './useBudgets';
import { useLoans } from './useLoans';
import { useHousehold } from '../context/HouseholdContext';
import { useAuth } from '../context/AuthContext';
import { aggregateByCategory, calculateTotal, calculateByUser } from '../utils/budgetCalculations';
import { getCategoryById } from '../constants/categories';
import { getCurrentMonth } from '../utils/dateUtils';
import { generateSpendingInsights } from '../services/spendingInsightsService';

export function useDashboardData() {
  const { user } = useAuth();
  const { household } = useHousehold();
  const currentMonth = getCurrentMonth();

  const { expenses, isLoading: expensesLoading, error: expensesError, retry: retryExpenses } = useExpenses({
    month: currentMonth,
  });

  const { budgets, isLoading: budgetsLoading, error: budgetsError } = useBudgets(currentMonth);
  const { loans, isLoading: loansLoading, error: loansError } = useLoans();

  const isLoading = expensesLoading || budgetsLoading || loansLoading;
  const error = expensesError || budgetsError || loansError;

  const dashboardData = useMemo(() => {
    // 1. Spending totals
    const totalSpentPaise = calculateTotal(expenses);
    const userTotals = calculateByUser(expenses);

    const currentUserId = user?.uid ?? '';
    const mySpentPaise = userTotals[currentUserId] ?? 0;
    const partnerSpentPaise = totalSpentPaise - mySpentPaise;

    // 2. Category totals
    const categoryTotals = aggregateByCategory(expenses);
    const topCategories = Object.entries(categoryTotals)
      .map(([catId, amountPaise]) => ({
        category: getCategoryById(catId),
        amountPaise,
        percentage: totalSpentPaise > 0 ? (amountPaise / totalSpentPaise) * 100 : 0,
      }))
      .sort((a, b) => b.amountPaise - a.amountPaise);

    // 3. Budgets overview
    const activeBudgets = budgets.map((b) => {
      const spentPaise = categoryTotals[b.categoryId] ?? 0;
      const pct = b.amountPaise > 0 ? (spentPaise / b.amountPaise) * 100 : 0;
      return {
        ...b,
        category: getCategoryById(b.categoryId),
        spentPaise,
        percentUsed: pct,
        isExceeded: spentPaise >= b.amountPaise,
      };
    });

    // 4. Loans summary
    const activeLoans = loans.filter((l) => l.status === 'active');
    const totalLoanBalancePaise = activeLoans.reduce((sum, l) => sum + l.currentBalancePaise, 0);
    const totalMonthlyEmiPaise = activeLoans.reduce(
      (sum, l) => sum + (l.minimumPaymentPaise ?? l.monthlyPaymentPaise ?? 0),
      0,
    );

    // 5. Smart Insight
    const insights = generateSpendingInsights(expenses, budgets, currentUserId);
    const primaryInsight = insights.length > 0 ? insights[0] : null;

    return {
      totalSpentPaise,
      mySpentPaise,
      partnerSpentPaise,
      topCategories,
      activeBudgets,
      activeLoans,
      totalLoanBalancePaise,
      totalMonthlyEmiPaise,
      primaryInsight,
      partnerName: household?.partnerProfile?.displayName ?? 'Partner',
    };
  }, [expenses, budgets, loans, user, household, currentMonth]);

  return {
    ...dashboardData,
    expenses,
    isLoading,
    error,
    retryExpenses,
  };
}
