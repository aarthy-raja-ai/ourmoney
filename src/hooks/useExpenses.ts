// OurMoney — useExpenses Hook
// Real-time Firestore listener for household expenses.

import { useState, useEffect, useCallback } from 'react';
import { subscribeToExpenses } from '../services/expenseService';
import type { Expense } from '../models/expense';
import { useHousehold } from '../context/HouseholdContext';
import { getCurrentMonth } from '../utils/dateUtils';

interface UseExpensesOptions {
  month?: string; // 'YYYY-MM', defaults to current month
  limitCount?: number;
}

interface UseExpensesResult {
  expenses: Expense[];
  isLoading: boolean;
  error: string | null;
  retry: () => void;
}

export function useExpenses(options: UseExpensesOptions = {}): UseExpensesResult {
  const { householdId } = useHousehold();
  const month = options.month ?? getCurrentMonth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  const retry = useCallback(() => setRetryKey((k) => k + 1), []);

  useEffect(() => {
    if (!householdId) {
      setExpenses([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const unsubscribe = subscribeToExpenses(
      householdId,
      { month, limitCount: options.limitCount },
      (data) => {
        setExpenses(data);
        setIsLoading(false);
      },
      (err) => {
        setError(err.message);
        setIsLoading(false);
      },
    );

    return unsubscribe;
  }, [householdId, month, options.limitCount, retryKey]);

  return { expenses, isLoading, error, retry };
}
