// OurMoney — usePendingPurchases Hook
// Real-time Firestore listener for household pending purchases.

import { useState, useEffect, useCallback, useMemo } from 'react';
import { subscribeToPendingPurchases } from '../services/pendingPurchaseService';
import type { PendingPurchase } from '../models/pendingPurchase';
import { useHousehold } from '../context/HouseholdContext';
import { Timestamp } from 'firebase/firestore';

interface UsePendingPurchasesResult {
  pendingPurchases: PendingPurchase[];
  activePending: PendingPurchase[];
  settledPending: PendingPurchase[];
  totalPendingMinor: number;
  overdueCount: number;
  isLoading: boolean;
  error: string | null;
  retry: () => void;
}

export function usePendingPurchases(): UsePendingPurchasesResult {
  const { householdId } = useHousehold();
  const [pendingPurchases, setPendingPurchases] = useState<PendingPurchase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  const retry = useCallback(() => setRetryKey((k) => k + 1), []);

  useEffect(() => {
    if (!householdId) {
      setPendingPurchases([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const unsubscribe = subscribeToPendingPurchases(
      householdId,
      (data) => {
        setPendingPurchases(data);
        setIsLoading(false);
      },
      (err) => {
        setError(err.message);
        setIsLoading(false);
      },
    );

    return unsubscribe;
  }, [householdId, retryKey]);

  const activePending = useMemo(() => {
    return pendingPurchases.filter((item) => item.status === 'PENDING');
  }, [pendingPurchases]);

  const settledPending = useMemo(() => {
    return pendingPurchases.filter((item) => item.status === 'SETTLED');
  }, [pendingPurchases]);

  const totalPendingMinor = useMemo(() => {
    return activePending.reduce((sum, item) => sum + item.amountMinor, 0);
  }, [activePending]);

  const overdueCount = useMemo(() => {
    const now = new Date();
    // Compare at midnight start of today
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    return activePending.filter((item) => {
      if (!item.dueDate) return false;
      const dueTime = item.dueDate instanceof Timestamp ? item.dueDate.toMillis() : new Date(item.dueDate).getTime();
      return dueTime < startOfToday;
    }).length;
  }, [activePending]);

  return {
    pendingPurchases,
    activePending,
    settledPending,
    totalPendingMinor,
    overdueCount,
    isLoading,
    error,
    retry,
  };
}
