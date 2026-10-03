// OurMoney — Smart Spending Insights Service
// =====================================================
// All calculations are DETERMINISTIC. No external AI required for MVP.
// Uses neutral, non-judgmental language.
// NEVER says: "Bad purchase", "You shouldn't", "You're wasting", "Don't spend".
// =====================================================

import type { CategoryId } from '../constants/categories';
import { getCategoryById } from '../constants/categories';
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
export function evaluateExpenseReflection(params: {
  amountPaise: number;
  categoryId: CategoryId;
  currentCategorySpentPaise: number;
  budgetPaise: number | null;
}): SpendingReflectionResult | null {
  const { amountPaise, categoryId, currentCategorySpentPaise, budgetPaise } = params;
  const category = getCategoryById(categoryId);

  if (budgetPaise && budgetPaise > 0) {
    const afterSpent = currentCategorySpentPaise + amountPaise;
    const pct = getBudgetPercentage(afterSpent, budgetPaise);
    const status = getBudgetStatus(afterSpent, budgetPaise);

    if (status === 'exceeded') {
      return {
        highestSeverity: 'exceeded',
        insights: [
          {
            severity: 'exceeded',
            message: `This expense will exceed your monthly budget for ${category.label} (${pct.toFixed(0)}% used).`,
          },
        ],
        nudge: 'Consider if this purchase can be postponed or allocated across other budget categories.',
      };
    } else if (status === 'almost' || status === 'heads-up') {
      return {
        highestSeverity: 'warning',
        insights: [
          {
            severity: 'warning',
            message: `This expense brings ${category.label} spending to ${pct.toFixed(0)}% of your budget.`,
          },
        ],
        nudge: 'You are close to your target limit for this category.',
      };
    }
  }

  return null;
}

export const generateSpendingInsights = generateDashboardInsights;

