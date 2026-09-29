// OurMoney — Loan Type Constants

import type { LoanType, InterestType, RepaymentMethod, RepaymentFrequency } from '../models/loan';

export interface LoanTypeOption {
  id: LoanType;
  label: string;
  iconName: string;
  defaultInterestType: InterestType;
  defaultRepaymentMethod: RepaymentMethod;
}

export const LOAN_TYPES: LoanTypeOption[] = [
  {
    id: 'gold_loan',
    label: 'Gold Loan',
    iconName: 'Gem',
    defaultInterestType: 'simple',
    defaultRepaymentMethod: 'interest_only',
  },
  {
    id: 'personal_loan',
    label: 'Personal Loan',
    iconName: 'User',
    defaultInterestType: 'reducing_balance',
    defaultRepaymentMethod: 'emi',
  },
  {
    id: 'home_loan',
    label: 'Home Loan',
    iconName: 'Home',
    defaultInterestType: 'reducing_balance',
    defaultRepaymentMethod: 'emi',
  },
  {
    id: 'vehicle_loan',
    label: 'Vehicle Loan',
    iconName: 'Car',
    defaultInterestType: 'reducing_balance',
    defaultRepaymentMethod: 'emi',
  },
  {
    id: 'education_loan',
    label: 'Education Loan',
    iconName: 'GraduationCap',
    defaultInterestType: 'reducing_balance',
    defaultRepaymentMethod: 'emi',
  },
  {
    id: 'credit_card_debt',
    label: 'Credit Card Debt',
    iconName: 'CreditCard',
    defaultInterestType: 'reducing_balance',
    defaultRepaymentMethod: 'emi',
  },
  {
    id: 'borrowed_from_person',
    label: 'Borrowed from Person',
    iconName: 'Users',
    defaultInterestType: 'unknown',
    defaultRepaymentMethod: 'custom',
  },
  {
    id: 'other',
    label: 'Other',
    iconName: 'MoreHorizontal',
    defaultInterestType: 'unknown',
    defaultRepaymentMethod: 'custom',
  },
];

export const LOAN_TYPES_MAP: Record<LoanType, LoanTypeOption> = LOAN_TYPES.reduce(
  (acc, lt) => ({ ...acc, [lt.id]: lt }),
  {} as Record<LoanType, LoanTypeOption>,
);

export interface RepaymentMethodOption {
  id: RepaymentMethod;
  label: string;
  description: string;
}

export const REPAYMENT_METHODS: RepaymentMethodOption[] = [
  {
    id: 'interest_only',
    label: 'Interest Only',
    description: 'Pay only interest; principal stays unchanged',
  },
  {
    id: 'emi',
    label: 'EMI',
    description: 'Fixed payment covering principal + interest',
  },
  {
    id: 'principal_plus_interest',
    label: 'Principal + Interest',
    description: 'Variable payment: fixed principal portion + interest on outstanding',
  },
  {
    id: 'custom',
    label: 'Custom',
    description: 'Define your own repayment plan',
  },
];

export interface RepaymentFrequencyOption {
  id: RepaymentFrequency;
  label: string;
  periodsPerYear: number; // approximate, used for calculations
}

export const REPAYMENT_FREQUENCIES: RepaymentFrequencyOption[] = [
  { id: 'monthly',     label: 'Monthly',           periodsPerYear: 12 },
  { id: 'quarterly',   label: 'Every 3 months',    periodsPerYear: 4 },
  { id: 'half_yearly', label: 'Every 6 months',    periodsPerYear: 2 },
  { id: 'yearly',      label: 'Yearly',            periodsPerYear: 1 },
  { id: 'custom',      label: 'Custom schedule',   periodsPerYear: 0 }, // 0 = user-defined
];
