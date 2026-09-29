// OurMoney — useLoans Hook

import { useState, useEffect, useCallback } from 'react';
import { subscribeToLoans } from '../services/loanService';
import type { Loan } from '../models/loan';
import { useHousehold } from '../context/HouseholdContext';

interface UseLoansResult {
  loans: Loan[];
  totalOutstandingPaise: number;
  activeCount: number;
  isLoading: boolean;
  error: string | null;
  retry: () => void;
}

export function useLoans(): UseLoansResult {
  const { householdId } = useHousehold();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  const retry = useCallback(() => setRetryKey((k) => k + 1), []);

  useEffect(() => {
    if (!householdId) {
      setLoans([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const unsubscribe = subscribeToLoans(
      householdId,
      (data) => {
        setLoans(data);
        setIsLoading(false);
      },
      (err) => {
        setError(err.message);
        setIsLoading(false);
      },
    );

    return unsubscribe;
  }, [householdId, retryKey]);

  const totalOutstandingPaise = loans.reduce((sum, l) => sum + l.outstandingAmountPaise, 0);
  const activeCount = loans.filter((l) => l.isActive).length;

  return { loans, totalOutstandingPaise, activeCount, isLoading, error, retry };
}
