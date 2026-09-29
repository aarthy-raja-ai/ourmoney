// Unit tests for Spending Insights Service

import {
  evaluateExpenseReflection,
  generateSpendingInsights,
} from '../services/spendingInsightsService';

describe('Spending Insights Service', () => {
  test('evaluateExpenseReflection flags when expense exceeds budget limit', () => {
    const result = evaluateExpenseReflection({
      newExpensePaise: 500000, // ₹5,000
      categoryId: 'groceries',
      monthExpenses: [{ categoryId: 'groceries', amountPaise: 600000 }], // ₹6,000 already spent
      budgets: [{ id: 'b1', categoryId: 'groceries', amountPaise: 1000000 }], // ₹10,000 limit
      currentUserId: 'u1',
    });

    // Total would be ₹11,000 against ₹10,000 budget
    expect(result.shouldReflect).toBe(true);
    expect(result.highestSeverity).toBe('exceeded');
  });

  test('generateSpendingInsights returns category warnings', () => {
    const expenses: any[] = [
      { categoryId: 'dining', amountPaise: 500000 },
      { categoryId: 'dining', amountPaise: 400000 },
    ];
    const budgets: any[] = [
      { id: 'b1', categoryId: 'dining', amountPaise: 800000 }, // ₹8,000 budget, ₹9,000 spent
    ];

    const insights = generateSpendingInsights(expenses, budgets, 'u1');
    expect(insights.length).toBeGreaterThan(0);
    expect(insights[0].type).toBe('budget_exceeded');
  });
});
