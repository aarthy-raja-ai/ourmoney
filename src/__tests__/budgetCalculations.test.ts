// Unit tests for Budget Calculations

import {
  getBudgetStatus,
  getBudgetPercentage,
  getRemainingBudget,
  aggregateByCategory,
  calculateTotal,
  calculateByUser,
} from '../utils/budgetCalculations';

describe('Budget Calculations', () => {
  test('getBudgetStatus returns correct thresholds', () => {
    expect(getBudgetStatus(5000, 10000)).toBe('normal');   // 50%
    expect(getBudgetStatus(7500, 10000)).toBe('heads-up'); // 75%
    expect(getBudgetStatus(9200, 10000)).toBe('almost');   // 92%
    expect(getBudgetStatus(10500, 10000)).toBe('exceeded'); // 105%
  });

  test('getBudgetPercentage calculates rounded percentage', () => {
    expect(getBudgetPercentage(5000, 10000)).toBe(50);
    expect(getBudgetPercentage(3333, 10000)).toBe(33.3);
  });

  test('getRemainingBudget calculates remaining balance', () => {
    expect(getRemainingBudget(7000, 10000)).toBe(3000);
    expect(getRemainingBudget(12000, 10000)).toBe(-2000);
  });

  test('aggregateByCategory sums expenses per category', () => {
    const expenses = [
      { categoryId: 'groceries', amountPaise: 5000 },
      { categoryId: 'groceries', amountPaise: 3000 },
      { categoryId: 'food', amountPaise: 2000 },
    ];

    const result = aggregateByCategory(expenses);
    expect(result['groceries']).toBe(8000);
    expect(result['food']).toBe(2000);
  });

  test('calculateTotal sums all expenses', () => {
    const expenses = [{ amountPaise: 1000 }, { amountPaise: 2500 }];
    expect(calculateTotal(expenses)).toBe(3500);
  });

  test('calculateByUser sums expenses per user', () => {
    const expenses = [
      { amountPaise: 1000, paidByUserId: 'user1' },
      { amountPaise: 2000, paidByUserId: 'user2' },
      { amountPaise: 1500, paidByUserId: 'user1' },
    ];
    const result = calculateByUser(expenses);
    expect(result['user1']).toBe(2500);
    expect(result['user2']).toBe(2000);
  });
});
