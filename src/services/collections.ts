// OurMoney — Firestore Collection Paths
// Single source of truth for all collection names.

export const COLLECTIONS = {
  USERS: 'users',
  HOUSEHOLDS: 'households',
} as const;

export const SUBCOLLECTIONS = {
  EXPENSES: 'expenses',
  BUDGETS: 'budgets',
  LOANS: 'loans',
  LOAN_PAYMENTS: 'loanPayments',
  SETTINGS: 'settings',
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
  householdSettings: (householdId: string) =>
    `${COLLECTIONS.HOUSEHOLDS}/${householdId}/${SUBCOLLECTIONS.SETTINGS}/preferences`,
};
