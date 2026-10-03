// OurMoney — Pending Purchase Service
// Firestore CRUD and real-time subscription for short-term household purchases awaiting settlement.

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import type {
  PendingPurchase,
  CreatePendingPurchaseInput,
  UpdatePendingPurchaseInput,
} from '../models/pendingPurchase';
import { COLLECTIONS, SUBCOLLECTIONS } from './collections';
import { addExpense } from './expenseService';
import { toUserFriendlyError } from '../utils/errorMessages';
import { assertNoSensitiveFields } from '../utils/privacyValidation';
import type { PaymentMethodId } from '../constants/paymentMethods';

function pendingRef(householdId: string) {
  return collection(db, COLLECTIONS.HOUSEHOLDS, householdId, SUBCOLLECTIONS.PENDING_PURCHASES);
}

export async function addPendingPurchase(
  householdId: string,
  input: CreatePendingPurchaseInput,
  userId?: string,
): Promise<PendingPurchase> {
  try {
    assertNoSensitiveFields(input as Record<string, unknown>);

    const createdBy = userId ?? input.createdBy ?? auth.currentUser?.uid ?? '';
    const cleanData: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(input)) {
      if (val !== undefined) cleanData[key] = val;
    }

    const data = {
      ...cleanData,
      householdId,
      createdBy,
      status: 'PENDING',
      createdAt: serverTimestamp(),
    };

    const ref = await addDoc(pendingRef(householdId), data);

    return {
      ...input,
      id: ref.id,
      householdId,
      createdBy,
      status: 'PENDING',
      createdAt: Timestamp.now(),
    };
  } catch (error) {
    if (error instanceof Error && error.name === 'SensitiveFieldError') throw error;
    throw new Error(toUserFriendlyError(error, 'pending-save'));
  }
}

export async function markPendingPurchaseSettled(params: {
  householdId: string;
  pendingPurchaseId: string;
  userId: string;
  paymentMethod?: PaymentMethodId;
  createExpense?: boolean;
}): Promise<void> {
  const { householdId, pendingPurchaseId, userId, paymentMethod = 'cash', createExpense = false } = params;

  try {
    const docRef = doc(
      db,
      COLLECTIONS.HOUSEHOLDS,
      householdId,
      SUBCOLLECTIONS.PENDING_PURCHASES,
      pendingPurchaseId,
    );

    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      throw new Error('Pending purchase not found');
    }

    const item = snap.data() as PendingPurchase;

    let createdExpenseId: string | null = item.expenseId ?? null;

    // Handle controlled expense conversion if user opted to create a standard household expense entry on settlement
    // and no expense was already created for it
    if (createExpense && !createdExpenseId) {
      const newExpense = await addExpense(householdId, {
        amountPaise: item.amountMinor,
        categoryId: item.category,
        description: item.title,
        paidByUserId: userId,
        createdByUserId: userId,
        paymentMethod: paymentMethod,
        date: Timestamp.now(),
        notes: item.merchantOrPerson
          ? `Settled pending purchase at ${item.merchantOrPerson}`
          : 'Settled pending purchase',
      });
      createdExpenseId = newExpense.id;
    }

    await updateDoc(docRef, {
      status: 'SETTLED',
      settledAt: serverTimestamp(),
      settledBy: userId,
      paymentMethod,
      expenseId: createdExpenseId,
    });
  } catch (error) {
    throw new Error(toUserFriendlyError(error, 'pending-settle'));
  }
}

export async function updatePendingPurchase(
  householdId: string,
  pendingPurchaseId: string,
  updates: UpdatePendingPurchaseInput,
): Promise<void> {
  try {
    assertNoSensitiveFields(updates as Record<string, unknown>);
    const docRef = doc(
      db,
      COLLECTIONS.HOUSEHOLDS,
      householdId,
      SUBCOLLECTIONS.PENDING_PURCHASES,
      pendingPurchaseId,
    );
    await updateDoc(docRef, updates);
  } catch (error) {
    if (error instanceof Error && error.name === 'SensitiveFieldError') throw error;
    throw new Error(toUserFriendlyError(error, 'pending-save'));
  }
}

export async function deletePendingPurchase(
  householdId: string,
  pendingPurchaseId: string,
): Promise<void> {
  try {
    const docRef = doc(
      db,
      COLLECTIONS.HOUSEHOLDS,
      householdId,
      SUBCOLLECTIONS.PENDING_PURCHASES,
      pendingPurchaseId,
    );
    await deleteDoc(docRef);
  } catch (error) {
    throw new Error(toUserFriendlyError(error, 'pending-delete'));
  }
}

/**
 * Real-time listener for household pending purchases.
 */
export function subscribeToPendingPurchases(
  householdId: string,
  callback: (items: PendingPurchase[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    pendingRef(householdId),
    (snapshot) => {
      const items = snapshot.docs.map(
        (d) => ({ id: d.id, ...d.data() } as PendingPurchase),
      );
      items.sort((a, b) => {
        const timeA = a.createdAt instanceof Timestamp ? a.createdAt.toMillis() : Date.now();
        const timeB = b.createdAt instanceof Timestamp ? b.createdAt.toMillis() : Date.now();
        return timeB - timeA;
      });
      callback(items);
    },
    (err) => {
      console.error('[PENDING_DEBUG] subscribeToPendingPurchases error:', err);
      onError?.(new Error(toUserFriendlyError(err, 'pending-fetch')));
    },
  );
}
