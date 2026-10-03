// OurMoney — Pending Purchase Model
// Amounts stored in minor units (PAISE as integer).
// Example: ₹130 is stored as 13000.

import { Timestamp } from 'firebase/firestore';
import type { CategoryId } from '../constants/categories';
import type { PaymentMethodId } from '../constants/paymentMethods';

export type PendingPurchaseStatus = 'PENDING' | 'SETTLED';

export interface PendingPurchase {
  id: string;
  householdId: string;
  amountMinor: number; // integer, paise
  title: string;
  category: CategoryId;
  merchantOrPerson: string;
  createdBy: string;
  createdAt: Timestamp;
  dueDate: Timestamp;
  status: PendingPurchaseStatus;
  settledAt?: Timestamp | null;
  settledBy?: string | null;
  paymentMethod?: PaymentMethodId | null;
  notes?: string;
  createExpenseOnSettle?: boolean;
  expenseId?: string | null;
}

export type CreatePendingPurchaseInput = Omit<
  PendingPurchase,
  'id' | 'createdAt' | 'householdId' | 'createdBy' | 'status' | 'settledAt' | 'settledBy' | 'expenseId'
> & {
  householdId?: string;
  createdBy?: string;
};

export type UpdatePendingPurchaseInput = Partial<
  Pick<PendingPurchase, 'amountMinor' | 'title' | 'category' | 'merchantOrPerson' | 'dueDate' | 'notes' | 'createExpenseOnSettle'>
>;
