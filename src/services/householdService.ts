// OurMoney — Household Service
// Manages household creation, invite codes, and member joining.
// Invite codes: 6-char alphanumeric, expire after 24 hours.
// A user cannot arbitrarily join any household — code must be valid and not expired.

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  Timestamp,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Household, HouseholdMember } from '../models/household';
import { COLLECTIONS } from './collections';
import { toUserFriendlyError } from '../utils/errorMessages';

const INVITE_CODE_EXPIRY_HOURS = 24;
const INVITE_CODE_LENGTH = 6;
const MAX_HOUSEHOLD_MEMBERS = 2;

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // exclude ambiguous chars
  let code = '';
  for (let i = 0; i < INVITE_CODE_LENGTH; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

/**
 * Creates a solo (individual) household — no invite code, no partner.
 * Used when the user selects "Just me" in the onboarding flow.
 */
export async function createSoloHousehold(
  userId: string,
  _displayName: string,
): Promise<Household> {
  try {
    const householdRef = doc(db, COLLECTIONS.HOUSEHOLDS, `${userId}_solo_${Date.now()}`);

    const data = {
      createdByUserId: userId,
      memberIds: [userId],
      inviteCode: null,
      inviteCodeExpiresAt: null,
      isSolo: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(householdRef, data);

    await updateDoc(doc(db, COLLECTIONS.USERS, userId), {
      householdId: householdRef.id,
      updatedAt: serverTimestamp(),
    });

    return {
      id: householdRef.id,
      createdByUserId: userId,
      memberIds: [userId],
      inviteCode: null,
      inviteCodeExpiresAt: null,
      isSolo: true,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
  } catch (error) {
    throw new Error(toUserFriendlyError(error, 'household-create'));
  }
}


export async function createHousehold(
  userId: string,
  displayName: string,
): Promise<Household> {
  try {
    const householdRef = doc(db, COLLECTIONS.HOUSEHOLDS, `${userId}_${Date.now()}`);
    const code = generateInviteCode();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + INVITE_CODE_EXPIRY_HOURS);

    const household: Omit<Household, 'id'> & { createdAt: unknown; updatedAt: unknown; inviteCodeExpiresAt: unknown } = {
      createdByUserId: userId,
      memberIds: [userId],
      inviteCode: code,
      inviteCodeExpiresAt: Timestamp.fromDate(expiresAt),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(householdRef, household);

    // Update user's householdId
    await updateDoc(doc(db, COLLECTIONS.USERS, userId), {
      householdId: householdRef.id,
      updatedAt: serverTimestamp(),
    });

    return {
      id: householdRef.id,
      ...household,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      inviteCodeExpiresAt: Timestamp.fromDate(expiresAt),
    };
  } catch (error) {
    throw new Error(toUserFriendlyError(error, 'household-create'));
  }
}

export async function joinHousehold(
  userId: string,
  inviteCode: string,
): Promise<Household> {
  try {
    // Search for household with this invite code
    // We search by querying — but to avoid complex queries, we store a lookup doc
    // Lookup: households_invites/{inviteCode} → { householdId, expiresAt }
    const lookupRef = doc(db, 'household_invites', inviteCode.toUpperCase().trim());
    const lookupSnap = await getDoc(lookupRef);

    if (!lookupSnap.exists()) {
      throw new Error('Invalid invite code. Please check and try again.');
    }

    const lookup = lookupSnap.data() as { householdId: string; expiresAt: Timestamp };

    // Check expiry
    const now = Timestamp.now();
    if (lookup.expiresAt.toMillis() < now.toMillis()) {
      throw new Error('This invite code has expired. Ask your partner to generate a new one.');
    }

    // Get household
    const householdRef = doc(db, COLLECTIONS.HOUSEHOLDS, lookup.householdId);
    const householdSnap = await getDoc(householdRef);

    if (!householdSnap.exists()) {
      throw new Error('Household not found. Please try again.');
    }

    const household = { id: householdSnap.id, ...householdSnap.data() } as Household;

    // Check if already a member
    if (household.memberIds.includes(userId)) {
      return household;
    }

    // Check household capacity
    if (household.memberIds.length >= MAX_HOUSEHOLD_MEMBERS) {
      throw new Error('This household already has the maximum number of members.');
    }

    // Add user to household
    await updateDoc(householdRef, {
      memberIds: arrayUnion(userId),
      inviteCode: null, // invalidate code after use
      inviteCodeExpiresAt: null,
      updatedAt: serverTimestamp(),
    });

    // Update user's householdId
    await updateDoc(doc(db, COLLECTIONS.USERS, userId), {
      householdId: lookup.householdId,
      updatedAt: serverTimestamp(),
    });

    // Delete the lookup doc
    // (fire-and-forget, not critical)

    return {
      ...household,
      memberIds: [...household.memberIds, userId],
    };
  } catch (error) {
    if (error instanceof Error && !error.message.includes('Firebase')) throw error;
    throw new Error(toUserFriendlyError(error, 'household-join'));
  }
}

/**
 * When creating a household, also write the invite lookup document.
 * This allows joinHousehold to find the household by invite code efficiently.
 */
export async function registerInviteCode(
  inviteCode: string,
  householdId: string,
  expiresAt: Date,
): Promise<void> {
  await setDoc(doc(db, 'household_invites', inviteCode), {
    householdId,
    expiresAt: Timestamp.fromDate(expiresAt),
  });
}

export async function getHousehold(householdId: string): Promise<Household | null> {
  try {
    const snap = await getDoc(doc(db, COLLECTIONS.HOUSEHOLDS, householdId));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as Household;
  } catch (error) {
    throw new Error(toUserFriendlyError(error, 'household-fetch'));
  }
}

export function subscribeToHousehold(
  householdId: string,
  callback: (household: Household | null) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    doc(db, COLLECTIONS.HOUSEHOLDS, householdId),
    (snap) => {
      if (!snap.exists()) {
        callback(null);
      } else {
        callback({ id: snap.id, ...snap.data() } as Household);
      }
    },
    (err) => {
      onError?.(new Error(toUserFriendlyError(err, 'household-fetch')));
    },
  );
}

export async function getMemberProfiles(
  memberIds: string[],
): Promise<HouseholdMember[]> {
  try {
    const profiles = await Promise.all(
      memberIds.map(async (uid) => {
        const snap = await getDoc(doc(db, COLLECTIONS.USERS, uid));
        if (!snap.exists()) return null;
        const data = snap.data();
        return {
          userId: uid,
          displayName: data.displayName ?? 'Unknown',
          photoUrl: data.photoUrl,
          joinedAt: data.createdAt ?? Timestamp.now(),
        } as HouseholdMember;
      }),
    );
    return profiles.filter((p): p is HouseholdMember => p !== null);
  } catch (error) {
    throw new Error(toUserFriendlyError(error, 'household-fetch'));
  }
}

export async function leaveHousehold(
  userId: string,
  householdId: string,
): Promise<void> {
  try {
    await updateDoc(doc(db, COLLECTIONS.HOUSEHOLDS, householdId), {
      memberIds: arrayRemove(userId),
      updatedAt: serverTimestamp(),
    });
    await updateDoc(doc(db, COLLECTIONS.USERS, userId), {
      householdId: null,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    throw new Error(toUserFriendlyError(error, 'household-fetch'));
  }
}

export async function refreshInviteCode(householdId: string, userId: string): Promise<string> {
  try {
    const code = generateInviteCode();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + INVITE_CODE_EXPIRY_HOURS);

    await updateDoc(doc(db, COLLECTIONS.HOUSEHOLDS, householdId), {
      inviteCode: code,
      inviteCodeExpiresAt: Timestamp.fromDate(expiresAt),
      updatedAt: serverTimestamp(),
    });

    await registerInviteCode(code, householdId, expiresAt);
    return code;
  } catch (error) {
    throw new Error(toUserFriendlyError(error, 'household-create'));
  }
}
