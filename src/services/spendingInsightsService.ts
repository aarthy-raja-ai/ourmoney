// OurMoney — Smart Spending Insights Service
// =====================================================
// All calculations are DETERMINISTIC. No external AI required for MVP.
// Uses neutral, non-judgmental language.
// NEVER says: "Bad purchase", "You shouldn't", "You're wasting", "Don't spend".
// =====================================================

import type { CategoryId } from '../constants/categories';
import { getCategoryById, getNormalizedCategory } from '../constants/categories';
import { getBudgetStatus, getBudgetPercentage } from '../utils/budgetCalculations';
import { formatAmount, formatAmountCompact } from '../utils/currency';

export type InsightLevel = 'good' | 'neutral' | 'heads-up' | 'warning';

export interface SpendingInsight {
  level: InsightLevel;
  headline: string;
  detail: string;
  emoji: string;
  isEstimate?: boolean;
  severity?: 'normal' | 'notice' | 'warning' | 'exceeded';
  message?: string;
}

export interface ReflectionInsight {
  severity: 'normal' | 'notice' | 'warning' | 'exceeded';
  message: string;
}

export interface SpendingReflectionResult {
  shouldReflect?: boolean;
  highestSeverity: 'normal' | 'notice' | 'warning' | 'exceeded';
  insights: ReflectionInsight[];
  nudge: string;
}


export interface AnalyzeExpenseParams {
  categoryId: CategoryId;
  amountPaise: number; // the new transaction being evaluated
  currentCategorySpentPaise: number; // current month category total (BEFORE this transaction)
  currentMonthTotalPaise: number; // current month total (BEFORE this transaction)
  budgetPaise: number | null; // category budget, null if no budget set
  previousMonthCategoryPaise: number | null; // previous month same category, null if no data
  historicalAveragePaise: number | null; // 3-month avg same category, null if insufficient data
  previousMonthTotalPaise: number | null; // previous month total, null if no data
}


/**
 * Main analysis function: evaluates a pending expense and returns a smart insight.
 * Never blocks the expense. User always remains in control.
 */
export function analyzeExpense(params: AnalyzeExpenseParams): SpendingInsight {
  const {
    categoryId,
    amountPaise,
    currentCategorySpentPaise,
    budgetPaise,
    previousMonthCategoryPaise,
    historicalAveragePaise,
  } = params;

  const category = getCategoryById(categoryId);
  const afterTransactionPaise = currentCategorySpentPaise + amountPaise;

  // Priority 1: Budget check (most actionable)
  if (budgetPaise !== null && budgetPaise > 0) {
    const budgetInsight = checkBudget(
      category.label,
      afterTransactionPaise,
      budgetPaise,
      amountPaise,
    );
    if (budgetInsight.level !== 'good') {
      return budgetInsight;
    }
  }

  // Priority 2: Historical comparison
  if (historicalAveragePaise !== null) {
    const historyInsight = checkHistoricalComparison(
      category.label,
      amountPaise,
      historicalAveragePaise,
    );
    if (historyInsight.level !== 'good') {
      return historyInsight;
    }
  }

  // Priority 3: Previous month comparison
  if (previousMonthCategoryPaise !== null) {
    const trendInsight = checkMonthlyTrend(
      category.label,
      afterTransactionPaise,
      previousMonthCategoryPaise,
    );
    if (trendInsight.level !== 'good') {
      return trendInsight;
    }
  }

  // Default: all looks fine
  return {
    level: 'good',
    headline: 'Looks good',
    detail: budgetPaise !== null
      ? `${category.label} spending is within your budget.`
      : previousMonthCategoryPaise !== null
      ? `${category.label} spending is within your usual range.`
      : 'Not enough spending history yet to compare.',
    emoji: '✓',
  };
}

function checkBudget(
  categoryName: string,
  afterTransactionPaise: number,
  budgetPaise: number,
  transactionPaise: number,
): SpendingInsight {
  const status = getBudgetStatus(afterTransactionPaise, budgetPaise);
  const pct = getBudgetPercentage(afterTransactionPaise, budgetPaise);

  switch (status) {
    case 'exceeded':
      return {
        level: 'warning',
        headline: 'Worth a second thought',
        detail:
          `This ${formatAmount(transactionPaise)} would take ${categoryName} spending to ` +
          `${formatAmountCompact(afterTransactionPaise)}, which is ${pct.toFixed(0)}% of your ` +
          `${formatAmountCompact(budgetPaise)} monthly budget.`,
        emoji: '💡',
      };

    case 'almost':
      return {
        level: 'heads-up',
        headline: 'Just a heads-up',
        detail:
          `After this, ${categoryName} spending would be at ${pct.toFixed(0)}% of your ` +
          `${formatAmountCompact(budgetPaise)} monthly budget.`,
        emoji: '📊',
      };

    case 'heads-up':
      return {
        level: 'heads-up',
        headline: 'Getting close',
        detail:
          `${categoryName} spending would reach ${pct.toFixed(0)}% of your monthly budget.`,
        emoji: '📊',
      };

    default:
      return {
        level: 'good',
        headline: 'Looks good',
        detail: `${categoryName} spending is within your budget.`,
        emoji: '✓',
      };
  }
}

function checkHistoricalComparison(
  categoryName: string,
  transactionPaise: number,
  historicalAverageSingleTransactionPaise: number,
): SpendingInsight {
  if (historicalAverageSingleTransactionPaise <= 0) {
    return { level: 'good', headline: 'Looks good', detail: '', emoji: '✓' };
  }

  const ratio = transactionPaise / historicalAverageSingleTransactionPaise;

  if (ratio >= 2.0) {
    return {
      level: 'heads-up',
      headline: 'Just a heads-up',
      detail:
        `This ${categoryName} expense is higher than your usual spending in this category.`,
      emoji: '💡',
    };
  }

  return { level: 'good', headline: 'Looks good', detail: '', emoji: '✓' };
}

function checkMonthlyTrend(
  categoryName: string,
  currentMonthTotalPaise: number,
  previousMonthTotalPaise: number,
): SpendingInsight {
  if (previousMonthTotalPaise <= 0) {
    return { level: 'good', headline: 'Looks good', detail: '', emoji: '✓' };
  }

  const ratio = currentMonthTotalPaise / previousMonthTotalPaise;

  if (ratio >= 1.3) {
    const diff = currentMonthTotalPaise - previousMonthTotalPaise;
    return {
      level: 'neutral',
      headline: 'Spending up this month',
      detail:
        `${categoryName} spending this month is ${formatAmountCompact(diff)} more than last month.`,
      emoji: '📈',
    };
  }

  return { level: 'good', headline: 'Looks good', detail: '', emoji: '✓' };
}

// ── Dashboard Insights (shown on home screen) ─────────────────────────────────

export interface DashboardInsight {
  message: string;
  type: 'info' | 'positive' | 'neutral' | 'heads-up';
}

/**
 * Generate up to 3 relevant insights for the home dashboard.
 * Only shows insights when there is enough data.
 * Returns empty array if no meaningful insights available.
 */
export function generateDashboardInsights(params: {
  currentMonthTotalPaise: number;
  previousMonthTotalPaise: number | null;
  categoryTotals: Record<string, number>;
  budgets: Record<string, number>;
  activeLoansCount: number;
  totalOutstandingPaise: number;
  plannedRepaymentThisMonthPaise: number;
}): DashboardInsight[] {
  const insights: DashboardInsight[] = [];
  const {
    currentMonthTotalPaise,
    previousMonthTotalPaise,
    categoryTotals,
    budgets,
    activeLoansCount,
    plannedRepaymentThisMonthPaise: _plannedRepaymentThisMonthPaise,
  } = params;

  // Month-over-month spending comparison
  if (previousMonthTotalPaise !== null && previousMonthTotalPaise > 0) {
    const diff = currentMonthTotalPaise - previousMonthTotalPaise;
    const ratio = currentMonthTotalPaise / previousMonthTotalPaise;

    if (ratio <= 0.85) {
      insights.push({
        type: 'positive',
        message: `Spending is ${formatAmountCompact(Math.abs(diff))} lower than last month. `,
      });
    } else if (ratio >= 1.2) {
      insights.push({
        type: 'neutral',
        message: `Spending is ${formatAmountCompact(diff)} higher than last month.`,
      });
    }
  }

  // Budget warnings (find highest % used)
  let highestBudgetPct = 0;
  let highestBudgetCategory = '';
  for (const [catId, spent] of Object.entries(categoryTotals)) {
    const budget = budgets[catId];
    if (budget && budget > 0) {
      const pct = (spent / budget) * 100;
      if (pct > highestBudgetPct) {
        highestBudgetPct = pct;
        highestBudgetCategory = catId;
      }
    }
  }
  if (highestBudgetPct >= 90 && highestBudgetCategory) {
    const cat = getCategoryById(highestBudgetCategory as CategoryId);
    insights.push({
      type: 'heads-up',
      message: `${cat.label} has used ${highestBudgetPct.toFixed(0)}% of its monthly budget.`,
    });
  }

  // Loan summary
  if (activeLoansCount > 0) {
    insights.push({
      type: 'info',
      message:
        activeLoansCount === 1
          ? `You have 1 active loan.`
          : `You have ${activeLoansCount} active loans.`,
    });
  }

  return insights.slice(0, 3);
}

/**
 * Evaluate expense reflection for Add/Edit Expense modal.
 */
export function evaluateExpenseReflection(params: any): SpendingReflectionResult | null {
  const amountPaise = params.amountPaise ?? params.newExpensePaise ?? 0;
  const categoryId: CategoryId = params.categoryId;

  let currentCategorySpentPaise = params.currentCategorySpentPaise ?? 0;
  let budgetPaise: number | null = params.budgetPaise ?? null;

  if (Array.isArray(params.monthExpenses)) {
    currentCategorySpentPaise = params.monthExpenses
      .filter((e: any) => e.categoryId === categoryId)
      .reduce((sum: number, e: any) => sum + (e.amountPaise || 0), 0);
  }

  if (Array.isArray(params.budgets)) {
    const found = params.budgets.find((b: any) => b.categoryId === categoryId);
    if (found) budgetPaise = found.amountPaise;
  }

  const category = getCategoryById(categoryId);

  if (budgetPaise && budgetPaise > 0) {
    const afterSpent = currentCategorySpentPaise + amountPaise;
    const pct = getBudgetPercentage(afterSpent, budgetPaise);
    const status = getBudgetStatus(afterSpent, budgetPaise);

    if (status === 'exceeded') {
      return {
        shouldReflect: true,
        highestSeverity: 'exceeded',
        insights: [
          {
            severity: 'exceeded',
            message: `This expense will exceed your monthly budget for ${category?.label || categoryId} (${pct.toFixed(0)}% used).`,
          },
        ],
        nudge: 'Consider if this purchase can be postponed or allocated across other budget categories.',
      };
    } else if (status === 'almost' || status === 'heads-up') {
      return {
        shouldReflect: true,
        highestSeverity: 'warning',
        insights: [
          {
            severity: 'warning',
            message: `This expense brings ${category?.label || categoryId} spending to ${pct.toFixed(0)}% of your budget.`,
          },
        ],
        nudge: 'You are close to your target limit for this category.',
      };
    }
  }

  return {
    shouldReflect: false,
    highestSeverity: 'normal',
    insights: [],
    nudge: '',
  };
}

export function generateSpendingInsights(
  arg1: any,
  arg2?: any,
  _arg3?: any,
): any[] {
  if (Array.isArray(arg1)) {
    const expenses = arg1;
    const budgets = Array.isArray(arg2) ? arg2 : [];
    const insights: any[] = [];

    const categoryTotals: Record<string, number> = {};
    for (const e of expenses) {
      if (e.categoryId) {
        categoryTotals[e.categoryId] = (categoryTotals[e.categoryId] || 0) + (e.amountPaise || 0);
      }
    }

    const budgetMap: Record<string, number> = {};
    for (const b of budgets) {
      if (b.categoryId) {
        budgetMap[b.categoryId] = b.amountPaise;
      }
    }

    for (const [catId, spent] of Object.entries(categoryTotals)) {
      const budget = budgetMap[catId];
      if (budget && spent > budget) {
        insights.push({
          type: 'budget_exceeded',
          categoryId: catId,
          message: `${catId} spending exceeds budget.`,
        });
      }
    }
    return insights;
  }

  if (arg1 && typeof arg1 === 'object') {
    return generateDashboardInsights(arg1);
  }

  return [];
}

/**
 * Aggregates expenses into normalized main categories and subcategories without double-counting.
 * Every expense is summed exactly ONCE into totalPaise, ONCE into its main category total,
 * and ONCE into its subcategory total.
 */
export function getNormalizedCategoryTotals(expenses: Array<{ categoryId: string; subcategoryId?: string; amountPaise: number }>): {
  mainCategoryTotals: Record<string, number>;
  subcategoryTotals: Record<string, number>;
  totalPaise: number;
} {
  const mainCategoryTotals: Record<string, number> = {};
  const subcategoryTotals: Record<string, number> = {};
  let totalPaise = 0;

  for (const e of expenses) {
    const amount = e.amountPaise || 0;
    const norm = getNormalizedCategory(e.categoryId, e.subcategoryId);

    mainCategoryTotals[norm.mainCategoryId] = (mainCategoryTotals[norm.mainCategoryId] || 0) + amount;

    if (norm.subcategoryId) {
      const subKey = `${norm.mainCategoryId}:${norm.subcategoryId}`;
      subcategoryTotals[subKey] = (subcategoryTotals[subKey] || 0) + amount;
    }

    totalPaise += amount;
  }

  return {
    mainCategoryTotals,
    subcategoryTotals,
    totalPaise,
  };
}

/**
 * Calculate month-over-month or period-over-period percentage change safely.
 * Returns null if previous period spending is null or 0 to prevent misleading infinity changes.
 */
export function calculateSafePercentageChange(
  currentPaise: number,
  previousPaise: number | null | undefined,
): { pct: number; label: string; isIncrease: boolean } | null {
  if (previousPaise === null || previousPaise === undefined || previousPaise <= 0) {
    return null;
  }

  const diff = currentPaise - previousPaise;
  const pct = (diff / previousPaise) * 100;
  const isIncrease = diff > 0;
  const label = `${isIncrease ? '+' : ''}${pct.toFixed(1)}%`;

  return { pct, label, isIncrease };
}

