// Unit tests for Currency utilities

import {
  rupeesToPaise,
  paiseToRupees,
  formatCurrency,
  formatCompactCurrency,
  parseCurrencyInput,
} from '../utils/currency';

describe('Currency Utilities', () => {
  test('rupeesToPaise converts correctly without floating point errors', () => {
    expect(rupeesToPaise(100)).toBe(10000);
    expect(rupeesToPaise(10.5)).toBe(1050);
    expect(rupeesToPaise(0.99)).toBe(99);
    expect(rupeesToPaise(12345.67)).toBe(1234567);
  });

  test('paiseToRupees converts correctly', () => {
    expect(paiseToRupees(10000)).toBe(100);
    expect(paiseToRupees(1050)).toBe(10.5);
    expect(paiseToRupees(99)).toBe(0.99);
  });

  test('formatCurrency formats Indian Rupees with symbol', () => {
    expect(formatCurrency(10000)).toBe('₹100');
    expect(formatCurrency(1050)).toBe('₹10.50');
    expect(formatCurrency(10000000)).toBe('₹1,00,000'); // Indian numbering system
  });

  test('formatCompactCurrency formats large numbers cleanly', () => {
    expect(formatCompactCurrency(10000000)).toBe('₹1L'); // 1 Lakh
    expect(formatCompactCurrency(100000000)).toBe('₹10L');
    expect(formatCompactCurrency(1000000000)).toBe('₹1Cr'); // 1 Crore
  });

  test('parseCurrencyInput handles various string formats', () => {
    expect(parseCurrencyInput('100')).toBe(10000);
    expect(parseCurrencyInput('₹1,000.50')).toBe(100050);
    expect(parseCurrencyInput('abc')).toBe(0);
    expect(parseCurrencyInput('-50')).toBe(0);
  });
});
