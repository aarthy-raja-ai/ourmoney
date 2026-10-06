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
  query,
  where,
  getDocs,
  collection,
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
  displayName: string,
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

    // Update user's profile with householdId and displayName
    await setDoc(
      doc(db, COLLECTIONS.USERS, userId),
      {
        householdId: householdRef.id,
        displayName: displayName || 'User',
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );

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
    console.error('[createSoloHousehold] Error:', error);
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

    console.log('[INVITE_DEBUG] Creating household with invite code:', {
      code,
      householdId: householdRef.id,
      expiresAt: expiresAt.toISOString(),
      docPath: householdRef.path,
    });

    const householdData: Record<string, any> = {
      createdByUserId: userId,
      memberIds: [userId],
      inviteCode: code,
      inviteCodeExpiresAt: Timestamp.fromDate(expiresAt),
      isSolo: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(householdRef, householdData);

    // Automatically register invite code in household_invites collection
    await registerInviteCode(code, householdRef.id, expiresAt);

    // Update user's profile with householdId
    await setDoc(
      doc(db, COLLECTIONS.USERS, userId),
      {
        householdId: householdRef.id,
        displayName: displayName || 'User',
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );

    console.log('[INVITE_DEBUG] Household and invite index saved successfully.');

    return {
      id: householdRef.id,
      ...householdData,
      isSolo: false,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      inviteCodeExpiresAt: Timestamp.fromDate(expiresAt),
    } as Household;
  } catch (error) {
    console.error('[createHousehold] Error:', error);
    throw new Error(toUserFriendlyError(error, 'household-create'));
  }
}

export async function joinHousehold(
  userId: string,
  inviteCode: string,
): Promise<Household> {
  const cleanCode = inviteCode.toUpperCase().replace(/[^A-Z0-9]/g, '');
  console.log('[INVITE_DEBUG] Normalized join code entered:', cleanCode);

  if (cleanCode.length !== 6) {
    throw new Error('INVALID_CODE: Invalid invite code. Please check and try again.');
  }

  try {
    let householdId: string | null = null;
    let expiresAtTimestamp: Timestamp | null = null;
    let isCodeActive = true;

    // 1. Primary lookup: household_invites/{inviteCode}
    const lookupRef = doc(db, COLLECTIONS.HOUSEHOLD_INVITES, cleanCode);
    console.log('[INVITE_DEBUG] Step 1: Querying invite index doc:', lookupRef.path);

    try {
      const lookupSnap = await getDoc(lookupRef);
      if (lookupSnap.exists()) {
        const lookupData = lookupSnap.data() as {
          householdId: string;
          expiresAt: Timestamp;
          active?: boolean;
        };
        console.log('[INVITE_DEBUG] Found invite index data:', lookupData);
        householdId = lookupData.householdId;
        expiresAtTimestamp = lookupData.expiresAt;
        if (lookupData.active === false) {
          isCodeActive = false;
        }
      } else {
        console.log('[INVITE_DEBUG] Step 1: Invite index doc NOT found for code:', cleanCode);
      }
    } catch (indexErr) {
      console.warn('[INVITE_DEBUG] Step 1: Error reading household_invites index doc:', indexErr);
    }

    // 2. Fallback lookup: Query households collection directly by inviteCode
    if (!householdId) {
      console.log('[INVITE_DEBUG] Step 2: Fallback query on households collection where inviteCode ==', cleanCode);
      try {
        const q = query(
          collection(db, COLLECTIONS.HOUSEHOLDS),
          where('inviteCode', '==', cleanCode),
        );
        const querySnap = await getDocs(q);
        if (!querySnap.empty) {
          const matchedDoc = querySnap.docs[0];
          const matchedData = matchedDoc.data() as Household;
          console.log('[INVITE_DEBUG] Step 2: Fallback found household doc:', matchedDoc.id, matchedData);
          householdId = matchedDoc.id;
          expiresAtTimestamp = matchedData.inviteCodeExpiresAt ?? null;
          isCodeActive = true;

          // Self-repair index doc for future fast lookups
          if (expiresAtTimestamp) {
            const expDate = expiresAtTimestamp.toDate
              ? expiresAtTimestamp.toDate()
              : new Date((expiresAtTimestamp as any).seconds * 1000);
            registerInviteCode(cleanCode, householdId, expDate).catch(() => {});
          }
        } else {
          console.log('[INVITE_DEBUG] Step 2: Fallback query returned 0 matching households for code:', cleanCode);
        }
      } catch (fallbackErr) {
        console.error('[INVITE_DEBUG] Step 2: Fallback query on households collection failed:', fallbackErr);
      }
    }

    if (!householdId) {
      console.log('[INVITE_DEBUG] Invite code NOT found in index nor in households collection for code:', cleanCode);
      throw new Error('INVALID_CODE: Invalid invite code. Please check and try again.');
    }

    // 3. Expiry & Active Check
    const now = Timestamp.now();
    const isExpired = expiresAtTimestamp && expiresAtTimestamp.toMillis() < now.toMillis();
    console.log('[INVITE_DEBUG] Expiry check result:', {
      expiresAtMs: expiresAtTimestamp?.toMillis(),
      nowMs: now.toMillis(),
      isExpired,
      isCodeActive,
    });

    if (!isCodeActive || isExpired) {
      console.log('[INVITE_DEBUG] Invite code is expired or inactive.');
      throw new Error('EXPIRED_CODE: Invite code expired. Ask the household owner to generate a new code.');
    }

    // 4. Fetch target household doc
    const householdRef = doc(db, COLLECTIONS.HOUSEHOLDS, householdId);
    console.log('[INVITE_DEBUG] Fetching target household doc:', householdRef.path);
    let householdSnap;
    try {
      householdSnap = await getDoc(householdRef);
    } catch (fetchErr) {
      console.error('[INVITE_DEBUG] Firestore getDoc household failed:', fetchErr);
      throw fetchErr;
    }

    if (!householdSnap.exists()) {
      console.log('[INVITE_DEBUG] Target household document does NOT exist:', householdId);
      throw new Error('INVALID_CODE: Invalid invite code. Please check and try again.');
    }

    const householdData = householdSnap.data() as Household;
    const currentMemberIds = householdData.memberIds ?? [];
    console.log('[INVITE_DEBUG] Household retrieved. Current memberIds:', currentMemberIds);

    // 5. Check if already a member
    if (currentMemberIds.includes(userId)) {
      console.log('[INVITE_DEBUG] User is already a member of this household.');
      await setDoc(
        doc(db, COLLECTIONS.USERS, userId),
        {
          householdId: householdId,
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );
      throw new Error("You're already a member of this household.");
    }

    // 6. Check household capacity
    if (currentMemberIds.length >= MAX_HOUSEHOLD_MEMBERS) {
      console.log('[INVITE_DEBUG] Household has reached maximum capacity.');
      throw new Error('This household already has the maximum number of members.');
    }

    // 7. Join household (update memberIds, clear inviteCode, set isSolo: false)
    console.log('[INVITE_DEBUG] Updating household document to add joining member:', userId);
    await updateDoc(householdRef, {
      memberIds: arrayUnion(userId),
      isSolo: false,
      inviteCode: null,
      inviteCodeExpiresAt: null,
      updatedAt: serverTimestamp(),
    });

    // 8. Update user profile with householdId
    console.log('[INVITE_DEBUG] Updating user profile with householdId:', householdId);
    await setDoc(
      doc(db, COLLECTIONS.USERS, userId),
      {
        householdId: householdId,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );

    // 9. Deactivate invite code lookup doc if exists
    try {
      await updateDoc(lookupRef, {
        active: false,
        usedByUserId: userId,
        usedAt: serverTimestamp(),
      });
      console.log('[INVITE_DEBUG] Invite lookup doc deactivated successfully.');
    } catch (cleanErr) {
      console.log('[INVITE_DEBUG] Non-critical background cleanup notice:', cleanErr);
    }

    console.log('[INVITE_DEBUG] Join household flow COMPLETED successfully for householdId:', householdId);

    return {
      ...householdData,
      id: householdId,
      memberIds: [...currentMemberIds, userId],
      isSolo: false,
      inviteCode: null,
      inviteCodeExpiresAt: null,
    };
  } catch (error: any) {
    console.error('[INVITE_DEBUG] joinHousehold caught error:', error);
    if (error instanceof Error) {
      const msg = error.message;
      if (msg.startsWith('INVALID_CODE:') || msg.startsWith('EXPIRED_CODE:')) {
        throw error;
      }
      if (msg.includes("already a member") || msg.includes("maximum number of members")) {
        throw error;
      }
    }
    throw new Error(toUserFriendlyError(error, 'household-join'));
  }
}

/**
 * Registers an invite code in household_invites for fast lookup
 */
export async function registerInviteCode(
  inviteCode: string,
  householdId: string,
  expiresAt: Date,
): Promise<void> {
  const cleanCode = inviteCode.toUpperCase().trim();
  const docRef = doc(db, COLLECTIONS.HOUSEHOLD_INVITES, cleanCode);
  console.log('[INVITE_DEBUG] Registering invite code:', {
    code: cleanCode,
    householdId,
    path: docRef.path,
    expiresAt: expiresAt.toISOString(),
  });
  try {
    await setDoc(docRef, {
      householdId,
      expiresAt: Timestamp.fromDate(expiresAt),
      active: true,
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    console.error('[INVITE_DEBUG] Non-critical registerInviteCode notice:', err);
  }
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
        const hData = { id: snap.id, ...snap.data() } as Household;
        // Auto-ensure invite code is registered in household_invites index for fast lookups
        if (hData.inviteCode && hData.inviteCodeExpiresAt) {
          try {
            const expiresAt = typeof hData.inviteCodeExpiresAt.toDate === 'function'
              ? hData.inviteCodeExpiresAt.toDate()
              : new Date((hData.inviteCodeExpiresAt as any).seconds * 1000);
            if (expiresAt.getTime() > Date.now()) {
              registerInviteCode(hData.inviteCode, hData.id, expiresAt).catch(() => {});
            }
          } catch {
            // Non-critical background sync
          }
        }
        callback(hData);
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
        try {
          const snap = await getDoc(doc(db, COLLECTIONS.USERS, uid));
          if (snap.exists()) {
            const data = snap.data();
            return {
              userId: uid,
              displayName: data.displayName ?? 'Partner',
              photoUrl: data.photoUrl,
              joinedAt: data.createdAt ?? Timestamp.now(),
            } as HouseholdMember;
          }
        } catch (err) {
          console.log('[getMemberProfiles] Notice: Profile read restricted for uid:', uid);
        }
        return {
          userId: uid,
          displayName: 'Partner',
          joinedAt: Timestamp.now(),
        } as HouseholdMember;
      }),
    );
    return profiles;
  } catch (error) {
    console.error('[getMemberProfiles] Fallback:', error);
    return memberIds.map((uid) => ({
      userId: uid,
      displayName: 'Partner',
      joinedAt: Timestamp.now(),
    }));
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
    const householdRef = doc(db, COLLECTIONS.HOUSEHOLDS, householdId);
    console.log('[INVITE_DEBUG] Refreshing invite code for household:', householdId);
    const householdSnap = await getDoc(householdRef);

    if (!householdSnap.exists()) {
      throw new Error('Household not found.');
    }

    const householdData = householdSnap.data();
    const isMember = householdData.memberIds?.includes(userId) || householdData.createdByUserId === userId;
    if (!isMember) {
      throw new Error('Only household members can regenerate the invite code.');
    }

    const oldCode = householdData.inviteCode;
    if (oldCode) {
      try {
        const oldLookupRef = doc(db, COLLECTIONS.HOUSEHOLD_INVITES, oldCode.toUpperCase().trim());
        console.log('[INVITE_DEBUG] Invalidating old invite code lookup doc:', oldLookupRef.path);
        await updateDoc(oldLookupRef, {
          active: false,
          invalidatedAt: serverTimestamp(),
        });
      } catch (err) {
        console.log('[INVITE_DEBUG] Invalidate old code lookup notice:', err);
      }
    }

    const newCode = generateInviteCode();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + INVITE_CODE_EXPIRY_HOURS);

    console.log('[INVITE_DEBUG] Generated new invite code:', {
      newCode,
      householdId,
      expiresAt: expiresAt.toISOString(),
    });

    await updateDoc(householdRef, {
      inviteCode: newCode,
      inviteCodeExpiresAt: Timestamp.fromDate(expiresAt),
      updatedAt: serverTimestamp(),
    });

    await registerInviteCode(newCode, householdId, expiresAt);
    console.log('[INVITE_DEBUG] Invite code refresh COMPLETED successfully.');
    return newCode;
  } catch (error) {
    console.error('[INVITE_DEBUG] refreshInviteCode error:', error);
    if (error instanceof Error && !error.message.includes('Firebase')) {
      throw error;
    }
    throw new Error(toUserFriendlyError(error, 'household-create'));
  }
}
