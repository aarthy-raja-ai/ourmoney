// OurMoney — Reverse Interest Calculator & Schedule Tests

import {
  calculateReverseInterestRate,
  generateAmortizationSchedule,
  calculateEMI,
  compareAllInterestModels,
  resolveLoanInterestRate,
  calculateExistingLoanState,
} from '../utils/loanCalculations';

describe('Reverse Interest Calculator', () => {
  test('matches standard ₹3,00,000 / ₹11,770 EMI / 36-month example (~24.50% nominal p.a.)', () => {
    // Principal: ₹3,00,000 = 30000000 paise
    // Monthly EMI: ₹11,770 = 1177000 paise
    // Tenure: 36 months
    const result = calculateReverseInterestRate({
      principalPaise: 30000000,
      monthlyEmiPaise: 1177000,
      tenureMonths: 36,
      interestType: 'reducing_balance',
    });

    expect(result.isValid).toBe(true);
    expect(result.totalRepaymentPaise).toBe(42372000); // ₹4,23,720
    expect(result.totalInterestPaise).toBe(12372000);  // ₹1,23,720
    // Implied nominal annual interest rate approx 24.00% (2.00% monthly)
    expect(result.annualRatePercent).toBeGreaterThanOrEqual(23.9);
    expect(result.annualRatePercent).toBeLessThanOrEqual(24.5);
    expect(result.annualRateBps).toBeGreaterThanOrEqual(2390);
    expect(result.annualRateBps).toBeLessThanOrEqual(2450);
    // EAR approx 26.82%
    expect(result.effectiveAnnualRatePercent).toBeGreaterThan(26.0);
  });

  test('handles zero-interest loan correctly', () => {
    // ₹1,20,000 principal / ₹10,000 EMI / 12 months = 0% interest
    const result = calculateReverseInterestRate({
      principalPaise: 12000000,
      monthlyEmiPaise: 1000000,
      tenureMonths: 12,
      interestType: 'reducing_balance',
    });

    expect(result.isValid).toBe(true);
    expect(result.annualRateBps).toBe(0);
    expect(result.annualRatePercent).toBe(0);
    expect(result.effectiveAnnualRatePercent).toBe(0);
    expect(result.totalInterestPaise).toBe(0);
    expect(result.totalRepaymentPaise).toBe(12000000);
  });

  test('validates invalid inputs and prevents NaN / Infinity / negative rates', () => {
    // EMI * tenure < Principal (₹1,00,000 principal, ₹1,000 EMI for 12 months = ₹12,000 total)
    const invalidRepayment = calculateReverseInterestRate({
      principalPaise: 10000000,
      monthlyEmiPaise: 100000,
      tenureMonths: 12,
    });
    expect(invalidRepayment.isValid).toBe(false);
    expect(invalidRepayment.errorMessage).toContain('cannot be less than');

    // Non-positive inputs
    const zeroPrincipal = calculateReverseInterestRate({
      principalPaise: 0,
      monthlyEmiPaise: 1000,
      tenureMonths: 12,
    });
    expect(zeroPrincipal.isValid).toBe(false);

    const zeroEmi = calculateReverseInterestRate({
      principalPaise: 10000,
      monthlyEmiPaise: 0,
      tenureMonths: 12,
    });
    expect(zeroEmi.isValid).toBe(false);

    const zeroTenure = calculateReverseInterestRate({
      principalPaise: 10000,
      monthlyEmiPaise: 1000,
      tenureMonths: 0,
    });
    expect(zeroTenure.isValid).toBe(false);
  });

  test('calculates flat interest rate correctly', () => {
    // Principal: ₹2,00,000 (20000000 paise)
    // Flat Rate: 12% p.a.
    // Tenure: 12 months
    // Total Interest: ₹24,000 (2400000 paise)
    // Total Repayment: ₹2,24,000 (22400000 paise)
    // EMI: ₹18,666.67 (~1866667 paise)
    const emiPaise = Math.round(22400000 / 12);

    const result = calculateReverseInterestRate({
      principalPaise: 20000000,
      monthlyEmiPaise: emiPaise,
      tenureMonths: 12,
      interestType: 'flat',
    });

    expect(result.isValid).toBe(true);
    expect(result.annualRatePercent).toBe(12);
    expect(result.annualRateBps).toBe(1200);
    expect(result.disclaimer).toContain('Flat and reducing-balance rates are not directly comparable');
  });

  test('calculates simple interest rate correctly', () => {
    // Principal: ₹3,00,000, EMI: ₹11,770, Tenure: 36 months
    const result = calculateReverseInterestRate({
      principalPaise: 30000000,
      monthlyEmiPaise: 1177000,
      tenureMonths: 36,
      interestType: 'simple',
    });

    expect(result.isValid).toBe(true);
    expect(result.annualRatePercent).toBe(13.75); // (123,720 / 300,000) / 3 * 100
    expect(result.annualRateBps).toBe(1375);
    expect(result.disclaimer).toContain('simple interest rate');
  });

  test('compareAllInterestModels returns side-by-side results for all three models', () => {
    const { compareAllInterestModels } = require('../utils/loanCalculations');
    const comparison = compareAllInterestModels({
      principalPaise: 30000000,
      monthlyEmiPaise: 1177000,
      tenureMonths: 36,
    });

    expect(comparison.length).toBe(3);

    const reducing = comparison.find((c: any) => c.interestType === 'reducing_balance');
    const flat = comparison.find((c: any) => c.interestType === 'flat');
    const simple = comparison.find((c: any) => c.interestType === 'simple');

    expect(reducing?.isValid).toBe(true);
    expect(reducing?.annualRatePercent).toBeGreaterThanOrEqual(23.9);

    expect(flat?.isValid).toBe(true);
    expect(flat?.annualRatePercent).toBe(13.75);

    expect(simple?.isValid).toBe(true);
    expect(simple?.annualRatePercent).toBe(13.75);
    expect(simple?.totalRepaymentPaise).toBe(42372000);
  });
});

describe('Amortization Schedule & Final Installment Rounding', () => {
  test('corrects accumulated rounding difference on the final installment for flat interest', () => {
    // ₹2,00,000 principal, 12% flat rate, 12 months
    const schedResult = generateAmortizationSchedule({
      principalPaise: 20000000,
      annualRateBps: 1200,
      tenureMonths: 12,
      interestType: 'flat',
    });

    expect(schedResult.schedule.length).toBe(12);
    expect(schedResult.totalScheduledInterestPaise).toBe(2400000);
    expect(schedResult.totalScheduledRepaymentPaise).toBe(22400000);

    // Sum of all installments must exactly equal total scheduled repayment
    const totalPayments = schedResult.schedule.reduce((sum, item) => sum + item.paymentPaise, 0);
    expect(totalPayments).toBe(schedResult.totalScheduledRepaymentPaise);

    // Remaining repayment balance on final installment must be 0
    const lastItem = schedResult.schedule[11];
    expect(lastItem.remainingRepaymentBalancePaise).toBe(0);
    expect(lastItem.remainingPrincipalPaise).toBe(0);
  });

  test('corrects final installment for reducing balance loans', () => {
    // ₹1,00,000 principal, 10.5% bps (1050), 12 months
    const emi = calculateEMI(10000000, 1050, 12);
    const schedResult = generateAmortizationSchedule({
      principalPaise: 10000000,
      annualRateBps: 1050,
      tenureMonths: 12,
      interestType: 'reducing_balance',
      plannedEmiPaise: emi,
    });

    expect(schedResult.schedule.length).toBe(12);
    const totalPrincipalPaid = schedResult.schedule.reduce((sum, item) => sum + item.principalPaise, 0);
    expect(totalPrincipalPaid).toBe(10000000);

    const lastItem = schedResult.schedule[11];
    expect(lastItem.remainingPrincipalPaise).toBe(0);
    expect(lastItem.remainingRepaymentBalancePaise).toBe(0);
  });
});

describe('Existing Loans Calculation & Historical Payments', () => {
  const { calculateExistingLoanState } = require('../utils/loanCalculations');

  test('calculates reducing-balance existing loan state at month 6 of 36 months', () => {
    // ₹3,00,000 principal, 24% annual rate (2400 bps), 36 months, 6 completed installments
    const result = calculateExistingLoanState({
      originalPrincipalPaise: 30000000,
      annualRateBps: 2400,
      totalTenureMonths: 36,
      completedInstallments: 6,
      interestType: 'reducing_balance',
    });

    expect(result.schedule.length).toBe(36);
    expect(result.historicalPaymentsPaidPaise).toBeGreaterThan(0);
    // At month 6 of reducing balance, remaining principal is greater than origPrincipal - 6 * EMI
    // because early EMIs contain higher interest portions
    expect(result.calculatedOutstandingPrincipalPaise).toBeGreaterThan(
      30000000 - result.historicalPaymentsPaidPaise,
    );
    expect(result.remainingInstallmentCount).toBe(30);
    expect(result.finalOutstandingPrincipalPaise).toBe(result.calculatedOutstandingPrincipalPaise);
    expect(result.finalRemainingRepaymentPaise).toBe(result.calculatedRemainingRepaymentPaise);
  });

  test('reproduces and passes ₹3,00,000 principal / ₹11,770 EMI / 36-month / 8 completed installments test case', () => {
    // Original principal: ₹3,00,000 (30,000,000 paise)
    // Monthly EMI: ₹11,770 (1,177,000 paise)
    // Total tenure: 36 months
    // Completed installments: 8
    const result = calculateExistingLoanState({
      originalPrincipalPaise: 30000000,
      annualRateBps: 0, // rate not explicitly passed, inferred automatically
      totalTenureMonths: 36,
      completedInstallments: 8,
      monthlyEmiPaise: 1177000,
      interestType: 'reducing_balance',
    });

    expect(result.schedule.length).toBe(36);
    expect(result.remainingInstallments).toBe(28);

    // 1. Total historical payments paid = 8 * ₹11,770 = ₹94,160 (9,416,000 paise)
    expect(result.historicalPaymentsPaidPaise).toBe(9416000);

    // 2. Outstanding principal must NOT equal ₹2,05,840 (linear subtraction 300000 - 94160)
    expect(result.finalOutstandingPrincipalPaise).not.toBe(20584000);
    // Calculated amortized principal at Month 8 is ~₹2,47,736 (24,773,639 paise)
    expect(result.finalOutstandingPrincipalPaise).toBeGreaterThan(24000000);
    expect(result.finalOutstandingPrincipalPaise).toBeLessThan(25500000);

    // 3. Remaining repayment obligation = 28 * ₹11,770 = ₹3,29,560 (subject to rounding absorption)
    expect(result.finalRemainingRepaymentPaise).toBeGreaterThan(32900000);
    expect(result.finalRemainingRepaymentPaise).toBeLessThan(33000000);

    // 4. Validate historical principal paid vs historical interest paid
    expect(result.historicalPrincipalPaidPaise).toBeGreaterThan(4500000);
    expect(result.historicalInterestPaidPaise).toBeGreaterThan(4000000);
    expect(result.historicalPrincipalPaidPaise + result.historicalInterestPaidPaise).toBe(9416000);
  });

  test('progresses to 27 remaining installments after recording 9th installment', () => {
    const after9th = calculateExistingLoanState({
      originalPrincipalPaise: 30000000,
      annualRateBps: 0,
      totalTenureMonths: 36,
      completedInstallments: 9,
      monthlyEmiPaise: 1177000,
      interestType: 'reducing_balance',
    });

    expect(after9th.remainingInstallments).toBe(27);
    expect(after9th.historicalPaymentsPaidPaise).toBe(9 * 1177000); // ₹1,05,930
    expect(after9th.finalOutstandingPrincipalPaise).toBeLessThan(24773639);
  });

  test('applies lender-confirmed outstanding principal & remaining repayment overrides', () => {
    const result = calculateExistingLoanState({
      originalPrincipalPaise: 30000000,
      annualRateBps: 2400,
      totalTenureMonths: 36,
      completedInstallments: 6,
      interestType: 'reducing_balance',
      lenderOutstandingPaise: 26500000, // ₹2,65,000 lender confirmed
      lenderRemainingRepaymentPaise: 35000000, // ₹3,50,000 lender confirmed
    });

    expect(result.finalOutstandingPrincipalPaise).toBe(26500000);
    expect(result.finalRemainingRepaymentPaise).toBe(35000000);
  });
});

describe('Loan Details Interest Rate Synchronization & Selection', () => {
  const principalPaise = 30000000; // ₹3,00,000
  const monthlyEmiPaise = 1177000; // ₹11,770
  const tenureMonths = 36;

  test('1. Selecting Flat Interest displays ~13.75% p.a. (Flat) in both summary and comparison', () => {
    // Summary rate resolution
    const summaryRate = resolveLoanInterestRate({
      interestType: 'flat',
      interestRateBps: 0, // Unstated or legacy 0 in saved loan
      principalPaise,
      monthlyEmiPaise,
      tenureMonths,
    });

    // Comparison card model results
    const comparison = compareAllInterestModels({
      principalPaise,
      monthlyEmiPaise,
      tenureMonths,
    });
    const flatComparisonItem = comparison.find((c) => c.interestType === 'flat');

    expect(summaryRate.isValid).toBe(true);
    expect(summaryRate.displayText).toBe('13.75% p.a. (Flat)');
    expect(summaryRate.ratePercent).toBe(13.75);
    expect(summaryRate.rateBps).toBe(1375);

    expect(flatComparisonItem).toBeDefined();
    expect(flatComparisonItem?.isValid).toBe(true);
    expect(flatComparisonItem?.annualRatePercent).toBe(13.75);
    expect(flatComparisonItem?.annualRateBps).toBe(1375);

    // Summary and comparison match exactly
    expect(summaryRate.ratePercent).toBe(flatComparisonItem?.annualRatePercent);
    expect(summaryRate.rateBps).toBe(flatComparisonItem?.annualRateBps);
  });

  test('2. Selecting Reducing Balance displays its own derived rate (~24.00% p.a.) in both places', () => {
    // Summary rate resolution
    const summaryRate = resolveLoanInterestRate({
      interestType: 'reducing_balance',
      interestRateBps: 0,
      principalPaise,
      monthlyEmiPaise,
      tenureMonths,
    });

    // Comparison card model results
    const comparison = compareAllInterestModels({
      principalPaise,
      monthlyEmiPaise,
      tenureMonths,
    });
    const reducingItem = comparison.find((c) => c.interestType === 'reducing_balance');

    expect(summaryRate.isValid).toBe(true);
    expect(summaryRate.displayText).toBe('24.00% p.a. (Reducing)');
    expect(summaryRate.ratePercent).toBe(24.0);
    expect(summaryRate.rateBps).toBe(2400);

    expect(reducingItem).toBeDefined();
    expect(reducingItem?.isValid).toBe(true);
    expect(reducingItem?.annualRatePercent).toBe(24.0);
    expect(reducingItem?.annualRateBps).toBe(2400);

    // Summary and comparison match exactly
    expect(summaryRate.ratePercent).toBe(reducingItem?.annualRatePercent);
    expect(summaryRate.rateBps).toBe(reducingItem?.annualRateBps);
  });

  test('3. Selecting Simple Interest displays its own derived rate (~13.75% p.a.) in both places', () => {
    // Summary rate resolution
    const summaryRate = resolveLoanInterestRate({
      interestType: 'simple',
      interestRateBps: 0,
      principalPaise,
      monthlyEmiPaise,
      tenureMonths,
    });

    // Comparison card model results
    const comparison = compareAllInterestModels({
      principalPaise,
      monthlyEmiPaise,
      tenureMonths,
    });
    const simpleItem = comparison.find((c) => c.interestType === 'simple');

    expect(summaryRate.isValid).toBe(true);
    expect(summaryRate.displayText).toBe('13.75% p.a. (Simple)');
    expect(summaryRate.ratePercent).toBe(13.75);
    expect(summaryRate.rateBps).toBe(1375);

    expect(simpleItem).toBeDefined();
    expect(simpleItem?.isValid).toBe(true);
    expect(simpleItem?.annualRatePercent).toBe(13.75);
    expect(simpleItem?.annualRateBps).toBe(1375);

    // Summary and comparison match exactly
    expect(summaryRate.ratePercent).toBe(simpleItem?.annualRatePercent);
    expect(summaryRate.rateBps).toBe(simpleItem?.annualRateBps);
  });

  test('4. Saving and reopening a loan does not reset summary to 0%', () => {
    // Simulate loan saved in Firestore with interestRateBps: 0 and interestType: 'flat'
    const savedLoan = {
      originalAmountPaise: 30000000,
      plannedPaymentPaise: 1177000,
      tenureMonths: 36,
      interestType: 'flat' as const,
      interestRateBps: 0, // Legacy/unknown rate saved as 0
      completedInstallments: 7,
    };

    // Upon reopening, rate resolution must derive 13.75% rather than falling back to 0.00%
    const resolvedUponReopen = resolveLoanInterestRate({
      interestType: savedLoan.interestType,
      interestRateBps: savedLoan.interestRateBps,
      principalPaise: savedLoan.originalAmountPaise,
      monthlyEmiPaise: savedLoan.plannedPaymentPaise,
      tenureMonths: savedLoan.tenureMonths,
    });

    expect(resolvedUponReopen.isValid).toBe(true);
    expect(resolvedUponReopen.displayText).toBe('13.75% p.a. (Flat)');
    expect(resolvedUponReopen.displayText).not.toContain('0.00%');
    expect(resolvedUponReopen.rateBps).toBe(1375);

    // Existing loan amortization state also uses the resolved rate
    const state = calculateExistingLoanState({
      originalPrincipalPaise: savedLoan.originalAmountPaise,
      annualRateBps: resolvedUponReopen.rateBps,
      totalTenureMonths: savedLoan.tenureMonths,
      completedInstallments: savedLoan.completedInstallments,
      monthlyEmiPaise: savedLoan.plannedPaymentPaise,
      interestType: savedLoan.interestType,
    });

    expect(state.effectiveAnnualRateBps).toBe(1375);
    expect(state.remainingInstallmentCount).toBe(29);
  });

  test('5. Changing the selected model updates the summary immediately', () => {
    // Start with Flat
    let currentModel: 'flat' | 'reducing_balance' | 'simple' = 'flat';
    let rate = resolveLoanInterestRate({
      interestType: currentModel,
      principalPaise,
      monthlyEmiPaise,
      tenureMonths,
    });
    expect(rate.displayText).toBe('13.75% p.a. (Flat)');

    // User switches to Reducing Balance
    currentModel = 'reducing_balance';
    rate = resolveLoanInterestRate({
      interestType: currentModel,
      principalPaise,
      monthlyEmiPaise,
      tenureMonths,
    });
    expect(rate.displayText).toBe('24.00% p.a. (Reducing)');

    // User switches to Simple Interest
    currentModel = 'simple';
    rate = resolveLoanInterestRate({
      interestType: currentModel,
      principalPaise,
      monthlyEmiPaise,
      tenureMonths,
    });
    expect(rate.displayText).toBe('13.75% p.a. (Simple)');
  });

  test('6. Displays explicit unavailable state when inputs genuinely cannot produce a valid rate', () => {
    // E.g. Zero principal with no explicit rate
    const invalidRate = resolveLoanInterestRate({
      interestType: 'flat',
      interestRateBps: 0,
      principalPaise: 0,
      monthlyEmiPaise: 1177000,
      tenureMonths: 36,
    });

    expect(invalidRate.isValid).toBe(false);
    expect(invalidRate.displayText).toBe('Unavailable (Flat)');
    expect(invalidRate.displayText).not.toContain('0.00%');
    expect(invalidRate.rateBps).toBe(0);

    // Total repayment < Principal with 0 explicit rate
    const tooLowEmi = resolveLoanInterestRate({
      interestType: 'reducing_balance',
      interestRateBps: 0,
      principalPaise: 30000000,
      monthlyEmiPaise: 1000, // ₹10 monthly on ₹3 Lakh loan
      tenureMonths: 12,
    });

    expect(tooLowEmi.isValid).toBe(false);
    expect(tooLowEmi.displayText).toBe('Unavailable (Reducing)');
    expect(tooLowEmi.displayText).not.toContain('0.00%');
  });
});

