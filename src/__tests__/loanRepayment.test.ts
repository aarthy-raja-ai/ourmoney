// OurMoney — Loan Repayment & Linked Expense Tests

import { getEffectiveCreationTimestamp, formatDateTime } from '../utils/dateUtils';
import type { Loan } from '../models/loan';
import type { LoanPayment } from '../models/loanPayment';
import type { Expense } from '../models/expense';
import { Timestamp } from 'firebase/firestore';

describe('Loan Repayment & Linked Expense Consistency', () => {
  test('creates linked expense structure with matching paymentId and category', () => {
    const paymentId = 'test-payment-123';
    const loanId = 'loan-456';
    const householdId = 'household-789';

    const loanPayment: Partial<LoanPayment> = {
      id: paymentId,
      loanId,
      householdId,
      amountPaise: 1177000,
      paymentType: 'emi',
      expenseId: paymentId,
      createdByUserId: 'user-1',
    };

    const linkedExpense: Partial<Expense> = {
      id: paymentId,
      householdId,
      amountPaise: 1177000,
      categoryId: 'bills',
      description: 'Loan EMI: HDFC Bank',
      loanId,
      loanPaymentId: paymentId,
      createdByUserId: 'user-1',
    };

    expect(loanPayment.expenseId).toBe(linkedExpense.id);
    expect(linkedExpense.loanPaymentId).toBe(loanPayment.id);
    expect(linkedExpense.categoryId).toBe('bills');
    expect(linkedExpense.householdId).toBe(householdId);
  });

  test('reduces remainingRepaymentBalancePaise and outstandingAmountPaise on EMI payment', () => {
    const loan: Partial<Loan> = {
      id: 'loan-1',
      originalAmountPaise: 20000000, // ₹2,00,000
      outstandingAmountPaise: 20000000,
      totalScheduledRepaymentPaise: 22400000, // ₹2,24,000
      remainingRepaymentBalancePaise: 22400000,
      totalAmountPaidPaise: 0,
    };

    const paymentAmountPaise = 1866667; // ₹18,666.67

    const newOutstanding = Math.max(0, (loan.outstandingAmountPaise ?? 0) - paymentAmountPaise);
    const newRemainingRepayment = Math.max(0, (loan.remainingRepaymentBalancePaise ?? 0) - paymentAmountPaise);
    const newTotalPaid = (loan.totalAmountPaidPaise ?? 0) + paymentAmountPaise;

    expect(newOutstanding).toBe(18133333);
    expect(newRemainingRepayment).toBe(20533333);
    expect(newTotalPaid).toBe(1866667);
  });
});

describe('Timestamp Display & Legacy Transaction Fallback', () => {
  test('falls back to effective date if createdAt is missing on legacy transaction', () => {
    const legacyDate = new Date('2025-06-15T10:00:00Z');
    const legacyRecord = {
      createdAt: undefined,
      date: legacyDate,
    };

    const effectiveDate = getEffectiveCreationTimestamp(legacyRecord);
    expect(effectiveDate.toISOString()).toBe(legacyDate.toISOString());
  });

  test('uses createdAt when available', () => {
    const createDate = new Date('2026-10-09T12:00:00Z');
    const txDate = new Date('2026-10-01T00:00:00Z');

    const record = {
      createdAt: Timestamp.fromDate(createDate),
      date: Timestamp.fromDate(txDate),
    };

    const effectiveDate = getEffectiveCreationTimestamp(record);
    expect(effectiveDate.getTime()).toBe(createDate.getTime());
  });

  test('formats local timezone datetime string', () => {
    const testDate = new Date(2026, 9, 9, 14, 30); // Oct 9, 2026 2:30 PM
    const formatted = formatDateTime(testDate);
    expect(formatted).toContain('Oct');
    expect(formatted).toContain('2026');
  });
});
