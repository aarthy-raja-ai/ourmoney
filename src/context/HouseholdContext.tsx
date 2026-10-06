// OurMoney — Household Context
// Provides real-time household data, members, partner status, and loading/error states.

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
import { Timestamp } from 'firebase/firestore';
import { subscribeToHousehold, getMemberProfiles } from '../services/householdService';
import type { Household, HouseholdMember } from '../models/household';
import { useAuth } from './AuthContext';

interface HouseholdContextValue {
  household: Household | null;
  members: HouseholdMember[];
  partner: HouseholdMember | null; // the OTHER member (null in solo mode or when 1 member)
  isSolo: boolean; // true when household was created in "Just me" mode
  isPartnerLinked: boolean; // true when 2 valid members exist in household
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
    await leaveService(firebaseUser.uid, householdId);
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
        if (h && h.memberIds && h.memberIds.length > 0) {
          const idsChanged =
            h.memberIds.length !== prevMemberIdsRef.current.length ||
            h.memberIds.some((id, idx) => id !== prevMemberIdsRef.current[idx]);

          if (idsChanged || members.length !== h.memberIds.length) {
            prevMemberIdsRef.current = h.memberIds;
            try {
              const memberProfiles = await getMemberProfiles(h.memberIds);
              setMembers(memberProfiles);
            } catch (e) {
              console.warn('[HouseholdContext] Profile fetch notice:', e);
              setMembers(
                h.memberIds.map((uid) => ({
                  userId: uid,
                  displayName:
                    uid === firebaseUser?.uid
                      ? (userProfile?.displayName ?? 'Me')
                      : 'Partner',
                  joinedAt: Timestamp.now(),
                }))
              );
            }
          }
        } else {
          setMembers([]);
        }
        setIsLoading(false);
      },
      (err) => {
        console.error('[HouseholdContext] Firestore listener error:', err);
        setError(err.message);
        setIsLoading(false);
      },
    );

    return unsubscribe;
  }, [householdId, refreshKey, firebaseUser?.uid, userProfile?.displayName]);

  // Primary realtime source of truth for partner linked status: 2 member IDs in household.memberIds
  const isPartnerLinked = Boolean(household?.memberIds && household.memberIds.length >= 2);

  // Compute partner: member in household.memberIds that is NOT the current user
  const partner = useMemo(() => {
    if (!isPartnerLinked || !household?.memberIds) {
      return null;
    }
    const currentUid = firebaseUser?.uid ?? '';
    const partnerUid = household.memberIds.find((id) => id !== currentUid);
    if (!partnerUid) return null;

    const loadedProfile = members.find((m) => m.userId === partnerUid);
    if (loadedProfile) return loadedProfile;

    return {
      userId: partnerUid,
      displayName: 'Partner',
      joinedAt: Timestamp.now(),
    } as HouseholdMember;
  }, [isPartnerLinked, household?.memberIds, members, firebaseUser?.uid]);

  const isSolo = household?.isSolo === true;

  return (
    <HouseholdContext.Provider
      value={{
        household,
        members,
        partner,
        isSolo,
        isPartnerLinked,
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
