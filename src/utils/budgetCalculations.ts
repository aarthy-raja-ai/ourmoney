// OurMoney — Budget Calculations
// All amounts in PAISE. All calculations are deterministic.

import type { BudgetStatus } from '../models/budget';

/**
 * Determine budget status from spent vs budget amounts (both in paise).
 * below 70% → 'normal'
 * 70-89.9% → 'heads-up'
 * 90-99.9% → 'almost'
 * 100%+    → 'exceeded'
 */
export function getBudgetStatus(spentPaise: number, budgetPaise: number): BudgetStatus {
  if (budgetPaise <= 0) return 'normal';
  const pct = (spentPaise / budgetPaise) * 100;
  if (pct >= 100) return 'exceeded';
  if (pct >= 90) return 'almost';
  if (pct >= 70) return 'heads-up';
  return 'normal';
}

/**
 * Calculate percentage used (0–100+), rounded to 1 decimal place.
 */
export function getBudgetPercentage(spentPaise: number, budgetPaise: number): number {
  if (budgetPaise <= 0) return 0;
  return Math.round((spentPaise / budgetPaise) * 1000) / 10;
}

/**
 * Calculate remaining budget in paise. Negative if exceeded.
 */
export function getRemainingBudget(spentPaise: number, budgetPaise: number): number {
  return budgetPaise - spentPaise;
}

/**
 * Get a human-readable label for a budget status.
 */
export function getBudgetStatusLabel(status: BudgetStatus): string {
  switch (status) {
    case 'normal':    return 'On track';
    case 'heads-up':  return 'Heads-up';
    case 'almost':    return 'Almost reached';
    case 'exceeded':  return 'Exceeded';
  }
}

/**
 * Get a message for the budget status in the smart spending flow.
 */
export function getBudgetStatusMessage(
  categoryName: string,
  status: BudgetStatus,
  percentUsed: number,
): string {
  switch (status) {
    case 'heads-up':
      return `${categoryName} spending is at ${percentUsed.toFixed(0)}% of your monthly budget.`;
    case 'almost':
      return `You're getting close to your ${categoryName} budget (${percentUsed.toFixed(0)}% used).`;
    case 'exceeded':
      return `${categoryName} is currently above this month's budget.`;
    default:
      return `${categoryName} spending is within your usual range.`;
  }
}

/**
 * Aggregate expenses by category for a given month.
 * Returns a map of categoryId → total paise.
 */
export function aggregateByCategory(
  expenses: Array<{ categoryId: string; amountPaise: number }>,
): Record<string, number> {
  return expenses.reduce(
    (acc, exp) => ({
      ...acc,
      [exp.categoryId]: (acc[exp.categoryId] ?? 0) + exp.amountPaise,
    }),
    {} as Record<string, number>,
  );
}

/**
 * Calculate total spending from an array of expenses.
 */
export function calculateTotal(
  expenses: Array<{ amountPaise: number }>,
): number {
  return expenses.reduce((sum, e) => sum + e.amountPaise, 0);
}

/**
 * Calculate spending per user from an array of expenses.
 */
export function calculateByUser(
  expenses: Array<{ amountPaise: number; paidByUserId: string }>,
): Record<string, number> {
  return expenses.reduce(
    (acc, exp) => ({
      ...acc,
      [exp.paidByUserId]: (acc[exp.paidByUserId] ?? 0) + exp.amountPaise,
    }),
    {} as Record<string, number>,
  );
}
