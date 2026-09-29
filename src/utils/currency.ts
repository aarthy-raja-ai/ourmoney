// OurMoney — Currency Utilities
// All amounts are stored as INTEGER PAISE to avoid floating-point errors.
// ₹850.50 → 85050 paise
// 85050 paise → ₹850.50

/**
 * Convert rupees (number or string) to paise (integer).
 * Handles decimals safely.
 */
export function rupeesToPaise(rupees: number | string): number {
  const r = typeof rupees === 'string' ? parseFloat(rupees) : rupees;
  if (isNaN(r) || !isFinite(r)) return 0;
  // Round to nearest paise to avoid floating-point issues
  return Math.round(r * 100);
}

/**
 * Convert paise (integer) to rupees (number).
 */
export function paiseToRupees(paise: number): number {
  return paise / 100;
}

/**
 * Format paise as a display string with ₹ symbol.
 * Examples:
 *   85050 → "₹850.50"
 *   150000 → "₹1,500.00"
 *   10000000 → "₹1,00,000.00"  (Indian number format)
 */
export function formatAmount(paise: number): string {
  const rupees = paiseToRupees(paise);
  return formatRupees(rupees);
}

/**
 * Format a rupee amount with Indian number formatting.
 */
export function formatRupees(rupees: number): string {
  if (isNaN(rupees) || !isFinite(rupees)) return '₹0.00';

  const isNegative = rupees < 0;
  const abs = Math.abs(rupees);

  // Use Intl for proper formatting — Indian locale
  const formatted = abs.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return `${isNegative ? '-' : ''}₹${formatted}`;
}

/**
 * Format paise as a compact display string for charts/summaries.
 * Examples:
 *   85050 → "₹850"
 *   100000 → "₹1,000"
 *   10000000 → "₹1L"  (lakh)
 *   100000000 → "₹1Cr" (crore)
 */
export function formatAmountCompact(paise: number): string {
  const rupees = paiseToRupees(paise);
  const abs = Math.abs(rupees);

  if (abs >= 10_000_000) {
    return `₹${(rupees / 10_000_000).toFixed(1)}Cr`;
  }
  if (abs >= 100_000) {
    return `₹${(rupees / 100_000).toFixed(1)}L`;
  }
  if (abs >= 1_000) {
    return `₹${(rupees / 1_000).toFixed(1)}K`;
  }
  return `₹${Math.round(rupees)}`;
}

/**
 * Safe addition of paise values (integer arithmetic).
 */
export function addPaise(...values: number[]): number {
  return values.reduce((sum, v) => sum + Math.round(v), 0);
}

/**
 * Safe subtraction of paise values.
 */
export function subtractPaise(a: number, b: number): number {
  return Math.round(a) - Math.round(b);
}

/**
 * Parse a user-typed rupee string to paise, returning 0 for invalid input.
 */
export function parseRupeeInput(input: string): number {
  const cleaned = input.replace(/[₹,\s]/g, '');
  const parsed = parseFloat(cleaned);
  if (isNaN(parsed) || !isFinite(parsed) || parsed < 0) return 0;
  return rupeesToPaise(parsed);
}

/**
 * Format a rupee input string for display in a text field
 * (no ₹ symbol, just number with up to 2 decimal places).
 */
export function formatRupeeInput(paise: number): string {
  if (paise === 0) return '';
  return paiseToRupees(paise).toFixed(2).replace(/\.?0+$/, '');
}

/**
 * Calculate percentage — returns a number 0–100+.
 * Safe: returns 0 if total is 0.
 */
export function calcPercentage(part: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((part / total) * 100 * 10) / 10; // 1 decimal place
}

/**
 * Convert basis points to percentage string.
 * 1050 bps → "10.50%"
 */
export function bpsToPercent(bps: number): string {
  return `${(bps / 100).toFixed(2)}%`;
}

/**
 * Convert percentage string to basis points.
 * "10.5" → 1050
 */
export function percentToBps(percent: string | number): number {
  const p = typeof percent === 'string' ? parseFloat(percent) : percent;
  if (isNaN(p)) return 0;
  return Math.round(p * 100);
}
