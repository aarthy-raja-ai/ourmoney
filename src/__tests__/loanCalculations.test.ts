// Unit tests for Loan Calculations

import {
  calcMonthlyInterestPaise,
  calculateEMI,
  calculatePayoffMonths,
  calculateDebtFreeTarget,
} from '../utils/loanCalculations';

describe('Loan Calculations', () => {
  test('calcMonthlyInterestPaise computes 1 month interest on reducing balance', () => {
    // ₹100,000 at 12% p.a. (1200 bps) → 1% monthly = ₹1,000 (100,000 paise)
    const principalPaise = 10000000;
    const rateBps = 1200;
    expect(calcMonthlyInterestPaise(principalPaise, rateBps)).toBe(100000);
  });

  test('calculateEMI computes standard EMI formula', () => {
    // ₹100,000 at 12% p.a. for 12 months
    const principalPaise = 10000000;
    const rateBps = 1200;
    const tenureMonths = 12;
    const emi = calculateEMI(principalPaise, rateBps, tenureMonths);
    // EMI should be approx ₹8,885 (888488 paise)
    expect(emi).toBeGreaterThan(880000);
    expect(emi).toBeLessThan(890000);
  });

  test('calculatePayoffMonths determines payoff duration correctly', () => {
    // ₹50,000 balance, ₹5,000 payment/mo, 10% rate
    const months = calculatePayoffMonths(5000000, 1000, 500000, 'emi');
    expect(months).toBeGreaterThan(10);
    expect(months).toBeLessThan(12);
  });

  test('calculateDebtFreeTarget compares avalanche strategy', () => {
    const loans: any[] = [
      {
        id: '1',
        name: 'Personal Loan',
        currentBalancePaise: 5000000,
        annualInterestRateBps: 1500, // 15%
        minimumPaymentPaise: 200000,
        status: 'active',
      },
      {
        id: '2',
        name: 'Car Loan',
        currentBalancePaise: 10000000,
        annualInterestRateBps: 900, // 9%
        minimumPaymentPaise: 300000,
        status: 'active',
      },
    ];

    const result = calculateDebtFreeTarget(loans, 100000, 'avalanche');
    expect(result.estimatedMonthsToDebtFree).toBeGreaterThan(0);
  });
});
