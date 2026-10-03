// OurMoney — Household Context
// Provides real-time household data, members, and loading/error states.

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
  type ReactNode,
} from 'react';
import { subscribeToHousehold, getMemberProfiles } from '../services/householdService';
import type { Household, HouseholdMember } from '../models/household';
import { useAuth } from './AuthContext';

interface HouseholdContextValue {
  household: Household | null;
  members: HouseholdMember[];
  partner: HouseholdMember | null; // the OTHER member (null in solo mode)
  isSolo: boolean; // true when household was created in "Just me" mode
  isLoading: boolean;
  error: string | null;
  householdId: string | null;
  refresh: () => void;
  leaveHousehold: () => Promise<void>;
}

const HouseholdContext = createContext<HouseholdContextValue | undefined>(undefined);

export function HouseholdProvider({ children }: { children: ReactNode }) {
  const { userProfile, firebaseUser } = useAuth();
  const [household, setHousehold] = useState<Household | null>(null);
  const [members, setMembers] = useState<HouseholdMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const prevMemberIdsRef = useRef<string[]>([]);

  const householdId = userProfile?.householdId ?? null;

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  const leaveHousehold = useCallback(async () => {
    if (!firebaseUser || !householdId) return;
    const { leaveHousehold: leaveService } = await import('../services/householdService');
    await leaveService(householdId, firebaseUser.uid);
  }, [firebaseUser, householdId]);

  useEffect(() => {
    if (!householdId) {
      setHousehold(null);
      setMembers([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const unsubscribe = subscribeToHousehold(
      householdId,
      async (h) => {
        setHousehold(h);
        if (h && h.memberIds) {
          const idsChanged =
            h.memberIds.length !== prevMemberIdsRef.current.length ||
            h.memberIds.some((id, idx) => id !== prevMemberIdsRef.current[idx]);

          if (idsChanged || members.length === 0) {
            try {
              prevMemberIdsRef.current = h.memberIds;
              const memberProfiles = await getMemberProfiles(h.memberIds);
              setMembers(memberProfiles);
            } catch (e) {
              // Non-critical: member profiles failed to load
            }
          }
        }
        setIsLoading(false);
      },
      (err) => {
        setError(err.message);
        setIsLoading(false);
      },
    );

    return unsubscribe;
  }, [householdId, refreshKey]);

  const partner = useMemo(
    () => members.find((m) => m.userId !== firebaseUser?.uid) ?? null,
    [members, firebaseUser?.uid]
  );
  const isSolo = household?.isSolo === true;

  return (
    <HouseholdContext.Provider
      value={{
        household,
        members,
        partner,
        isSolo,
        isLoading,
        error,
        householdId,
        refresh,
        leaveHousehold,
      }}
    >
      {children}
    </HouseholdContext.Provider>
  );
}

export function useHousehold(): HouseholdContextValue {
  const ctx = useContext(HouseholdContext);
  if (!ctx) throw new Error('useHousehold must be used within HouseholdProvider');
  return ctx;
}
