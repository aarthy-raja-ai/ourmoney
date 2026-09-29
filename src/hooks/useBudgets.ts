// OurMoney — useBudgets Hook

import { useState, useEffect, useCallback } from 'react';
import { subscribeToBudgets } from '../services/budgetService';
import type { Budget } from '../models/budget';
import { useHousehold } from '../context/HouseholdContext';
import { getCurrentMonth } from '../utils/dateUtils';

interface UseBudgetsResult {
  budgets: Budget[];
  budgetsMap: Record<string, Budget>; // categoryId → Budget
  isLoading: boolean;
  error: string | null;
  retry: () => void;
}

export function useBudgets(month?: string): UseBudgetsResult {
  const { householdId } = useHousehold();
  const targetMonth = month ?? getCurrentMonth();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  const retry = useCallback(() => setRetryKey((k) => k + 1), []);

  useEffect(() => {
    if (!householdId) {
      setBudgets([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const unsubscribe = subscribeToBudgets(
      householdId,
      targetMonth,
      (data) => {
        setBudgets(data);
        setIsLoading(false);
      },
      (err) => {
        setError(err.message);
        setIsLoading(false);
      },
    );

    return unsubscribe;
  }, [householdId, targetMonth, retryKey]);

  const budgetsMap = budgets.reduce(
    (acc, b) => ({ ...acc, [b.categoryId]: b }),
    {} as Record<string, Budget>,
  );

  return { budgets, budgetsMap, isLoading, error, retry };
}
