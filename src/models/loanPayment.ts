// OurMoney — Loan Payment Model
// Records actual repayments made against a loan.
// Amounts stored in PAISE (integer).

import { Timestamp } from 'firebase/firestore';

export type LoanPaymentType =
  | 'interest'
  | 'principal'
  | 'emi'            // covers both principal + interest
  | 'custom';

export interface LoanPayment {
  id: string;
  loanId: string;
  householdId: string;
  amountPaise: number;
  paymentType: LoanPaymentType;
  date: Timestamp;
  notes?: string;
  createdByUserId: string;
  paidByUserId?: string;
  paidByUserName?: string;
  expenseId?: string;
  createdAt: Timestamp;
}

export type CreateLoanPaymentInput = Omit<LoanPayment, 'id' | 'createdAt' | 'householdId' | 'loanId' | 'createdByUserId'> & {
  householdId?: string;
  loanId?: string;
  createdByUserId?: string;
};

export interface LoanPaymentFormValues {
  amountRupees: string;
  paymentType: LoanPaymentType;
  date: Date;
  notes: string;
}
