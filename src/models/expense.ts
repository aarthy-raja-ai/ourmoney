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
  description: string;
  paidByUserId: string;
  createdByUserId: string;
  paymentMethod: PaymentMethodId;
  date: Timestamp;
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type CreateExpenseInput = Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateExpenseInput = Partial<
  Pick<Expense, 'amountPaise' | 'categoryId' | 'description' | 'paidByUserId' | 'paymentMethod' | 'date' | 'notes'>
>;

// For UI forms — uses rupees (number) before conversion to paise
export interface ExpenseFormValues {
  amountRupees: string; // string for input control
  categoryId: CategoryId;
  description: string;
  paidByUserId: string;
  paymentMethod: PaymentMethodId;
  date: Date;
  notes: string;
}
