// OurMoney — Loan Model
// =========================================================
// PRIVACY REQUIREMENT: This model NEVER stores:
//   - accountNumber
//   - loanAccountNumber
//   - bankAccountNumber
//   - customerID / CIF
//   - UPI ID / PIN
//   - ATM PIN / Card number / Card PIN
//   - Bank password / OTP
//   - Aadhaar / PAN
// This is a planning tool only.
// =========================================================
// Amounts stored in PAISE (integer).
// Interest rates stored in BASIS POINTS (integer): e.g. 1050 = 10.50%

import { Timestamp } from 'firebase/firestore';

export type LoanType =
  | 'gold_loan'
  | 'personal_loan'
  | 'home_loan'
  | 'vehicle_loan'
  | 'education_loan'
  | 'credit_card_debt'
  | 'borrowed_from_person'
  | 'other';

export type InterestType =
  | 'reducing_balance' // EMI style
  | 'flat'             // on original principal
  | 'simple'           // simple interest
  | 'unknown';         // user doesn't know

export type RepaymentMethod =
  | 'interest_only'
  | 'emi'
  | 'principal_plus_interest'
  | 'custom';

export type RepaymentFrequency =
  | 'monthly'
  | 'quarterly'     // every 3 months
  | 'half_yearly'   // every 6 months
  | 'yearly'
  | 'custom';

export interface Loan {
  id: string;
  householdId: string;
  lenderName: string;
  loanType: LoanType;
  originalAmountPaise: number;     // integer paise
  outstandingAmountPaise: number;  // integer paise, updated when payments recorded
  interestRateBps: number;         // basis points: e.g. 1050 = 10.50% p.a.
  interestType: InterestType;
  repaymentMethod: RepaymentMethod;
  repaymentFrequency: RepaymentFrequency;
  customFrequencyDays?: number;    // used when frequency = 'custom'
  plannedPaymentPaise: number;     // user's planned payment per period
  nextPaymentDate?: Timestamp;
  notes?: string;
  isActive: boolean;
  createdByUserId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  // NOT STORED: accountNumber, loanAccountNumber, bankCredentials, etc.
}

export type CreateLoanInput = Omit<Loan, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateLoanInput = Partial<
  Pick<
    Loan,
    | 'lenderName'
    | 'loanType'
    | 'outstandingAmountPaise'
    | 'interestRateBps'
    | 'interestType'
    | 'repaymentMethod'
    | 'repaymentFrequency'
    | 'customFrequencyDays'
    | 'plannedPaymentPaise'
    | 'nextPaymentDate'
    | 'notes'
    | 'isActive'
  >
>;

// For UI forms
export interface LoanFormValues {
  lenderName: string;
  loanType: LoanType;
  originalAmountRupees: string;
  outstandingAmountRupees: string;
  interestRatePercent: string; // e.g. "10.5"
  interestType: InterestType;
  repaymentMethod: RepaymentMethod;
  repaymentFrequency: RepaymentFrequency;
  customFrequencyDays: string;
  plannedPaymentRupees: string;
  nextPaymentDate: Date | null;
  notes: string;
}
