// OurMoney — Loan Service
// Full CRUD for loans and payment recording.
// PRIVACY: Never stores account numbers, bank credentials, or sensitive identifiers.
// Amounts in PAISE. Interest rates in BASIS POINTS.

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import type { Loan, CreateLoanInput, UpdateLoanInput } from '../models/loan';
import type { LoanPayment, CreateLoanPaymentInput } from '../models/loanPayment';
import { COLLECTIONS, SUBCOLLECTIONS } from './collections';
import { toUserFriendlyError } from '../utils/errorMessages';
import { assertNoSensitiveFields } from '../utils/privacyValidation';

// Privacy guard: fields that must never appear in loan data
const LOAN_BANNED_FIELDS = [
  'accountNumber', 'loanAccountNumber', 'bankAccountNumber',
  'customerID', 'cifNumber', 'upiId',
] as const;

function loansRef(householdId: string) {
  return collection(db, COLLECTIONS.HOUSEHOLDS, householdId, SUBCOLLECTIONS.LOANS);
}

function paymentsRef(householdId: string) {
  return collection(db, COLLECTIONS.HOUSEHOLDS, householdId, SUBCOLLECTIONS.LOAN_PAYMENTS);
}

function validateLoanInput(input: Record<string, unknown>): void {
  assertNoSensitiveFields(input);
  for (const field of LOAN_BANNED_FIELDS) {
    if (field in input) {
      throw new Error(`OurMoney does not store ${field} for privacy reasons.`);
    }
  }
}

export async function addLoan(
  householdId: string,
  input: CreateLoanInput,
): Promise<Loan> {
  try {
    validateLoanInput(input as Record<string, unknown>);
    const cleanInput: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(input)) {
      if (val !== undefined) {
        cleanInput[key] = val;
      }
    }
    const createdByUserId = input.createdByUserId ?? auth.currentUser?.uid ?? '';
    const data = {
      ...cleanInput,
      householdId,
      createdByUserId,
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    const ref = await addDoc(loansRef(householdId), data);
    return {
      id: ref.id,
      ...input,
      isActive: true,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
  } catch (error) {
    if (error instanceof Error && !error.message.includes('Firebase')) throw error;
    throw new Error(toUserFriendlyError(error, 'loan-save'));
  }
}

export async function updateLoan(
  householdId: string,
  loanId: string,
  updates: UpdateLoanInput,
): Promise<void> {
  try {
    console.log('[LOAN_EDIT_STARTED] Updating loanId:', loanId);
    validateLoanInput(updates as Record<string, unknown>);

    const cleanUpdates: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(updates)) {
      if (val !== undefined) {
        cleanUpdates[key] = val;
      }
    }

    await updateDoc(
      doc(db, COLLECTIONS.HOUSEHOLDS, householdId, SUBCOLLECTIONS.LOANS, loanId),
      { ...cleanUpdates, updatedAt: serverTimestamp() },
    );
    console.log('[LOAN_UPDATE_SUCCESS] Loan updated successfully.');
  } catch (error) {
    console.log('[LOAN_UPDATE_ERROR]', error);
    if (error instanceof Error && !error.message.includes('Firebase')) throw error;
    throw new Error(toUserFriendlyError(error, 'loan-save'));
  }
}

export async function deleteLoan(
  householdId: string,
  loanId: string,
): Promise<void> {
  try {
    console.log('[LOAN_DELETE_STARTED] Deleting loanId:', loanId);

    // Clean up related loan payment records to avoid orphaned documents
    try {
      const paymentsQ = query(paymentsRef(householdId), where('loanId', '==', loanId));
      const paymentsSnap = await getDocs(paymentsQ);
      const deletePromises = paymentsSnap.docs.map((pDoc) => deleteDoc(pDoc.ref));
      await Promise.all(deletePromises);
    } catch (_err) {
      // Ignore if no payments exist or payment collection index missing
    }

    await deleteDoc(
      doc(db, COLLECTIONS.HOUSEHOLDS, householdId, SUBCOLLECTIONS.LOANS, loanId),
    );
    console.log('[LOAN_DELETE_SUCCESS] Loan and related payments deleted successfully.');
  } catch (error) {
    console.log('[LOAN_DELETE_ERROR]', error);
    throw new Error(toUserFriendlyError(error, 'loan-delete'));
  }
}

export function subscribeToLoans(
  householdId: string,
  callback: (loans: Loan[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const q = query(loansRef(householdId));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Loan));
      list.sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() ?? 0;
        const bTime = b.createdAt?.toMillis?.() ?? 0;
        return bTime - aTime;
      });
      console.log('[LOAN_LIST_REFRESHED] Loaded loans count:', list.length);
      callback(list);
    },
    (err) => {
      console.log('[LOAN_FIRESTORE_WRITE_ERROR] subscribeToLoans error:', err);
      onError?.(new Error(toUserFriendlyError(err, 'loan-fetch')));
    },
  );
}

/**
 * Record a loan payment and update the outstanding balance.
 * Only adjusts outstanding by the amount explicitly recorded by the user.
 * Does NOT silently assume interest vs principal split.
 */
export async function recordLoanPayment(
  householdId: string,
  loanId: string,
  currentOutstandingPaise: number,
  payment: CreateLoanPaymentInput,
): Promise<{ newOutstandingPaise: number }> {
  try {
    assertNoSensitiveFields(payment as Record<string, unknown>);

    // Record the payment
    const cleanPayment: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(payment)) {
      if (val !== undefined) {
        cleanPayment[key] = val;
      }
    }
    const createdByUserId = payment.createdByUserId ?? payment.paidByUserId ?? auth.currentUser?.uid ?? '';
    const paymentData = {
      ...cleanPayment,
      loanId,
      householdId,
      createdByUserId,
      createdAt: serverTimestamp(),
    };
    await addDoc(paymentsRef(householdId), paymentData);

    // Update outstanding balance
    // For interest-only payments: outstanding stays same
    // For EMI / principal / custom: reduce by payment amount
    let newOutstanding = currentOutstandingPaise;

    if (payment.paymentType !== 'interest') {
      newOutstanding = Math.max(0, currentOutstandingPaise - payment.amountPaise);
    }

    await updateDoc(
      doc(db, COLLECTIONS.HOUSEHOLDS, householdId, SUBCOLLECTIONS.LOANS, loanId),
      {
        outstandingAmountPaise: newOutstanding,
        isActive: newOutstanding > 0,
        updatedAt: serverTimestamp(),
      },
    );

    return { newOutstandingPaise: newOutstanding };
  } catch (error) {
    if (error instanceof Error && !error.message.includes('Firebase')) throw error;
    throw new Error(toUserFriendlyError(error, 'payment-save'));
  }
}

export async function getLoanPayments(
  householdId: string,
  loanId: string,
): Promise<LoanPayment[]> {
  try {
    const q = query(
      paymentsRef(householdId),
      where('loanId', '==', loanId),
      orderBy('date', 'desc'),
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as LoanPayment));
  } catch (error) {
    throw new Error(toUserFriendlyError(error, 'loan-fetch'));
  }
}
