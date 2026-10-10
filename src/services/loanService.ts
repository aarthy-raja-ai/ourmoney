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
  runTransaction,
  Timestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import type { Loan, CreateLoanInput, UpdateLoanInput } from '../models/loan';
import type { LoanPayment, CreateLoanPaymentInput } from '../models/loanPayment';
import { COLLECTIONS, SUBCOLLECTIONS } from './collections';
import { toUserFriendlyError } from '../utils/errorMessages';
import { assertNoSensitiveFields } from '../utils/privacyValidation';
import { calculateExistingLoanState, resolveLoanInterestRate } from '../utils/loanCalculations';

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

/**
 * Register historical EMI payment logs for an existing loan without creating duplicate expenses.
 */
export async function registerHistoricalLoanPayments(
  householdId: string,
  loanId: string,
  schedule: Array<{ installmentNumber: number; paymentPaise: number }>,
  completedCount: number,
  userId: string,
  userName?: string,
): Promise<void> {
  try {
    const batchPromises = [];
    const now = new Date();

    for (let i = 0; i < completedCount && i < schedule.length; i++) {
      const item = schedule[i];
      const paymentDate = new Date(now);
      paymentDate.setMonth(now.getMonth() - (completedCount - i));

      const paymentData = {
        loanId,
        householdId,
        amountPaise: item.paymentPaise,
        paymentType: 'emi',
        date: Timestamp.fromDate(paymentDate),
        notes: `Historical EMI #${item.installmentNumber}`,
        createdByUserId: userId,
        paidByUserId: userId,
        paidByUserName: userName ?? 'User',
        createdAt: serverTimestamp(),
      };

      batchPromises.push(addDoc(paymentsRef(householdId), paymentData));
    }

    await Promise.all(batchPromises);
  } catch (err) {
    console.log('[HISTORICAL_PAYMENTS_REGISTER_ERROR]', err);
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

function expensesRef(householdId: string) {
  return collection(db, COLLECTIONS.HOUSEHOLDS, householdId, SUBCOLLECTIONS.EXPENSES);
}

/**
 * Record a loan payment, create linked household expense, and update the outstanding balance.
 * Uses atomic Firestore transaction to prevent duplicate expenses on retries or double submission.
 */
export async function recordLoanPayment(
  householdId: string,
  loanId: string,
  currentOutstandingPaise: number,
  payment: CreateLoanPaymentInput,
): Promise<{ newOutstandingPaise: number }> {
  try {
    assertNoSensitiveFields(payment as Record<string, unknown>);

    const createdByUserId = payment.createdByUserId ?? payment.paidByUserId ?? auth.currentUser?.uid ?? '';
    const paymentDocRef = doc(paymentsRef(householdId));
    const paymentId = paymentDocRef.id;
    const expenseDocRef = doc(expensesRef(householdId), paymentId);
    const loanDocRef = doc(db, COLLECTIONS.HOUSEHOLDS, householdId, SUBCOLLECTIONS.LOANS, loanId);

    let newOutstandingResult = currentOutstandingPaise;

    await runTransaction(db, async (transaction) => {
      const loanSnap = await transaction.get(loanDocRef);
      if (!loanSnap.exists()) {
        throw new Error('Loan document not found.');
      }
      const loanData = loanSnap.data() as Loan;

      // Idempotency check: if expenseDocRef already exists, abort duplicate write
      const existingExpenseSnap = await transaction.get(expenseDocRef);
      if (existingExpenseSnap.exists()) {
        newOutstandingResult = loanData.outstandingAmountPaise;
        return;
      }

      const isInterestOnly = payment.paymentType === 'interest';
      const isPrincipalOnly = payment.paymentType === 'principal';

      let newCompleted = loanData.completedInstallments ?? 0;
      let newOutstanding = loanData.outstandingAmountPaise;
      let newRemainingRepayment = loanData.remainingRepaymentBalancePaise;
      let rateToPersist = loanData.interestRateBps;

      if (isInterestOnly) {
        newOutstanding = loanData.outstandingAmountPaise;
        newRemainingRepayment = Math.max(
          0,
          (loanData.remainingRepaymentBalancePaise ?? newOutstanding) - payment.amountPaise,
        );
      } else if (isPrincipalOnly) {
        newOutstanding = Math.max(0, loanData.outstandingAmountPaise - payment.amountPaise);
        newRemainingRepayment = Math.max(
          0,
          (loanData.remainingRepaymentBalancePaise ?? newOutstanding) - payment.amountPaise,
        );
      } else {
        // Standard EMI payment
        newCompleted = newCompleted + 1;

        if (loanData.originalAmountPaise > 0 && loanData.tenureMonths) {
          const resolvedRate = resolveLoanInterestRate({
            interestType: loanData.interestType,
            interestRateBps: loanData.interestRateBps,
            principalPaise: loanData.originalAmountPaise,
            monthlyEmiPaise: loanData.plannedPaymentPaise || payment.amountPaise,
            tenureMonths: loanData.tenureMonths,
          });

          const rateToUse = resolvedRate.isValid ? resolvedRate.rateBps : loanData.interestRateBps;
          if (loanData.interestRateBps === 0 && rateToUse > 0) {
            rateToPersist = rateToUse;
          }

          const updatedState = calculateExistingLoanState({
            originalPrincipalPaise: loanData.originalAmountPaise,
            annualRateBps: rateToUse,
            totalTenureMonths: loanData.tenureMonths,
            completedInstallments: newCompleted,
            monthlyEmiPaise: loanData.plannedPaymentPaise || payment.amountPaise,
            interestType: loanData.interestType,
            lenderOutstandingPaise: loanData.isLenderOutstandingConfirmed
              ? Math.max(0, loanData.outstandingAmountPaise - payment.amountPaise)
              : undefined,
            lenderRemainingRepaymentPaise: loanData.isLenderRemainingRepaymentConfirmed
              ? Math.max(0, (loanData.remainingRepaymentBalancePaise ?? 0) - payment.amountPaise)
              : undefined,
          });

          newOutstanding = updatedState.finalOutstandingPrincipalPaise;
          newRemainingRepayment = updatedState.finalRemainingRepaymentPaise;
        } else {
          newOutstanding = Math.max(0, loanData.outstandingAmountPaise - payment.amountPaise);
          newRemainingRepayment = Math.max(
            0,
            (loanData.remainingRepaymentBalancePaise ?? newOutstanding) - payment.amountPaise,
          );
        }
      }

      const prevTotalPaid = loanData.totalAmountPaidPaise ?? 0;
      const newTotalPaid = prevTotalPaid + payment.amountPaise;

      newOutstandingResult = newOutstanding;

      const cleanPayment: Record<string, unknown> = {};
      for (const [key, val] of Object.entries(payment)) {
        if (val !== undefined) cleanPayment[key] = val;
      }

      // Write LoanPayment document
      transaction.set(paymentDocRef, {
        ...cleanPayment,
        id: paymentId,
        loanId,
        householdId,
        createdByUserId,
        expenseId: paymentId,
        createdAt: serverTimestamp(),
      });

      // Write linked Expense document
      const lenderName = loanData.lenderName || 'Loan';
      const expenseDescription = `Loan EMI: ${lenderName}`;

      transaction.set(expenseDocRef, {
        id: paymentId,
        householdId,
        amountPaise: payment.amountPaise,
        categoryId: 'financial_loans',
        subcategoryId: 'loan_emi',
        description: expenseDescription,
        paidByUserId: payment.paidByUserId ?? createdByUserId,
        paidByUserName: payment.paidByUserName,
        createdByUserId,
        paymentMethod: 'upi',
        paymentStatus: 'paid',
        date: payment.date,
        notes: payment.notes ? `[EMI Payment for ${lenderName}] ${payment.notes}` : `[EMI Payment for ${lenderName}]`,
        loanId,
        loanPaymentId: paymentId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Update Loan document
      const loanUpdates: Record<string, unknown> = {
        completedInstallments: newCompleted,
        outstandingAmountPaise: newOutstanding,
        totalAmountPaidPaise: newTotalPaid,
        remainingRepaymentBalancePaise: newRemainingRepayment,
        isActive: newOutstanding > 0 || newRemainingRepayment > 0,
        updatedAt: serverTimestamp(),
      };
      if (rateToPersist > 0 && loanData.interestRateBps === 0) {
        loanUpdates.interestRateBps = rateToPersist;
      }

      transaction.update(loanDocRef, loanUpdates);
    });

    return { newOutstandingPaise: newOutstandingResult };
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
