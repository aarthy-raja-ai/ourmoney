// OurMoney — Expense Service
// CRUD + real-time subscription for expenses.
// Amounts stored in PAISE (integer).

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import type { Expense, CreateExpenseInput, UpdateExpenseInput } from '../models/expense';
import { COLLECTIONS, SUBCOLLECTIONS } from './collections';
import { toUserFriendlyError } from '../utils/errorMessages';
import { assertNoSensitiveFields } from '../utils/privacyValidation';
import { getMonthStart, getMonthEnd } from '../utils/dateUtils';

function expensesRef(householdId: string) {
  return collection(db, COLLECTIONS.HOUSEHOLDS, householdId, SUBCOLLECTIONS.EXPENSES);
}

export async function addExpense(
  householdId: string,
  input: CreateExpenseInput,
): Promise<Expense> {
  try {
    assertNoSensitiveFields(input as Record<string, unknown>);

    const cleanData: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(input)) {
      if (val !== undefined) {
        cleanData[key] = val;
      }
    }

    const createdByUserId = input.createdByUserId ?? input.paidByUserId ?? auth.currentUser?.uid ?? '';
    const paymentStatus = input.paymentStatus ?? 'paid';

    const data = {
      ...cleanData,
      paymentStatus,
      householdId,
      createdByUserId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    const ref = await addDoc(expensesRef(householdId), data);
    return {
      ...input,
      paymentStatus,
      id: ref.id,
      householdId,
      createdByUserId: input.createdByUserId ?? input.paidByUserId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
  } catch (error) {
    if (error instanceof Error && error.name === 'SensitiveFieldError') throw error;
    throw new Error(toUserFriendlyError(error, 'expense-save'));
  }
}

export async function markExpenseSettled(
  householdId: string,
  expenseId: string,
  userId: string,
): Promise<void> {
  try {
    await updateDoc(
      doc(db, COLLECTIONS.HOUSEHOLDS, householdId, SUBCOLLECTIONS.EXPENSES, expenseId),
      {
        paymentStatus: 'paid',
        settledAt: serverTimestamp(),
        settledBy: userId,
        updatedAt: serverTimestamp(),
      },
    );
  } catch (error) {
    throw new Error(toUserFriendlyError(error, 'expense-save'));
  }
}

export async function updateExpense(
  householdId: string,
  expenseId: string,
  updates: UpdateExpenseInput,
): Promise<void> {
  try {
    assertNoSensitiveFields(updates as Record<string, unknown>);
    await updateDoc(
      doc(db, COLLECTIONS.HOUSEHOLDS, householdId, SUBCOLLECTIONS.EXPENSES, expenseId),
      { ...updates, updatedAt: serverTimestamp() },
    );
  } catch (error) {
    if (error instanceof Error && error.name === 'SensitiveFieldError') throw error;
    throw new Error(toUserFriendlyError(error, 'expense-save'));
  }
}

export async function deleteExpense(
  householdId: string,
  expenseId: string,
): Promise<void> {
  try {
    await deleteDoc(
      doc(db, COLLECTIONS.HOUSEHOLDS, householdId, SUBCOLLECTIONS.EXPENSES, expenseId),
    );
  } catch (error) {
    throw new Error(toUserFriendlyError(error, 'expense-delete'));
  }
}

export const getExpenseById = getExpense;

export async function getExpense(
  householdId: string,
  expenseId: string,
): Promise<Expense | null> {
  try {
    const snap = await getDoc(
      doc(db, COLLECTIONS.HOUSEHOLDS, householdId, SUBCOLLECTIONS.EXPENSES, expenseId),
    );
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as Expense;
  } catch (error) {
    throw new Error(toUserFriendlyError(error, 'expense-fetch'));
  }
}

/**
 * Subscribe to real-time expense updates for a household.
 * Ordered by date descending, limited to avoid excessive reads.
 */
export function subscribeToExpenses(
  householdId: string,
  options: {
    month?: string; // 'YYYY-MM'
    limitCount?: number;
  },
  callback: (expenses: Expense[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  let q = query(expensesRef(householdId), orderBy('date', 'desc'));

  if (options.month) {
    const start = Timestamp.fromDate(getMonthStart(options.month));
    const end = Timestamp.fromDate(getMonthEnd(options.month));
    q = query(
      expensesRef(householdId),
      where('date', '>=', start),
      where('date', '<=', end),
      orderBy('date', 'desc'),
    );
  }

  if (options.limitCount) {
    q = query(q, limit(options.limitCount));
  }

  return onSnapshot(
    q,
    (snapshot) => {
      const expenses = snapshot.docs.map(
        (d) => ({ id: d.id, ...d.data() } as Expense),
      );
      callback(expenses);
    },
    (err) => {
      onError?.(new Error(toUserFriendlyError(err, 'expense-fetch')));
    },
  );
}

/**
 * Get expenses for a specific month (one-time fetch for calculations).
 */
export async function getExpensesForMonth(
  householdId: string,
  month: string,
): Promise<Expense[]> {
  try {
    const start = Timestamp.fromDate(getMonthStart(month));
    const end = Timestamp.fromDate(getMonthEnd(month));
    const q = query(
      expensesRef(householdId),
      where('date', '>=', start),
      where('date', '<=', end),
      orderBy('date', 'desc'),
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Expense));
  } catch (error) {
    throw new Error(toUserFriendlyError(error, 'expense-fetch'));
  }
}
