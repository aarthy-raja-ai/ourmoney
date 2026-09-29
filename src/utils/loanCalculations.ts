// OurMoney — Loan Calculations
// ======================================================
// IMPORTANT: These are ESTIMATES for planning purposes only.
// Actual lender calculations may differ based on:
//   - Flat vs reducing balance method
//   - Daily vs monthly interest accrual
//   - Penal interest, processing fees, GST
//   - Preclosure charges
//   - Minimum interest periods
//   - Lender-specific rules
//
// All results MUST be displayed with 'Estimated' label.
// Never claim to match official lender statements.
// ======================================================
// Amounts in PAISE. Rates in BASIS POINTS. Months are integers.

import type { Loan, RepaymentMethod, InterestType } from '../models/loan';
import type { RepaymentFrequency } from '../models/loan';

export interface LoanCalculationResult {
  estimatedPayoffMonths: number | null; // null if cannot calculate
  estimatedTotalInterestPaise: number | null;
  estimatedTotalPaymentPaise: number | null;
  monthlyInterestPaise: number | null;
  isEstimate: true; // always true — enforced type
  disclaimer: string;
}

export interface ScenarioResult {
  paymentPaise: number;
  estimatedPayoffMonths: number | null;
  estimatedTotalInterestPaise: number | null;
  estimatedTotalPaymentPaise: number | null;
  isEstimate: true;
  disclaimer: string;
}

const STANDARD_DISCLAIMER =
  'Estimated based on information you entered. Assumes entered interest rate remains unchanged and payments occur on schedule. Check your lender\u2019s statement for the official amount.';

const GOLD_LOAN_DISCLAIMER =
  'Estimated based on simple interest on outstanding balance. Gold loan interest calculations vary by lender. This is for planning only — check your lender\u2019s statement.';

/**
 * Calculate annual interest rate from basis points.
 * 1050 bps → 0.105 (10.5%)
 */
function bpsToRate(bps: number): number {
  return bps / 10000;
}

/**
 * Calculate monthly interest on outstanding balance (reducing balance).
 * Used for EMI and Principal+Interest methods.
 */
export function calcMonthlyInterestPaise(
  outstandingPaise: number,
  annualRateBps: number,
): number {
  const annualRate = bpsToRate(annualRateBps);
  const monthlyRate = annualRate / 12;
  return Math.round(outstandingPaise * monthlyRate);
}

/**
 * Calculate EMI (Equated Monthly Installment) using reducing balance.
 * EMI = P × r(1+r)^n / ((1+r)^n − 1)
 * Where P = principal, r = monthly rate, n = months
 */
export function calculateEMI(
  principalPaise: number,
  annualRateBps: number,
  tenureMonths: number,
): number {
  if (annualRateBps === 0) {
    // Zero interest: equal principal payments
    return Math.ceil(principalPaise / tenureMonths);
  }
  const r = bpsToRate(annualRateBps) / 12;
  const n = tenureMonths;
  const emi = (principalPaise * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  return Math.round(emi);
}

/**
 * Estimate payoff months given outstanding, annual rate (bps), and payment per period.
 * Uses reducing balance method.
 * Returns null if payment is insufficient to cover even monthly interest.
 */
export function calculatePayoffMonths(
  outstandingPaise: number,
  annualRateBps: number,
  paymentPaise: number,
  method: RepaymentMethod = 'emi',
): number | null {
  if (outstandingPaise <= 0) return 0;
  if (paymentPaise <= 0) return null;

  if (method === 'interest_only') {
    // Interest-only: principal never reduces (unless extra is paid)
    // Can't calculate payoff with pure interest-only
    return null;
  }

  const monthlyRate = bpsToRate(annualRateBps) / 12;

  if (annualRateBps === 0) {
    return Math.ceil(outstandingPaise / paymentPaise);
  }

  // Check if payment covers at least the first month's interest
  const firstMonthInterest = Math.round(outstandingPaise * monthlyRate);
  if (paymentPaise <= firstMonthInterest) {
    return null; // Payment too small — loan never pays off
  }

  // Simulate month-by-month (more accurate for varying balances)
  let balance = outstandingPaise;
  let months = 0;
  const MAX_MONTHS = 600; // 50 years cap to prevent infinite loop

  while (balance > 0 && months < MAX_MONTHS) {
    const interest = Math.round(balance * monthlyRate);
    const principalPaid = paymentPaise - interest;
    if (principalPaid <= 0) return null;
    balance = balance - principalPaid;
    months++;
    if (balance <= 0) break;
  }

  return months >= MAX_MONTHS ? null : months;
}

/**
 * Calculate estimated total interest paid over the loan term.
 */
export function calculateTotalInterest(
  outstandingPaise: number,
  annualRateBps: number,
  paymentPaise: number,
  method: RepaymentMethod = 'emi',
): number | null {
  if (method === 'interest_only') return null;

  const months = calculatePayoffMonths(outstandingPaise, annualRateBps, paymentPaise, method);
  if (months === null) return null;

  const totalPaid = paymentPaise * months;
  return totalPaid - outstandingPaise;
}

/**
 * Calculate interest for a single period (interest-only loans).
 * E.g. Gold loan: 6-month interest at 10.5% p.a.
 * Uses simple interest: P * r * t
 */
export function calculatePeriodInterest(
  principalPaise: number,
  annualRateBps: number,
  periodMonths: number,
  interestType: InterestType = 'simple',
): {
  estimatedInterestPaise: number;
  disclaimer: string;
  isEstimate: true;
} {
  const annualRate = bpsToRate(annualRateBps);
  const periodFraction = periodMonths / 12;

  let interestPaise: number;

  if (interestType === 'reducing_balance') {
    // For reducing balance with no principal reduction, same as simple for one period
    interestPaise = Math.round(principalPaise * annualRate * periodFraction);
  } else {
    // Simple interest
    interestPaise = Math.round(principalPaise * annualRate * periodFraction);
  }

  return {
    estimatedInterestPaise: interestPaise,
    disclaimer: GOLD_LOAN_DISCLAIMER,
    isEstimate: true,
  };
}

/**
 * Generate a full loan calculation result.
 */
export function calculateLoan(
  loan: Pick<
    Loan,
    | 'outstandingAmountPaise'
    | 'interestRateBps'
    | 'interestType'
    | 'repaymentMethod'
    | 'repaymentFrequency'
    | 'plannedPaymentPaise'
  >,
): LoanCalculationResult {
  const {
    outstandingAmountPaise,
    interestRateBps,
    repaymentMethod,
    plannedPaymentPaise,
    repaymentFrequency,
  } = loan;

  const monthlyInterest = calcMonthlyInterestPaise(outstandingAmountPaise, interestRateBps);

  if (repaymentMethod === 'interest_only') {
    const periodsPerYear = getPeriodsPerYear(repaymentFrequency);
    const periodMonths = periodsPerYear > 0 ? 12 / periodsPerYear : 12;
    const periodInterest = calculatePeriodInterest(
      outstandingAmountPaise,
      interestRateBps,
      periodMonths,
    );
    return {
      estimatedPayoffMonths: null,
      estimatedTotalInterestPaise: null,
      estimatedTotalPaymentPaise: null,
      monthlyInterestPaise: monthlyInterest,
      isEstimate: true,
      disclaimer:
        `Estimated interest per period (${periodMonths} months): based on simple interest. ` +
        GOLD_LOAN_DISCLAIMER,
    };
  }

  const payoffMonths = calculatePayoffMonths(
    outstandingAmountPaise,
    interestRateBps,
    plannedPaymentPaise,
    repaymentMethod,
  );

  const totalInterest =
    payoffMonths !== null
      ? calculateTotalInterest(
          outstandingAmountPaise,
          interestRateBps,
          plannedPaymentPaise,
          repaymentMethod,
        )
      : null;

  return {
    estimatedPayoffMonths: payoffMonths,
    estimatedTotalInterestPaise: totalInterest,
    estimatedTotalPaymentPaise:
      payoffMonths !== null ? plannedPaymentPaise * payoffMonths : null,
    monthlyInterestPaise: monthlyInterest,
    isEstimate: true,
    disclaimer: STANDARD_DISCLAIMER,
  };
}

/**
 * Calculate scenario comparison: current vs increased payment.
 */
export function calculateScenario(
  outstandingPaise: number,
  interestRateBps: number,
  paymentPaise: number,
  method: RepaymentMethod = 'emi',
): ScenarioResult {
  const months = calculatePayoffMonths(outstandingPaise, interestRateBps, paymentPaise, method);
  const totalInterest =
    months !== null
      ? Math.max(0, paymentPaise * months - outstandingPaise)
      : null;

  return {
    paymentPaise,
    estimatedPayoffMonths: months,
    estimatedTotalInterestPaise: totalInterest,
    estimatedTotalPaymentPaise: months !== null ? paymentPaise * months : null,
    isEstimate: true,
    disclaimer: STANDARD_DISCLAIMER,
  };
}

/**
 * Calculate required monthly payment to be debt-free in N months.
 * Returns null if not calculable.
 */
export function calculateRequiredPayment(
  outstandingPaise: number,
  interestRateBps: number,
  targetMonths: number,
): {
  requiredPaymentPaise: number | null;
  isEstimate: true;
  disclaimer: string;
} {
  if (outstandingPaise <= 0 || targetMonths <= 0) {
    return { requiredPaymentPaise: null, isEstimate: true, disclaimer: STANDARD_DISCLAIMER };
  }

  if (interestRateBps === 0) {
    return {
      requiredPaymentPaise: Math.ceil(outstandingPaise / targetMonths),
      isEstimate: true,
      disclaimer: STANDARD_DISCLAIMER,
    };
  }

  const emi = calculateEMI(outstandingPaise, interestRateBps, targetMonths);
  return {
    requiredPaymentPaise: emi,
    isEstimate: true,
    disclaimer: STANDARD_DISCLAIMER,
  };
}

/**
 * Get approximate periods per year for a repayment frequency.
 */
export function getPeriodsPerYear(frequency: RepaymentFrequency): number {
  switch (frequency) {
    case 'monthly':     return 12;
    case 'quarterly':   return 4;
    case 'half_yearly': return 2;
    case 'yearly':      return 1;
    case 'custom':      return 0; // user-defined
  }
}

/**
 * Format payoff timeline for display.
 * 14 → '1 year 2 months'
 * 6 → '6 months'
 */
export function formatPayoffTimeline(months: number | null): string {
  if (months === null) return 'Unable to estimate';
  if (months === 0) return 'Already paid off';
  if (months < 12) return `${months} month${months === 1 ? '' : 's'}`;
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  if (remainingMonths === 0) return `${years} year${years === 1 ? '' : 's'}`;
  return `${years} year${years === 1 ? '' : 's'} ${remainingMonths} month${remainingMonths === 1 ? '' : 's'}`;
}
