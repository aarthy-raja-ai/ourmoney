// OurMoney — Error Message Mapping
// Converts raw Firebase errors into user-friendly messages.
// Never exposes internal Firebase error codes in production UI.

type ErrorContext =
  | 'sign-up'
  | 'sign-in'
  | 'sign-out'
  | 'password-reset'
  | 'profile-fetch'
  | 'profile-update'
  | 'account-delete'
  | 'expense-save'
  | 'expense-delete'
  | 'expense-fetch'
  | 'household-create'
  | 'household-join'
  | 'household-fetch'
  | 'budget-save'
  | 'budget-delete'
  | 'loan-save'
  | 'loan-delete'
  | 'loan-fetch'
  | 'payment-save'
  | 'generic';

const FIREBASE_ERROR_MAP: Record<string, string> = {
  'auth/invalid-api-key': 'Firebase configuration missing or placeholder. Please update src/config/firebaseConfig.ts with your Firebase API keys.',
  'auth/api-key-not-valid': 'Firebase configuration missing or placeholder. Please update src/config/firebaseConfig.ts with your Firebase API keys.',
  'auth/email-already-in-use': 'This email address is already registered. Try signing in instead.',
  'auth/invalid-email': 'Please enter a valid email address.',
  'auth/operation-not-allowed': 'Sign-up is currently disabled. Please try again later.',
  'auth/weak-password': 'Your password must be at least 6 characters.',
  'auth/user-disabled': 'This account has been disabled. Please contact support.',
  'auth/user-not-found': 'No account found with this email address.',
  'auth/wrong-password': 'Incorrect password. Please try again.',
  'auth/invalid-credential': 'Incorrect email or password. Please try again.',
  'auth/too-many-requests': 'Too many failed attempts. Please wait a moment before trying again.',
  'auth/network-request-failed': 'Unable to connect. Please check your internet connection.',
  'auth/requires-recent-login':
    'For security, please sign out and sign back in before making this change.',
  // Firestore errors
  'permission-denied': "You don't have permission to access this data.",
  'not-found': 'The requested information was not found.',
  unavailable: 'Our service is temporarily unavailable. Your changes will sync when you reconnect.',
  'deadline-exceeded': 'The request took too long. Please try again.',
  'resource-exhausted': 'Too many requests. Please try again in a moment.',
  cancelled: 'The operation was cancelled.',
  'data-loss': 'An unexpected error occurred. Please try again.',
  unauthenticated: 'You need to be signed in to do that.',
};

const CONTEXT_FALLBACK: Record<ErrorContext, string> = {
  'sign-up': "We couldn't create your account. Please try again.",
  'sign-in': "We couldn't sign you in. Please check your details and try again.",
  'sign-out': 'Sign-out failed. Please try again.',
  'password-reset': "We couldn't send the reset email. Please check your email address.",
  'profile-fetch': 'Unable to load your profile. Please try again.',
  'profile-update': 'Unable to update your profile. Please try again.',
  'account-delete': 'Unable to delete your account. Please contact support if this continues.',
  'expense-save': "We couldn't save that expense. Please check your connection and try again.",
  'expense-delete': "We couldn't delete that expense. Please try again.",
  'expense-fetch': 'Unable to load expenses. Please check your connection.',
  'household-create': "We couldn't create your household. Please try again.",
  'household-join': "We couldn't join the household. Please check the invite code and try again.",
  'household-fetch': 'Unable to load household information.',
  'budget-save': "We couldn't save that budget. Please try again.",
  'budget-delete': "We couldn't delete that budget. Please try again.",
  'loan-save': "We couldn't save that loan. Please try again.",
  'loan-delete': "We couldn't delete that loan. Please try again.",
  'loan-fetch': 'Unable to load loan information.',
  'payment-save': "We couldn't save that payment. Please try again.",
  generic: 'Something went wrong. Please try again.',
};

export function toUserFriendlyError(
  error: unknown,
  context: ErrorContext = 'generic',
): string {
  if (error instanceof Error) {
    // Check for Firebase auth error code pattern
    const code = (error as { code?: string }).code;
    if (code && FIREBASE_ERROR_MAP[code]) {
      return FIREBASE_ERROR_MAP[code];
    }

    // Check if it's already a user-friendly message (thrown by our own services)
    const msg = error.message;
    if (msg && !msg.includes('/') && !msg.includes('Firebase') && msg.length < 200) {
      return msg;
    }
  }

  return CONTEXT_FALLBACK[context] ?? CONTEXT_FALLBACK.generic;
}
