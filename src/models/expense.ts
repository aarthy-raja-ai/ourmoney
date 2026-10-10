// OurMoney — Expense Model
// Amounts stored in PAISE (integer) to avoid floating-point arithmetic errors.
// Example: ₹850.50 is stored as 85050.

import { Timestamp } from 'firebase/firestore';
import type { CategoryId } from '../constants/categories';
import type { PaymentMethodId } from '../constants/paymentMethods';

export interface Expense {
  id: string;
  householdId: string;
  amountPaise: number; // integer, paise
  categoryId: CategoryId;
  subcategoryId?: string;
  autoCategorized?: boolean;
  description: string;
  paidByUserId: string;
  paidByUserName?: string;
  createdByUserId: string;
  paymentMethod: PaymentMethodId;
  paymentStatus?: 'paid' | 'credit';
  settledAt?: Timestamp | null;
  settledBy?: string | null;
  date: Timestamp;
  notes?: string;
  splitRatio?: string;
  userPaidPaise?: number;
  partnerPaidPaise?: number;
  loanId?: string;
  loanPaymentId?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type PaymentMethod = PaymentMethodId;

export type CreateExpenseInput = Omit<Expense, 'id' | 'createdAt' | 'updatedAt' | 'householdId' | 'createdByUserId'> & {
  householdId?: string;
  createdByUserId?: string;
};
export type UpdateExpenseInput = Partial<
  Pick<Expense, 'amountPaise' | 'categoryId' | 'subcategoryId' | 'autoCategorized' | 'description' | 'paidByUserId' | 'paymentMethod' | 'paymentStatus' | 'settledAt' | 'settledBy' | 'date' | 'notes'>
>;

// For UI forms — uses rupees (number) before conversion to paise
export interface ExpenseFormValues {
  amountRupees: string; // string for input control
  categoryId: CategoryId;
  subcategoryId?: string;
  autoCategorized?: boolean;
  description: string;
  paidByUserId: string;
  paymentMethod: PaymentMethodId;
  paymentStatus: 'paid' | 'credit';
  date: Date;
  notes: string;
}
