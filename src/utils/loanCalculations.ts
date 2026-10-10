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

export const calculateLoanPayoffDetails = (
  outstandingAmountPaise: number,
  interestRateBps: number,
  plannedPaymentPaise: number,
  repaymentMethod: RepaymentMethod = 'emi',
) =>
  calculateLoan({
    outstandingAmountPaise,
    interestRateBps,
    interestType: 'reducing_balance',
    repaymentMethod,
    repaymentFrequency: 'monthly',
    plannedPaymentPaise,
  });

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

export interface DebtFreeTargetResult {
  totalPayoffMonths: number;
  estimatedMonthsToDebtFree: number | null;
  totalInterestPaise: number;
  estimatedTotalInterestPaise: number | null;
  totalPaymentPaise: number;
  payoffDate: Date;
}

export function calculateDebtFreeTarget(
  loans: Loan[],
  extraPaymentPaise: number = 0,
  _strategy: 'avalanche' | 'snowball' = 'avalanche',
): DebtFreeTargetResult {
  if (!loans.length) {
    return {
      totalPayoffMonths: 0,
      estimatedMonthsToDebtFree: 0,
      totalInterestPaise: 0,
      estimatedTotalInterestPaise: 0,
      totalPaymentPaise: 0,
      payoffDate: new Date(),
    };
  }

  let totalBalance = loans.reduce((sum, l) => sum + (l.outstandingAmountPaise ?? (l as any).currentBalancePaise ?? 0), 0);
  let totalInterest = 0;
  let months = 0;

  while (totalBalance > 0 && months < 600) {
    months++;
    let monthInterest = 0;
    loans.forEach((loan) => {
      const bal = loan.outstandingAmountPaise ?? (loan as any).currentBalancePaise ?? 0;
      const rateBps = loan.interestRateBps ?? (loan as any).annualInterestRateBps ?? 0;
      const monthlyRate = rateBps / 10000 / 12;
      monthInterest += Math.round(bal * monthlyRate);
    });
    totalInterest += monthInterest;

    const minPayments = loans.reduce(
      (sum, l) => sum + (l.plannedPaymentPaise ?? (l as any).minimumPaymentPaise ?? 0),
      0,
    );
    const totalPay = minPayments + extraPaymentPaise;
    const principalPaid = totalPay - monthInterest;

    if (principalPaid <= 0) break;
    totalBalance -= principalPaid;
  }

  const payoffDate = new Date();
  payoffDate.setMonth(payoffDate.getMonth() + months);

  const interestVal = Math.max(0, totalInterest);
  const initialTotalBalance = loans.reduce((sum, l) => sum + (l.outstandingAmountPaise ?? (l as any).currentBalancePaise ?? 0), 0);

  return {
    totalPayoffMonths: months,
    estimatedMonthsToDebtFree: months,
    totalInterestPaise: interestVal,
    estimatedTotalInterestPaise: interestVal,
    totalPaymentPaise: initialTotalBalance + interestVal,
    payoffDate,
  };
}

export interface PayoffScenarioItem {
  title: string;
  description: string;
  monthlyPaymentPaise: number;
  payoffMonths: number | null;
  totalInterestPaise: number | null;
  totalPaymentPaise: number | null;
  interestSavedPaise?: number;
  monthsSaved?: number;
}

export function calculatePayoffScenarios(
  outstandingPaise: number,
  interestRateBps: number,
  plannedPaymentPaise: number,
  method: RepaymentMethod = 'emi',
): PayoffScenarioItem[] {
  const base = calculateScenario(outstandingPaise, interestRateBps, plannedPaymentPaise, method);
  const extra2k = calculateScenario(outstandingPaise, interestRateBps, plannedPaymentPaise + 200000, method);
  const extra5k = calculateScenario(outstandingPaise, interestRateBps, plannedPaymentPaise + 500000, method);

  const baseInterest = base.estimatedTotalInterestPaise ?? 0;
  const baseMonths = base.estimatedPayoffMonths ?? 0;

  return [
    {
      title: 'Current Plan',
      description: 'Minimum / scheduled monthly payment',
      monthlyPaymentPaise: plannedPaymentPaise,
      payoffMonths: base.estimatedPayoffMonths,
      totalInterestPaise: base.estimatedTotalInterestPaise,
      totalPaymentPaise: base.estimatedTotalPaymentPaise,
    },
    {
      title: '+ ₹2,000 / month',
      description: 'Pay an extra ₹2,000 every month towards principal',
      monthlyPaymentPaise: plannedPaymentPaise + 200000,
      payoffMonths: extra2k.estimatedPayoffMonths,
      totalInterestPaise: extra2k.estimatedTotalInterestPaise,
      totalPaymentPaise: extra2k.estimatedTotalPaymentPaise,
      interestSavedPaise: Math.max(0, baseInterest - (extra2k.estimatedTotalInterestPaise ?? 0)),
      monthsSaved: Math.max(0, baseMonths - (extra2k.estimatedPayoffMonths ?? 0)),
    },
    {
      title: '+ ₹5,000 / month',
      description: 'Pay an extra ₹5,000 every month towards principal',
      monthlyPaymentPaise: plannedPaymentPaise + 500000,
      payoffMonths: extra5k.estimatedPayoffMonths,
      totalInterestPaise: extra5k.estimatedTotalInterestPaise,
      totalPaymentPaise: extra5k.estimatedTotalPaymentPaise,
      interestSavedPaise: Math.max(0, baseInterest - (extra5k.estimatedTotalInterestPaise ?? 0)),
      monthsSaved: Math.max(0, baseMonths - (extra5k.estimatedPayoffMonths ?? 0)),
    },
  ];
}

export interface ReverseInterestResult {
  isValid: boolean;
  annualRateBps: number;
  annualRatePercent: number;
  effectiveAnnualRatePercent: number | null;
  totalRepaymentPaise: number;
  totalInterestPaise: number;
  monthlyEmiPaise: number;
  disclaimer: string;
  errorMessage?: string;
}

/**
 * Calculate implied annual interest rate (nominal + effective) from Principal, EMI, and Tenure.
 * Uses bisection numerical root finding for reducing balance loans.
 */
export function calculateReverseInterestRate(params: {
  principalPaise: number;
  monthlyEmiPaise: number;
  tenureMonths: number;
  interestType?: InterestType;
}): ReverseInterestResult {
  const { principalPaise, monthlyEmiPaise, tenureMonths, interestType = 'reducing_balance' } = params;

  if (!Number.isFinite(principalPaise) || principalPaise <= 0) {
    return {
      isValid: false,
      annualRateBps: 0,
      annualRatePercent: 0,
      effectiveAnnualRatePercent: null,
      totalRepaymentPaise: 0,
      totalInterestPaise: 0,
      monthlyEmiPaise: 0,
      disclaimer: '',
      errorMessage: 'Principal amount must be greater than ₹0.',
    };
  }

  if (!Number.isFinite(monthlyEmiPaise) || monthlyEmiPaise <= 0) {
    return {
      isValid: false,
      annualRateBps: 0,
      annualRatePercent: 0,
      effectiveAnnualRatePercent: null,
      totalRepaymentPaise: 0,
      totalInterestPaise: 0,
      monthlyEmiPaise: 0,
      disclaimer: '',
      errorMessage: 'Monthly EMI amount must be greater than ₹0.',
    };
  }

  if (!Number.isInteger(tenureMonths) || tenureMonths <= 0) {
    return {
      isValid: false,
      annualRateBps: 0,
      annualRatePercent: 0,
      effectiveAnnualRatePercent: null,
      totalRepaymentPaise: 0,
      totalInterestPaise: 0,
      monthlyEmiPaise: 0,
      disclaimer: '',
      errorMessage: 'Tenure must be at least 1 month.',
    };
  }

  const totalRepaymentPaise = Math.round(monthlyEmiPaise * tenureMonths);
  const totalInterestPaise = totalRepaymentPaise - principalPaise;

  if (totalRepaymentPaise < principalPaise) {
    return {
      isValid: false,
      annualRateBps: 0,
      annualRatePercent: 0,
      effectiveAnnualRatePercent: null,
      totalRepaymentPaise,
      totalInterestPaise: 0,
      monthlyEmiPaise,
      disclaimer: '',
      errorMessage: 'Total repayment (EMI × tenure) cannot be less than the principal amount.',
    };
  }

  // Zero interest case: EMI * tenure == principal
  if (totalRepaymentPaise === principalPaise || Math.abs(monthlyEmiPaise - (principalPaise / tenureMonths)) < 0.01) {
    return {
      isValid: true,
      annualRateBps: 0,
      annualRatePercent: 0,
      effectiveAnnualRatePercent: 0,
      totalRepaymentPaise: principalPaise,
      totalInterestPaise: 0,
      monthlyEmiPaise,
      disclaimer: 'Zero interest loan. Total repayment equals the principal amount.',
    };
  }

  if (interestType === 'flat' || interestType === 'simple') {
    // Flat & Simple rate: Total Interest = P * (R/100) * (n/12)
    const years = tenureMonths / 12;
    const ratePercent = (totalInterestPaise / principalPaise) / years * 100;
    const annualRateBps = Math.round(ratePercent * 100);

    const isFlat = interestType === 'flat';
    const disclaimer = isFlat
      ? 'Estimated flat interest rate. Note: Flat and reducing-balance rates are not directly comparable because flat interest is charged on the original principal throughout the loan tenure.'
      : 'Estimated simple interest rate calculated linearly on principal over the total loan tenure.';

    return {
      isValid: true,
      annualRateBps,
      annualRatePercent: Number(ratePercent.toFixed(2)),
      effectiveAnnualRatePercent: null,
      totalRepaymentPaise,
      totalInterestPaise,
      monthlyEmiPaise,
      disclaimer,
    };
  }

  // Reducing Balance: Numerical Root Finding (Bisection / Binary Search)
  const P = principalPaise;
  const targetEMI = monthlyEmiPaise;
  const n = tenureMonths;

  if (targetEMI < P / n) {
    return {
      isValid: false,
      annualRateBps: 0,
      annualRatePercent: 0,
      effectiveAnnualRatePercent: null,
      totalRepaymentPaise,
      totalInterestPaise,
      monthlyEmiPaise,
      disclaimer: '',
      errorMessage: 'EMI is too low to repay principal over the specified tenure.',
    };
  }

  const emiForMonthlyRate = (r: number): number => {
    if (r === 0) return P / n;
    const pow = Math.pow(1 + r, n);
    return (P * r * pow) / (pow - 1);
  };

  let low = 0.0;
  let high = 1.0; // 100% per month initial upper bound

  while (emiForMonthlyRate(high) < targetEMI && high < 5.0) {
    high *= 2;
  }

  if (emiForMonthlyRate(high) < targetEMI) {
    return {
      isValid: false,
      annualRateBps: 0,
      annualRatePercent: 0,
      effectiveAnnualRatePercent: null,
      totalRepaymentPaise,
      totalInterestPaise,
      monthlyEmiPaise,
      disclaimer: '',
      errorMessage: 'Interest rate required for this EMI is extraordinarily high and exceeds bounds.',
    };
  }

  for (let i = 0; i < 100; i++) {
    const mid = (low + high) / 2;
    const currentEMI = emiForMonthlyRate(mid);

    if (Math.abs(currentEMI - targetEMI) < 1e-7 || (high - low) < 1e-9) {
      low = mid;
      break;
    }

    if (currentEMI < targetEMI) {
      low = mid;
    } else {
      high = mid;
    }
  }

  const monthlyRate = low;
  const annualNominalRatePercent = monthlyRate * 12 * 100;
  const annualRateBps = Math.round(annualNominalRatePercent * 100);
  const effectiveAnnualRatePercent = (Math.pow(1 + monthlyRate, 12) - 1) * 100;

  return {
    isValid: true,
    annualRateBps,
    annualRatePercent: Number(annualNominalRatePercent.toFixed(2)),
    effectiveAnnualRatePercent: Number(effectiveAnnualRatePercent.toFixed(2)),
    totalRepaymentPaise,
    totalInterestPaise,
    monthlyEmiPaise,
    disclaimer:
      'Estimated nominal reducing-balance interest rate based on entered principal, EMI, and tenure. Official rates may vary due to lender processing fees, GST, insurance, or interest rounding.',
  };
}

export interface InterestModelComparisonItem {
  interestType: InterestType;
  label: string;
  annualRatePercent: number;
  annualRateBps: number;
  effectiveAnnualRatePercent: number | null;
  totalInterestPaise: number;
  totalRepaymentPaise: number;
  monthlyEmiPaise: number;
  calculationMethod: string;
  isValid: boolean;
  errorMessage?: string;
  disclaimer: string;
}

/**
 * Compare all three interest models (Reducing Balance, Flat, Simple Interest) side-by-side.
 */
export function compareAllInterestModels(params: {
  principalPaise: number;
  monthlyEmiPaise: number;
  tenureMonths: number;
}): InterestModelComparisonItem[] {
  const { principalPaise, monthlyEmiPaise, tenureMonths } = params;

  const models: Array<{ id: InterestType; label: string; method: string }> = [
    {
      id: 'reducing_balance',
      label: 'Reducing Balance (EMI)',
      method: 'Interest recalculated monthly on declining principal balance.',
    },
    {
      id: 'flat',
      label: 'Flat Interest',
      method: 'Flat rate charged on original principal throughout tenure.',
    },
    {
      id: 'simple',
      label: 'Simple Interest',
      method: 'Linear simple interest calculated on principal over total tenure.',
    },
  ];

  return models.map((m) => {
    const res = calculateReverseInterestRate({
      principalPaise,
      monthlyEmiPaise,
      tenureMonths,
      interestType: m.id,
    });

    return {
      interestType: m.id,
      label: m.label,
      annualRatePercent: res.annualRatePercent,
      annualRateBps: res.annualRateBps,
      effectiveAnnualRatePercent: res.effectiveAnnualRatePercent,
      totalInterestPaise: res.totalInterestPaise,
      totalRepaymentPaise: res.totalRepaymentPaise,
      monthlyEmiPaise,
      calculationMethod: m.method,
      isValid: res.isValid,
      errorMessage: res.errorMessage,
      disclaimer: res.disclaimer,
    };
  });
}

export interface ResolveLoanInterestRateParams {
  interestType: InterestType;
  interestRateBps?: number;
  principalPaise?: number;
  monthlyEmiPaise?: number;
  tenureMonths?: number;
}

export interface ResolvedLoanInterestRate {
  rateBps: number;
  ratePercent: number;
  displayText: string;
  isDerived: boolean;
  isValid: boolean;
  modelLabel: string;
}

/**
 * Resolves the display and calculation interest rate for a loan across all models.
 * Ensures the Loan Details summary and Interest Model Comparison card display the exact same rate.
 * Never silently displays 0.00% p.a. when an implied rate is derivable or when the rate is unknown.
 */
export function resolveLoanInterestRate(
  params: ResolveLoanInterestRateParams,
): ResolvedLoanInterestRate {
  const {
    interestType,
    interestRateBps = 0,
    principalPaise = 0,
    monthlyEmiPaise = 0,
    tenureMonths = 0,
  } = params;

  const modelLabel =
    interestType === 'flat'
      ? 'Flat'
      : interestType === 'simple'
      ? 'Simple'
      : 'Reducing';

  // 1. Attempt to derive implied rate for the given interest model from principal, EMI, and tenure
  if (principalPaise > 0 && monthlyEmiPaise > 0 && tenureMonths > 0) {
    const reverseRes = calculateReverseInterestRate({
      principalPaise,
      monthlyEmiPaise,
      tenureMonths,
      interestType,
    });

    if (reverseRes.isValid) {
      return {
        rateBps: reverseRes.annualRateBps,
        ratePercent: reverseRes.annualRatePercent,
        displayText: `${reverseRes.annualRatePercent.toFixed(2)}% p.a. (${modelLabel})`,
        isDerived: true,
        isValid: true,
        modelLabel,
      };
    }
  }

  // 2. If repayment inputs (P, EMI, n) cannot derive a rate, check if explicit positive rate was provided
  if (interestRateBps > 0) {
    const ratePercent = Number((interestRateBps / 100).toFixed(2));
    return {
      rateBps: interestRateBps,
      ratePercent,
      displayText: `${ratePercent.toFixed(2)}% p.a. (${modelLabel})`,
      isDerived: false,
      isValid: true,
      modelLabel,
    };
  }

  // 3. Genuine unknown/invalid state — do not fall back to 0.00%
  return {
    rateBps: 0,
    ratePercent: 0,
    displayText: `Unavailable (${modelLabel})`,
    isDerived: false,
    isValid: false,
    modelLabel,
  };
}

export interface InstallmentScheduleItem {
  installmentNumber: number;
  paymentPaise: number;
  principalPaise: number;
  interestPaise: number;
  remainingRepaymentBalancePaise: number;
  remainingPrincipalPaise: number;
}

/**
 * Generate full amortization schedule with integer paise precision and final installment rounding correction.
 */
export function generateAmortizationSchedule(params: {
  principalPaise: number;
  annualRateBps: number;
  tenureMonths: number;
  interestType?: InterestType;
  plannedEmiPaise?: number;
}): {
  schedule: InstallmentScheduleItem[];
  totalScheduledRepaymentPaise: number;
  totalScheduledInterestPaise: number;
  monthlyInstallmentPaise: number;
} {
  const { principalPaise, annualRateBps, tenureMonths, interestType = 'reducing_balance', plannedEmiPaise } = params;

  if (principalPaise <= 0 || tenureMonths <= 0) {
    return {
      schedule: [],
      totalScheduledRepaymentPaise: 0,
      totalScheduledInterestPaise: 0,
      monthlyInstallmentPaise: 0,
    };
  }

  if (interestType === 'flat' || interestType === 'simple') {
    const years = tenureMonths / 12;
    const rate = annualRateBps / 10000;
    const totalScheduledInterestPaise = Math.round(principalPaise * rate * years);
    const totalScheduledRepaymentPaise = plannedEmiPaise ? plannedEmiPaise * tenureMonths : principalPaise + totalScheduledInterestPaise;

    const baseEmi = plannedEmiPaise ?? Math.floor(totalScheduledRepaymentPaise / tenureMonths);
    const basePrincipal = Math.floor(principalPaise / tenureMonths);

    const schedule: InstallmentScheduleItem[] = [];
    let remRepayment = totalScheduledRepaymentPaise;
    let remPrincipal = principalPaise;

    for (let i = 1; i <= tenureMonths; i++) {
      const isLast = i === tenureMonths;
      const emi = isLast ? remRepayment : baseEmi;
      const prin = isLast ? remPrincipal : basePrincipal;
      const int = emi - prin;

      remRepayment -= emi;
      remPrincipal -= prin;

      schedule.push({
        installmentNumber: i,
        paymentPaise: emi,
        principalPaise: prin,
        interestPaise: Math.max(0, int),
        remainingRepaymentBalancePaise: Math.max(0, remRepayment),
        remainingPrincipalPaise: Math.max(0, remPrincipal),
      });
    }

    return {
      schedule,
      totalScheduledRepaymentPaise,
      totalScheduledInterestPaise,
      monthlyInstallmentPaise: baseEmi,
    };
  }

  // Reducing Balance
  const monthlyEmi = plannedEmiPaise ?? calculateEMI(principalPaise, annualRateBps, tenureMonths);
  const monthlyRate = (annualRateBps / 10000) / 12;
  const schedule: InstallmentScheduleItem[] = [];

  let remPrincipal = principalPaise;
  let totalInterest = 0;
  let totalRepayment = 0;

  for (let i = 1; i <= tenureMonths; i++) {
    const isLast = i === tenureMonths;
    const interestPaise = annualRateBps === 0 ? 0 : Math.round(remPrincipal * monthlyRate);
    
    let principalPaiseItem = monthlyEmi - interestPaise;
    let emiItem = monthlyEmi;

    if (isLast || principalPaiseItem >= remPrincipal) {
      principalPaiseItem = remPrincipal;
      emiItem = principalPaiseItem + interestPaise;
    }

    remPrincipal -= principalPaiseItem;
    totalInterest += interestPaise;
    totalRepayment += emiItem;

    schedule.push({
      installmentNumber: i,
      paymentPaise: emiItem,
      principalPaise: principalPaiseItem,
      interestPaise,
      remainingRepaymentBalancePaise: 0,
      remainingPrincipalPaise: Math.max(0, remPrincipal),
    });
  }

  let runningRepayment = totalRepayment;
  for (const item of schedule) {
    runningRepayment -= item.paymentPaise;
    item.remainingRepaymentBalancePaise = Math.max(0, runningRepayment);
  }

  return {
    schedule,
    totalScheduledRepaymentPaise: totalRepayment,
    totalScheduledInterestPaise: totalInterest,
    monthlyInstallmentPaise: monthlyEmi,
  };
}

export interface ExistingLoanStateParams {
  originalPrincipalPaise: number;
  annualRateBps: number;
  totalTenureMonths: number;
  completedInstallments: number;
  monthlyEmiPaise: number;
  interestType?: InterestType;
  lenderOutstandingPaise?: number;
  lenderRemainingRepaymentPaise?: number;
}

export interface ExistingLoanStateResult {
  remainingInstallments: number;
  remainingInstallmentCount: number;
  effectiveAnnualRateBps: number;
  isEstimated: boolean;
  totalScheduledInterestPaise: number;
  totalScheduledRepaymentPaise: number;
  historicalPaymentsPaidPaise: number;
  historicalPrincipalPaidPaise: number;
  historicalInterestPaidPaise: number;
  calculatedOutstandingPrincipalPaise: number;
  calculatedRemainingRepaymentPaise: number;
  finalOutstandingPrincipalPaise: number;
  finalRemainingRepaymentPaise: number;
  remainingInterestEstimatePaise: number;
  schedule: InstallmentScheduleItem[];
}

/**
 * Calculate state, schedule, and balances for an existing / already started loan.
 * Accurately tracks completed vs remaining installments and month-by-month principal reduction.
 */
export function calculateExistingLoanState(
  params: ExistingLoanStateParams,
): ExistingLoanStateResult {
  const {
    originalPrincipalPaise,
    annualRateBps,
    totalTenureMonths,
    completedInstallments,
    monthlyEmiPaise,
    interestType = 'reducing_balance',
    lenderOutstandingPaise,
    lenderRemainingRepaymentPaise,
  } = params;

  const totalTenure = Math.max(1, Math.round(totalTenureMonths));
  const nCompleted = Math.max(0, Math.min(totalTenure, Math.round(completedInstallments)));
  const remainingInstallments = totalTenure - nCompleted;

  let effectiveRateBps = Math.max(0, Math.round(annualRateBps || 0));
  let isEstimated = false;

  const resolved = resolveLoanInterestRate({
    interestType,
    interestRateBps: effectiveRateBps,
    principalPaise: originalPrincipalPaise,
    monthlyEmiPaise,
    tenureMonths: totalTenure,
  });

  if (resolved.isValid) {
    effectiveRateBps = resolved.rateBps;
    isEstimated = resolved.isDerived;
  }

  const { schedule, totalScheduledInterestPaise, totalScheduledRepaymentPaise } =
    generateAmortizationSchedule({
      principalPaise: originalPrincipalPaise,
      annualRateBps: effectiveRateBps,
      tenureMonths: totalTenure,
      interestType,
      plannedEmiPaise: monthlyEmiPaise > 0 ? monthlyEmiPaise : undefined,
    });

  let historicalPaymentsPaidPaise = 0;
  let historicalPrincipalPaidPaise = 0;
  let historicalInterestPaidPaise = 0;

  for (let i = 0; i < nCompleted; i++) {
    if (schedule[i]) {
      historicalPaymentsPaidPaise += schedule[i].paymentPaise;
      historicalPrincipalPaidPaise += schedule[i].principalPaise;
      historicalInterestPaidPaise += schedule[i].interestPaise;
    }
  }

  let calculatedOutstandingPrincipalPaise = originalPrincipalPaise;
  let calculatedRemainingRepaymentPaise = totalScheduledRepaymentPaise;

  if (nCompleted > 0 && nCompleted <= schedule.length) {
    const lastCompleted = schedule[nCompleted - 1];
    calculatedOutstandingPrincipalPaise = lastCompleted.remainingPrincipalPaise;
    calculatedRemainingRepaymentPaise = lastCompleted.remainingRepaymentBalancePaise;
  }

  const finalOutstandingPrincipalPaise =
    lenderOutstandingPaise !== undefined && lenderOutstandingPaise >= 0
      ? lenderOutstandingPaise
      : calculatedOutstandingPrincipalPaise;

  const finalRemainingRepaymentPaise =
    lenderRemainingRepaymentPaise !== undefined && lenderRemainingRepaymentPaise >= 0
      ? lenderRemainingRepaymentPaise
      : calculatedRemainingRepaymentPaise;

  const remainingInterestEstimatePaise = Math.max(
    0,
    finalRemainingRepaymentPaise - finalOutstandingPrincipalPaise,
  );

  return {
    remainingInstallments,
    remainingInstallmentCount: remainingInstallments,
    effectiveAnnualRateBps: effectiveRateBps,
    isEstimated,
    totalScheduledInterestPaise,
    totalScheduledRepaymentPaise,
    historicalPaymentsPaidPaise,
    historicalPrincipalPaidPaise,
    historicalInterestPaidPaise,
    calculatedOutstandingPrincipalPaise,
    calculatedRemainingRepaymentPaise,
    finalOutstandingPrincipalPaise,
    finalRemainingRepaymentPaise,
    remainingInterestEstimatePaise,
    schedule,
  };
}


