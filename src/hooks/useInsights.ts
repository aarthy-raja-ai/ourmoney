// OurMoney — useInsights Hook
// Data aggregation for the Smart Financial Analysis Insights tab.
// Handles Day, Week, and Month period filtering, trend calculations,
// category breakdown, top spending highlight, budget utilization, and smart reflections.

import { useState, useEffect, useMemo } from 'react';
import { useExpenses } from './useExpenses';
import { useBudgets } from './useBudgets';
import { useAuth } from '../context/AuthContext';
import { useHousehold } from '../context/HouseholdContext';
import { getExpensesForMonth } from '../services/expenseService';
import { getCategoryById } from '../constants/categories';
import {
  getCurrentMonth,
  getPreviousMonth,
  formatDateKey,
  timestampToDate,
} from '../utils/dateUtils';
import type { Expense } from '../models/expense';
import type { CategoryId } from '../constants/categories';

export type InsightPeriod = 'day' | 'week' | 'month';

export interface TrendBarData {
  label: string;
  amountPaise: number;
  isCurrent?: boolean;
}

export interface CategoryBreakdownItem {
  categoryId: string;
  category: ReturnType<typeof getCategoryById>;
  amountPaise: number;
  percentage: number;
  count: number;
}

export interface BudgetUtilizationItem {
  id: string;
  categoryId: CategoryId;
  category: ReturnType<typeof getCategoryById>;
  spentPaise: number;
  amountPaise: number;
  percentUsed: number;
  rawPercent: number;
  status: 'normal' | 'heads-up' | 'almost' | 'exceeded';
}

export function useInsights(period: InsightPeriod = 'month') {
  const { user } = useAuth();
  const { householdId } = useHousehold();
  const currentMonth = getCurrentMonth();
  const prevMonthStr = getPreviousMonth(currentMonth);

  const { expenses: currentMonthExpenses, isLoading: expensesLoading } = useExpenses({
    month: currentMonth,
  });
  const { budgets, isLoading: budgetsLoading } = useBudgets(currentMonth);

  const [prevMonthExpenses, setPrevMonthExpenses] = useState<Expense[]>([]);
  const [isPrevLoading, setIsPrevLoading] = useState(false);

  // Fetch previous month expenses for month-over-month comparison
  useEffect(() => {
    if (!householdId) {
      setPrevMonthExpenses([]);
      return;
    }

    let isMounted = true;
    setIsPrevLoading(true);

    getExpensesForMonth(householdId, prevMonthStr)
      .then((data) => {
        if (isMounted) {
          setPrevMonthExpenses(data);
          setIsPrevLoading(false);
        }
      })
      .catch((err) => {
        console.warn('[useInsights] Failed to fetch previous month expenses:', err);
        if (isMounted) {
          setPrevMonthExpenses([]);
          setIsPrevLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [householdId, prevMonthStr]);

  const isLoading = expensesLoading || budgetsLoading || isPrevLoading;

  const insightsData = useMemo(() => {
    const now = new Date();
    const todayKey = formatDateKey(now);

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const yesterdayKey = formatDateKey(yesterday);

    // Week boundaries (Monday -> Sunday)
    const dayOfWeek = now.getDay(); // 0 is Sun, 1 is Mon...
    const distanceToMon = (dayOfWeek + 6) % 7;
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - distanceToMon);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const startOfPrevWeek = new Date(startOfWeek);
    startOfPrevWeek.setDate(startOfWeek.getDate() - 7);

    const endOfPrevWeek = new Date(startOfWeek);
    endOfPrevWeek.setMilliseconds(-1);

    // All available expenses pool (current + previous month)
    const allExpensesPool = [...currentMonthExpenses, ...prevMonthExpenses];

    // Filter expenses based on period
    let periodExpenses: Expense[] = [];
    let prevPeriodExpenses: Expense[] = [];

    if (period === 'day') {
      periodExpenses = currentMonthExpenses.filter((e) => {
        const d = timestampToDate(e.date);
        return formatDateKey(d) === todayKey;
      });
      prevPeriodExpenses = allExpensesPool.filter((e) => {
        const d = timestampToDate(e.date);
        return formatDateKey(d) === yesterdayKey;
      });
    } else if (period === 'week') {
      periodExpenses = currentMonthExpenses.filter((e) => {
        const d = timestampToDate(e.date);
        return d >= startOfWeek && d <= endOfWeek;
      });
      prevPeriodExpenses = allExpensesPool.filter((e) => {
        const d = timestampToDate(e.date);
        return d >= startOfPrevWeek && d <= endOfPrevWeek;
      });
    } else {
      // Month
      periodExpenses = currentMonthExpenses;
      prevPeriodExpenses = prevMonthExpenses;
    }

    // Totals & counts
    const totalSpentPaise = periodExpenses.reduce((sum, e) => sum + e.amountPaise, 0);
    const transactionCount = periodExpenses.length;
    const prevTotalSpentPaise = prevPeriodExpenses.reduce((sum, e) => sum + e.amountPaise, 0);

    // Daily Average
    let dailyAveragePaise = 0;
    if (period === 'day') {
      dailyAveragePaise = totalSpentPaise;
    } else if (period === 'week') {
      const daysPassedInWeek = Math.max(1, distanceToMon + 1);
      dailyAveragePaise = Math.round(totalSpentPaise / daysPassedInWeek);
    } else {
      // Month
      const daysPassedInMonth = Math.max(1, now.getDate());
      dailyAveragePaise = Math.round(totalSpentPaise / daysPassedInMonth);
    }

    // Comparison vs Previous Period
    let comparisonChangePercent: number | null = null;
    let comparisonType: 'up' | 'down' | 'neutral' = 'neutral';
    if (prevTotalSpentPaise > 0) {
      const diff = totalSpentPaise - prevTotalSpentPaise;
      comparisonChangePercent = Math.round((diff / prevTotalSpentPaise) * 100);
      if (comparisonChangePercent > 0) comparisonType = 'up';
      else if (comparisonChangePercent < 0) comparisonType = 'down';
      else comparisonType = 'neutral';
    }

    // Spending Trend Visualization Data
    let trendData: TrendBarData[] = [];

    if (period === 'day') {
      // 4 time buckets for the day
      const buckets = [
        { label: 'Morning', startHour: 6, endHour: 12, amountPaise: 0 },
        { label: 'Afternoon', startHour: 12, endHour: 17, amountPaise: 0 },
        { label: 'Evening', startHour: 17, endHour: 22, amountPaise: 0 },
        { label: 'Night', startHour: 22, endHour: 30, amountPaise: 0 }, // 22-6am
      ];

      periodExpenses.forEach((e) => {
        const d = timestampToDate(e.date);
        const hour = d.getHours();
        if (hour >= 6 && hour < 12) buckets[0].amountPaise += e.amountPaise;
        else if (hour >= 12 && hour < 17) buckets[1].amountPaise += e.amountPaise;
        else if (hour >= 17 && hour < 22) buckets[2].amountPaise += e.amountPaise;
        else buckets[3].amountPaise += e.amountPaise;
      });

      trendData = buckets.map((b) => ({ label: b.label, amountPaise: b.amountPaise }));
    } else if (period === 'week') {
      // Mon -> Sun (7 bars)
      const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const weekBuckets = dayNames.map((label, idx) => {
        const dateForDay = new Date(startOfWeek);
        dateForDay.setDate(startOfWeek.getDate() + idx);
        const dateStr = formatDateKey(dateForDay);
        return {
          label,
          dateStr,
          amountPaise: 0,
          isCurrent: dateStr === todayKey,
        };
      });

      periodExpenses.forEach((e) => {
        const d = timestampToDate(e.date);
        const dateStr = formatDateKey(d);
        const item = weekBuckets.find((b) => b.dateStr === dateStr);
        if (item) item.amountPaise += e.amountPaise;
      });

      trendData = weekBuckets.map((b) => ({
        label: b.label,
        amountPaise: b.amountPaise,
        isCurrent: b.isCurrent,
      }));
    } else {
      // Month: 5 Date Brackets (Days 1-6, 7-12, 13-18, 19-24, 25-End)
      const monthBuckets = [
        { label: '1-6', start: 1, end: 6, amountPaise: 0 },
        { label: '7-12', start: 7, end: 12, amountPaise: 0 },
        { label: '13-18', start: 13, end: 18, amountPaise: 0 },
        { label: '19-24', start: 19, end: 24, amountPaise: 0 },
        { label: '25+', start: 25, end: 31, amountPaise: 0 },
      ];

      periodExpenses.forEach((e) => {
        const d = timestampToDate(e.date);
        const dayNum = d.getDate();
        const b = monthBuckets.find((mb) => dayNum >= mb.start && dayNum <= mb.end);
        if (b) b.amountPaise += e.amountPaise;
      });

      const currentDay = now.getDate();
      trendData = monthBuckets.map((b) => ({
        label: b.label,
        amountPaise: b.amountPaise,
        isCurrent: currentDay >= b.start && currentDay <= b.end,
      }));
    }

    // Category Breakdown
    const categoryTotalsMap: Record<string, { amountPaise: number; count: number }> = {};
    periodExpenses.forEach((e) => {
      const catId = e.categoryId || 'other';
      if (!categoryTotalsMap[catId]) {
        categoryTotalsMap[catId] = { amountPaise: 0, count: 0 };
      }
      categoryTotalsMap[catId].amountPaise += e.amountPaise;
      categoryTotalsMap[catId].count += 1;
    });

    const categoryBreakdown: CategoryBreakdownItem[] = Object.entries(categoryTotalsMap)
      .map(([catId, val]) => ({
        categoryId: catId,
        category: getCategoryById(catId as any),
        amountPaise: val.amountPaise,
        percentage: totalSpentPaise > 0 ? (val.amountPaise / totalSpentPaise) * 100 : 0,
        count: val.count,
      }))
      .filter((item) => item.amountPaise > 0)
      .sort((a, b) => b.amountPaise - a.amountPaise);

    // Top Spending Category
    const topSpendingCategory = categoryBreakdown.length > 0 ? categoryBreakdown[0] : null;

    // Category Totals for full month (used for Budget utilization connection)
    const fullMonthCategoryTotals: Record<string, number> = {};
    currentMonthExpenses.forEach((e) => {
      const catId = e.categoryId || 'other';
      fullMonthCategoryTotals[catId] = (fullMonthCategoryTotals[catId] || 0) + e.amountPaise;
    });

    // Budget Utilization (Current Month)
    const budgetUtilization: BudgetUtilizationItem[] = budgets.map((b) => {
      const spentPaise = fullMonthCategoryTotals[b.categoryId] ?? 0;
      const pct = b.amountPaise > 0 ? (spentPaise / b.amountPaise) * 100 : 0;
      let status: BudgetUtilizationItem['status'] = 'normal';

      if (pct > 100) status = 'exceeded';
      else if (pct >= 90) status = 'almost';
      else if (pct >= 70) status = 'heads-up';

      return {
        ...b,
        category: getCategoryById(b.categoryId as any),
        spentPaise,
        percentUsed: Math.min(pct, 100),
        rawPercent: pct,
        status,
      };
    });

    // Smart Reflection (Deterministic, non-shaming)
    let reflectionMessage = 'Track your expenses to see smart spending reflections.';
    if (periodExpenses.length === 0) {
      reflectionMessage = 'No expenses logged for this period yet.';
    } else if (topSpendingCategory) {
      if (comparisonChangePercent !== null && comparisonChangePercent > 10) {
        reflectionMessage = `${topSpendingCategory.category.label} is your top category. Spending is slightly higher than previous ${period}.`;
      } else if (comparisonChangePercent !== null && comparisonChangePercent < -10) {
        reflectionMessage = `Great pace! You spent ${Math.abs(comparisonChangePercent)}% less this ${period} than previous ${period}.`;
      } else {
        reflectionMessage = `${topSpendingCategory.category.label} accounts for ${topSpendingCategory.percentage.toFixed(0)}% of your spending this ${period}.`;
      }
    }

    return {
      totalSpentPaise,
      dailyAveragePaise,
      transactionCount,
      prevTotalSpentPaise,
      comparisonChangePercent,
      comparisonType,
      trendData,
      categoryBreakdown,
      topSpendingCategory,
      budgetUtilization,
      reflectionMessage,
    };
  }, [period, currentMonthExpenses, prevMonthExpenses, budgets, user]);

  return {
    ...insightsData,
    isLoading,
  };
}
