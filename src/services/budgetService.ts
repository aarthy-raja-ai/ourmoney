// OurMoney — Budget Service
// Category budgets per household per month.
// Amounts stored in PAISE.

import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  serverTimestamp,
  Timestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import type { Budget, CreateBudgetInput } from '../models/budget';
import { COLLECTIONS, SUBCOLLECTIONS } from './collections';
import { toUserFriendlyError } from '../utils/errorMessages';

function budgetsRef(householdId: string) {
  return collection(db, COLLECTIONS.HOUSEHOLDS, householdId, SUBCOLLECTIONS.BUDGETS);
}

/**
 * Set a budget for a category in a month.
 * If one already exists, replaces it (upsert by month+category).
 */
export async function setBudget(
  householdId: string,
  input: CreateBudgetInput,
): Promise<Budget> {
  try {
    const budgetId = `${input.month}_${input.categoryId}`;
    const ref = doc(db, COLLECTIONS.HOUSEHOLDS, householdId, SUBCOLLECTIONS.BUDGETS, budgetId);
    const createdByUserId = input.createdByUserId ?? auth.currentUser?.uid ?? '';
    const data = {
      ...input,
      id: budgetId,
      householdId,
      createdByUserId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await setDoc(ref, data, { merge: true });
    return {
      ...input,
      id: budgetId,
      householdId,
      createdByUserId: input.createdByUserId ?? '',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
  } catch (error) {
    throw new Error(toUserFriendlyError(error, 'budget-save'));
  }
}

export async function deleteBudget(
  householdId: string,
  budgetId: string,
): Promise<void> {
  try {
    await deleteDoc(doc(db, COLLECTIONS.HOUSEHOLDS, householdId, SUBCOLLECTIONS.BUDGETS, budgetId));
  } catch (error) {
    throw new Error(toUserFriendlyError(error, 'budget-delete'));
  }
}

/**
 * Subscribe to real-time budget updates for a month.
 */
export function subscribeToBudgets(
  householdId: string,
  month: string,
  callback: (budgets: Budget[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const q = query(budgetsRef(householdId), where('month', '==', month));
  return onSnapshot(
    q,
    (snap) => {
      callback(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Budget)));
    },
    (err) => {
      onError?.(new Error(toUserFriendlyError(err, 'budget-save')));
    },
  );
}
