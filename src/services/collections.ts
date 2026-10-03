// OurMoney — Firestore Collection Paths
// Single source of truth for all collection names.

export const COLLECTIONS = {
  USERS: 'users',
  HOUSEHOLDS: 'households',
  HOUSEHOLD_INVITES: 'household_invites',
} as const;

export const SUBCOLLECTIONS = {
  EXPENSES: 'expenses',
  BUDGETS: 'budgets',
  LOANS: 'loans',
  LOAN_PAYMENTS: 'loanPayments',
  SETTINGS: 'settings',
  PENDING_PURCHASES: 'pendingPurchases',
} as const;

// Helper to build subcollection paths
export const paths = {
  user: (userId: string) => `${COLLECTIONS.USERS}/${userId}`,
  household: (householdId: string) => `${COLLECTIONS.HOUSEHOLDS}/${householdId}`,
  expenses: (householdId: string) =>
    `${COLLECTIONS.HOUSEHOLDS}/${householdId}/${SUBCOLLECTIONS.EXPENSES}`,
  expense: (householdId: string, expenseId: string) =>
    `${COLLECTIONS.HOUSEHOLDS}/${householdId}/${SUBCOLLECTIONS.EXPENSES}/${expenseId}`,
  budgets: (householdId: string) =>
    `${COLLECTIONS.HOUSEHOLDS}/${householdId}/${SUBCOLLECTIONS.BUDGETS}`,
  budget: (householdId: string, budgetId: string) =>
    `${COLLECTIONS.HOUSEHOLDS}/${householdId}/${SUBCOLLECTIONS.BUDGETS}/${budgetId}`,
  loans: (householdId: string) =>
    `${COLLECTIONS.HOUSEHOLDS}/${householdId}/${SUBCOLLECTIONS.LOANS}`,
  loan: (householdId: string, loanId: string) =>
    `${COLLECTIONS.HOUSEHOLDS}/${householdId}/${SUBCOLLECTIONS.LOANS}/${loanId}`,
  loanPayments: (householdId: string) =>
    `${COLLECTIONS.HOUSEHOLDS}/${householdId}/${SUBCOLLECTIONS.LOAN_PAYMENTS}`,
  loanPayment: (householdId: string, paymentId: string) =>
    `${COLLECTIONS.HOUSEHOLDS}/${householdId}/${SUBCOLLECTIONS.LOAN_PAYMENTS}/${paymentId}`,
  pendingPurchases: (householdId: string) =>
    `${COLLECTIONS.HOUSEHOLDS}/${householdId}/${SUBCOLLECTIONS.PENDING_PURCHASES}`,
  pendingPurchase: (householdId: string, pendingPurchaseId: string) =>
    `${COLLECTIONS.HOUSEHOLDS}/${householdId}/${SUBCOLLECTIONS.PENDING_PURCHASES}/${pendingPurchaseId}`,
  householdSettings: (householdId: string) =>
    `${COLLECTIONS.HOUSEHOLDS}/${householdId}/${SUBCOLLECTIONS.SETTINGS}/preferences`,
};
