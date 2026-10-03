// OurMoney — Budget Model
// Amounts stored in PAISE (integer).

import { Timestamp } from 'firebase/firestore';
import type { CategoryId } from '../constants/categories';

export interface Budget {
  id: string;
  householdId: string;
  categoryId: CategoryId;
  amountPaise: number; // integer, paise
  month: string; // 'YYYY-MM' format, e.g. '2026-09'
  createdByUserId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type CreateBudgetInput = Omit<Budget, 'id' | 'createdAt' | 'updatedAt' | 'householdId' | 'createdByUserId'> & {
  householdId?: string;
  createdByUserId?: string;
};
export type UpdateBudgetInput = Pick<Budget, 'amountPaise'>;

export type BudgetStatus = 'normal' | 'heads-up' | 'almost' | 'exceeded';

export interface BudgetWithSpending extends Budget {
  spentPaise: number;
  remainingPaise: number;
  percentUsed: number;
  status: BudgetStatus;
}
